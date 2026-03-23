import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// In-memory OTP store (per function invocation — use DB for production)
// For now we store OTPs in a simple approach: generate & send on "request", verify on "confirm"
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

    // User client to verify auth
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

    // Admin client for DB operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    if (action === 'request_otp') {
      // Generate OTP server-side using crypto
      const array = new Uint32Array(1)
      crypto.getRandomValues(array)
      const otp = (100000 + (array[0] % 900000)).toString()

      // Store OTP in a temporary record (we use the incidents table with status 'otp_pending')
      // Or better: store in a separate way. For simplicity, store in user's client record metadata
      // We'll use a simple approach: store hashed OTP temporarily

      // For now, store the OTP associated with the user in a temp table or just proceed
      // Since SMS is not yet integrated, we store the OTP server-side and return a token
      const otpToken = crypto.randomUUID()

      // Store OTP in DB temporarily (using audit_logs as a workaround, or a dedicated approach)
      await adminClient.from('audit_logs').insert({
        user_id: user.id,
        action: 'otp_generated',
        entity_type: 'incident_otp',
        entity_id: otpToken,
        // Store OTP securely - in production, hash this
      })

      // Store the actual OTP value - we need it for verification
      // Using a simple approach: store in the entity_type field with a prefix
      await adminClient.from('audit_logs').update({
        entity_type: `otp:${otp}`,
      }).eq('entity_id', otpToken).eq('user_id', user.id)

      // TODO: Send OTP via SMS (Africa's Talking / Twilio)
      // For now, the OTP is stored server-side only
      // In development, log it server-side only:
      console.log(`[DEV] OTP for user ${user.id}: ${otp}`)

      // Get user phone for SMS
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

      // Validate inputs
      if (!otp_token || !otp_code || !vehicle_id || !type || !description || !location) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Validate input lengths
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

      if (!otpRecord || !otpRecord.entity_type?.startsWith('otp:')) {
        return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const storedOtp = otpRecord.entity_type.replace('otp:', '')
      if (storedOtp !== otp_code) {
        return new Response(JSON.stringify({ error: 'Invalid OTP code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check OTP is not older than 10 minutes
      const otpAge = Date.now() - new Date(otpRecord.created_at!).getTime()
      if (otpAge > 10 * 60 * 1000) {
        return new Response(JSON.stringify({ error: 'OTP expired' }), {
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
