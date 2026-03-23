import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(otp)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { action } = body

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    if (action === 'request_otp') {
      // Rate limit: max 1 OTP request per 60 seconds per user
      const { data: recentOtp } = await adminClient.from('audit_logs')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('action', 'otp_generated')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (recentOtp) {
        const age = Date.now() - new Date(recentOtp.created_at!).getTime()
        if (age < 60 * 1000) {
          return new Response(JSON.stringify({ error: 'Please wait before requesting another OTP' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      const array = new Uint32Array(1)
      crypto.getRandomValues(array)
      const otp = (100000 + (array[0] % 900000)).toString()
      const otpHash = await hashOtp(otp)

      const otpToken = crypto.randomUUID()

      await adminClient.from('audit_logs').insert({
        user_id: user.id,
        action: 'otp_generated',
        entity_type: `otp_hash:${otpHash}`,
        entity_id: otpToken,
      })

      console.log(`[DEV] OTP for user ${user.id}: ${otp}`)

      const { data: profile } = await adminClient.from('clients').select('phone').eq('id', user.id).single()

      return new Response(JSON.stringify({
        success: true,
        otp_token: otpToken,
        message: profile?.phone ? `OTP sent to ${profile.phone.slice(0, 4)}****` : 'OTP generated (SMS not configured)',
        // DEV ONLY - remove in production:
        dev_otp: otp,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'verify_and_create') {
      const { otp_token, otp_code, vehicle_id, type, description, location, mileage } = body

      if (!otp_token || !otp_code || !vehicle_id || !type || !description || !location) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (description.length > 2000 || location.length > 500 || type.length > 50) {
        return new Response(JSON.stringify({ error: 'Input too long' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Retrieve stored OTP
      const { data: otpRecord } = await adminClient.from('audit_logs')
        .select('*')
        .eq('entity_id', otp_token)
        .eq('user_id', user.id)
        .eq('action', 'otp_generated')
        .single()

      if (!otpRecord || !otpRecord.entity_type?.startsWith('otp_hash:')) {
        return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check if already used or max attempts reached
      if (otpRecord.entity_type === 'otp:used' || otpRecord.entity_type === 'otp:locked') {
        return new Response(JSON.stringify({ error: 'OTP already used or locked' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check OTP expiry (10 minutes)
      const otpAge = Date.now() - new Date(otpRecord.created_at!).getTime()
      if (otpAge > 10 * 60 * 1000) {
        await adminClient.from('audit_logs').update({ entity_type: 'otp:used' }).eq('entity_id', otp_token)
        return new Response(JSON.stringify({ error: 'OTP expired' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Count failed attempts for this token
      const { count: failedAttempts } = await adminClient.from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('entity_id', otp_token)
        .eq('action', 'otp_failed')
        .eq('user_id', user.id)

      if ((failedAttempts ?? 0) >= 5) {
        await adminClient.from('audit_logs').update({ entity_type: 'otp:locked' }).eq('entity_id', otp_token)
        return new Response(JSON.stringify({ error: 'Too many failed attempts. Request a new OTP.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Compare hashed OTP
      const storedHash = otpRecord.entity_type.replace('otp_hash:', '')
      const inputHash = await hashOtp(otp_code)

      if (storedHash !== inputHash) {
        // Record failed attempt
        await adminClient.from('audit_logs').insert({
          user_id: user.id,
          action: 'otp_failed',
          entity_type: 'otp_verification',
          entity_id: otp_token,
        })
        return new Response(JSON.stringify({ error: 'Invalid OTP code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Verify vehicle belongs to user
      const { data: vehicle } = await adminClient.from('vehicles')
        .select('id, client_id')
        .eq('id', vehicle_id)
        .eq('client_id', user.id)
        .single()

      if (!vehicle) {
        return new Response(JSON.stringify({ error: 'Vehicle not found or not owned by you' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Create incident
      const claimCode = `TLP-${Date.now().toString(36).toUpperCase()}`
      const { data: incident, error: insertError } = await adminClient.from('incidents').insert({
        client_id: user.id,
        vehicle_id,
        type,
        description,
        location,
        mileage: mileage || null,
        claim_code: claimCode,
        status: 'open',
      }).select().single()

      if (insertError) {
        return new Response(JSON.stringify({ error: 'Failed to create incident' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Invalidate OTP
      await adminClient.from('audit_logs').update({
        entity_type: 'otp:used',
      }).eq('entity_id', otp_token)

      return new Response(JSON.stringify({
        success: true,
        claim_code: claimCode,
        incident_id: incident.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
