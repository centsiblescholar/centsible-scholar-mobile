// create-coaching-iap-order
//
// Called by the mobile app immediately BEFORE triggering an Apple IAP purchase
// for a One-on-One Coaching session (product id: `one_on_one_coaching`).
//
// Apple StoreKit does not allow attaching metadata to an IAP the way Stripe's
// Checkout does, so we cannot ferry the buyer's name/phone/best-time/notes
// through the purchase receipt. Instead, the mobile app collects those fields
// in a form and calls this function to persist them as a `pending` row in
// `coaching_orders`. When RevenueCat later fires INITIAL_PURCHASE to the
// `revenuecat-webhook` function, that handler finds the pending row (ordered
// by most recent for the authenticated user), flips it to `paid`, stamps the
// Apple original_transaction_id for idempotency, and sends the notification
// email to Dr. Rich at COACHING_NOTIFICATION_EMAIL.
//
// This function only does step 1 (create pending). It never writes `paid`
// status — that's the webhook's job.
//
// Returns: { orderId: string }
//
// Errors:
//   401 — no auth header / invalid token
//   400 — invalid body / missing required field (phoneNumber)
//   500 — DB insert failed

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : ''
  console.log(`[CREATE-COACHING-IAP-ORDER] ${step}${detailsStr}`)
}

// Canonical coaching product id (matches src/constants/coachingProduct.ts
// and the App Store Connect productID).
const COACHING_PRODUCT_ID = 'one_on_one_coaching'
const COACHING_AMOUNT_CENTS = 8900 // $89.00

interface CreatePendingBody {
  customerName?: string
  phoneNumber?: string
  bestDayToCall?: string
  bestTimeToCall?: string
  sessionNotes?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // ─── Auth ─────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
    if (authError || !user) {
      logStep('Auth failed', { error: authError?.message })
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    logStep('User authenticated', { userId: user.id, email: user.email })

    // ─── Parse body ───────────────────────────────────────────────────────
    let body: CreatePendingBody = {}
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const customerName = (body.customerName || '').trim()
    const phoneNumber = (body.phoneNumber || '').trim()
    const bestDayToCall = (body.bestDayToCall || '').trim()
    const bestTimeToCall = (body.bestTimeToCall || '').trim()
    const sessionNotes = (body.sessionNotes || '').trim()

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'phoneNumber is required to book a coaching session' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // ─── Insert pending row via service role ─────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('coaching_orders')
      .insert({
        user_id: user.id,
        amount: COACHING_AMOUNT_CENTS,
        currency: 'usd',
        status: 'pending',
        platform: 'apple',
        iap_product_id: COACHING_PRODUCT_ID,
        customer_email: user.email ?? null,
        customer_name: customerName || null,
        customer_phone: phoneNumber,
        best_day_to_call: bestDayToCall || null,
        best_time_to_call: bestTimeToCall || null,
        session_notes: sessionNotes || null,
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      logStep('Insert failed', { error: insertError?.message })
      return new Response(
        JSON.stringify({ error: insertError?.message || 'Failed to create coaching order' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    logStep('Pending coaching order created', {
      orderId: inserted.id,
      userId: user.id,
    })

    return new Response(JSON.stringify({ orderId: inserted.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    logStep('Unhandled error', { error: message })
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
