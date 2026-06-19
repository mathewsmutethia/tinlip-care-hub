import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Base allowed origins — add Vercel/custom domain URLs via ALLOWED_ORIGINS_EXTRA env var
// (comma-separated list, set in Supabase Dashboard → Edge Functions → Secrets)
const BASE_ALLOWED_ORIGINS = [
  'https://tinlip-care-hub.lovable.app',
]

function getAllowedOrigins(): string[] {
  const extra = Deno.env.get('ALLOWED_ORIGINS_EXTRA') ?? ''
  const extraOrigins = extra.split(',').map(s => s.trim()).filter(Boolean)
  return [...BASE_ALLOWED_ORIGINS, ...extraOrigins]
}

function getCorsHeaders(req: Request): Record<string, string> {
  const allowedOrigins = getAllowedOrigins()
  const origin = req.headers.get('Origin') ?? ''
  const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')
  const allowedOrigin = allowedOrigins.includes(origin) || isLocalhost ? origin : BASE_ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(otp)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateClaimCode(): string {
  const randomBytes = new Uint8Array(6)
  crypto.getRandomValues(randomBytes)
  return `TLP-${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Redis rate limiting via Upstash REST API
// Max 3 OTP requests per user per 2 minutes
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Supabase secrets
async function checkRedisRateLimit(userId: string): Promise<{ limited: boolean; skipped: boolean }> {
  const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL')
  const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')

  if (!redisUrl || !redisToken) {
    return { limited: false, skipped: true }
  }

  const key = `otp_rate:${userId}`
  const headers = { Authorization: `Bearer ${redisToken}` }

  try {
    // Atomically increment and return new count
    const incrRes = await fetch(`${redisUrl}/incr/${key}`, { headers })
    if (!incrRes.ok) return { limited: false, skipped: true }
    const { result: count } = await incrRes.json()

    // Set 2-minute TTL on first request only (EXPIRE is a no-op on subsequent calls when key already has TTL)
    if (count === 1) {
      await fetch(`${redisUrl}/expire/${key}/120`, { headers })
    }

    return { limited: count > 3, skipped: false }
  } catch {
    // Redis unavailable — fail open (don't block the user, Postgres rate limit still applies)
    return { limited: false, skipped: true }
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401, corsHeaders)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user via Auth API — avoids local JWT parsing (ES256 compat)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders)
    }

    const body = await req.json()
    const { action } = body

    if (action === 'request_otp') {
      // Redis rate limit check — fast, protects SMS/email credits before hitting the DB
      const { limited } = await checkRedisRateLimit(user.id)
      if (limited) {
        return jsonResponse({ error: 'Please wait before requesting another OTP' }, 429, corsHeaders)
      }

      const array = new Uint32Array(1)
      crypto.getRandomValues(array)
      const otp = (100000 + (array[0] % 900000)).toString()
      const otpHash = await hashOtp(otp)
      const otpToken = crypto.randomUUID()

      // Atomic: advisory lock + rate-limit check + insert in one transaction
      const { data: result, error: rpcError } = await adminClient.rpc('generate_otp_record', {
        p_user_id: user.id,
        p_otp_hash: otpHash,
        p_otp_token: otpToken,
      })

      if (rpcError) {
        return jsonResponse({ error: 'Failed to generate OTP' }, 500, corsHeaders)
      }

      if (result?.rate_limited) {
        return jsonResponse({ error: 'Please wait before requesting another OTP' }, 429, corsHeaders)
      }

      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      let deliveryMessage = 'OTP generated — email delivery not configured'

      if (resendApiKey && user.email) {
        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: Deno.env.get('RESEND_FROM_EMAIL') ?? 'Tinlip Autocare <onboarding@resend.dev>',
              to: user.email,
              subject: 'Your Tinlip incident verification code',
              html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                  <h2 style="color:#1a1a1a">Verify your incident request</h2>
                  <p style="color:#555">Use the code below to confirm your incident. It expires in 10 minutes.</p>
                  <div style="font-size:36px;font-weight:700;letter-spacing:8px;padding:24px;background:#f5f5f5;border-radius:8px;text-align:center;font-family:monospace">
                    ${otp}
                  </div>
                  <p style="color:#999;font-size:12px;margin-top:24px">If you did not request this, ignore this email.</p>
                </div>
              `,
            }),
          })
          if (emailRes.ok) {
            const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
            deliveryMessage = `Verification code sent to ${maskedEmail}`
          } else {
            deliveryMessage = 'OTP generated — check your email'
          }
        } catch {
          deliveryMessage = 'OTP generated — check your email'
        }
      }

      return jsonResponse({
        success: true,
        otp_token: otpToken,
        message: deliveryMessage,
      }, 200, corsHeaders)
    }

    if (action === 'verify_and_create') {
      const { otp_token, otp_code, vehicle_id, type, description, location, mileage } = body

      if (!otp_token || !otp_code || !vehicle_id || !type || !description || !location) {
        return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders)
      }

      const VALID_INCIDENT_TYPES = ['regular_service', 'roadside_assistance', 'towing', 'mechanical_diagnosis', 'spares_request']

      if (
        typeof description !== 'string' || description.length > 2000 ||
        typeof location !== 'string' || location.length > 500 ||
        typeof type !== 'string' || !VALID_INCIDENT_TYPES.includes(type)
      ) {
        return jsonResponse({ error: 'Input too long or invalid type' }, 400, corsHeaders)
      }

      if (mileage !== undefined && mileage !== null) {
        const parsedMileage = Number(mileage)
        if (!Number.isFinite(parsedMileage) || parsedMileage < 0 || parsedMileage > 999999) {
          return jsonResponse({ error: 'Invalid mileage value' }, 400, corsHeaders)
        }
      }

      const inputHash = await hashOtp(otp_code)

      // Atomic: row-level lock + expiry + attempt count + invalidation in one transaction
      const { data: verifyResult, error: verifyError } = await adminClient.rpc('verify_and_invalidate_otp', {
        p_user_id: user.id,
        p_otp_token: otp_token,
        p_input_hash: inputHash,
      })

      if (verifyError) {
        return jsonResponse({ error: 'Failed to verify OTP' }, 500, corsHeaders)
      }

      const status = verifyResult?.status
      if (status === 'invalid') return jsonResponse({ error: 'Invalid or expired OTP' }, 400, corsHeaders)
      if (status === 'used_or_locked') return jsonResponse({ error: 'OTP already used or locked' }, 400, corsHeaders)
      if (status === 'expired') return jsonResponse({ error: 'OTP expired' }, 400, corsHeaders)
      if (status === 'locked') return jsonResponse({ error: 'Too many failed attempts. Request a new OTP.' }, 429, corsHeaders)
      if (status === 'wrong_code') return jsonResponse({ error: 'Invalid OTP code' }, 400, corsHeaders)
      if (status !== 'valid') return jsonResponse({ error: 'OTP verification failed' }, 400, corsHeaders)

      // Verify vehicle belongs to user
      const { data: vehicle } = await adminClient.from('vehicles')
        .select('id, client_id')
        .eq('id', vehicle_id)
        .eq('client_id', user.id)
        .single()

      if (!vehicle) {
        return jsonResponse({ error: 'Vehicle not found or not owned by you' }, 403, corsHeaders)
      }

      // Create incident with cryptographically random claim code
      const claimCode = generateClaimCode()
      const { data: incident, error: insertError } = await adminClient.from('incidents').insert({
        client_id: user.id,
        vehicle_id,
        type,
        description,
        location,
        mileage: mileage != null ? Number(mileage) : null,
        claim_code: claimCode,
        status: 'open',
      }).select().single()

      if (insertError) {
        return jsonResponse({ error: 'Failed to create incident' }, 500, corsHeaders)
      }

      return jsonResponse({
        success: true,
        claim_code: claimCode,
        incident_id: incident.id,
      }, 200, corsHeaders)
    }

    return jsonResponse({ error: 'Invalid action' }, 400, corsHeaders)

  } catch (_e) {
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders)
  }
})
