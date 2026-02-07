import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// ─── Structured Logging ───────────────────────────────────────────────────────
const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[REVENUECAT-WEBHOOK] ${step}`, details ? JSON.stringify(details) : '')
}

// ─── Product ID to Subscription Type Mapping ──────────────────────────────────
const PRODUCT_TYPE_MAP: Record<string, string> = {
  'com.centsiblescholar.single.monthly': 'single',
  'com.centsiblescholar.single.annual': 'single',
  'com.centsiblescholar.midsize.monthly': 'midsize',
  'com.centsiblescholar.midsize.annual': 'midsize',
  'com.centsiblescholar.large.monthly': 'large',
  'com.centsiblescholar.large.annual': 'large',
}

// ─── Store to Platform Mapping ────────────────────────────────────────────────
const STORE_PLATFORM_MAP: Record<string, string> = {
  'APP_STORE': 'apple',
  'PLAY_STORE': 'google',
}

// ─── Idempotency ──────────────────────────────────────────────────────────────

// Check if event was already processed - returns true if duplicate
async function checkIdempotency(
  supabaseAdmin: ReturnType<typeof createClient>,
  eventId: string
): Promise<{ alreadyProcessed: boolean }> {
  const { data: existing } = await supabaseAdmin
    .from('webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle()

  return { alreadyProcessed: !!existing }
}

// Record event as processed for future idempotency checks
async function recordProcessedEvent(
  supabaseAdmin: ReturnType<typeof createClient>,
  eventId: string,
  eventType: string,
  processingTimeMs: number
): Promise<void> {
  await supabaseAdmin
    .from('webhook_events')
    .insert({
      event_id: eventId,
      event_type: eventType,
      processing_time_ms: processingTimeMs,
    })
    .single()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function msToISO(ms: number | null | undefined): string | null {
  if (ms == null || ms === 0) return null
  return new Date(ms).toISOString()
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

// Handles INITIAL_PURCHASE, RENEWAL, UNCANCELLATION, and PRODUCT_CHANGE
async function handleSubscriptionActive(
  supabaseAdmin: ReturnType<typeof createClient>,
  event: Record<string, unknown>
): Promise<void> {
  const userId = event.app_user_id as string
  const productId = event.product_id as string
  const store = event.store as string
  const periodType = event.period_type as string
  const purchasedAtMs = event.purchased_at_ms as number | null
  const expirationAtMs = event.expiration_at_ms as number | null
  const originalTransactionId = event.original_transaction_id as string | null

  if (!userId) {
    logStep('Missing app_user_id, skipping event')
    return
  }

  const subscriptionType = PRODUCT_TYPE_MAP[productId] || 'single'
  const platform = STORE_PLATFORM_MAP[store] || 'apple'
  const status = periodType === 'TRIAL' ? 'trialing' : 'active'

  const subscriptionData = {
    user_id: userId,
    status,
    subscription_type: subscriptionType,
    platform,
    iap_product_id: productId || null,
    iap_original_transaction_id: originalTransactionId || null,
    revenuecat_customer_id: userId,
    current_period_start: msToISO(purchasedAtMs),
    current_period_end: msToISO(expirationAtMs),
    updated_at: new Date().toISOString(),
  }

  // Two-step query-then-upsert (mirrors stripe-webhook pattern)
  const { data: existing } = await supabaseAdmin
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  let result
  if (existing) {
    // Update existing subscription
    result = await supabaseAdmin
      .from('user_subscriptions')
      .update(subscriptionData)
      .eq('user_id', userId)

    logStep('Updated existing subscription', {
      userId,
      subscriptionType,
      status,
      platform,
    })
  } else {
    // Insert new subscription
    result = await supabaseAdmin
      .from('user_subscriptions')
      .insert(subscriptionData)

    logStep('Created new subscription', {
      userId,
      subscriptionType,
      status,
      platform,
    })
  }

  if (result.error) {
    logStep('Failed to upsert subscription', {
      userId,
      error: result.error.message,
      details: result.error.details,
    })
    throw new Error(`Failed to upsert subscription: ${result.error.message}`)
  }
}

// Handles CANCELLATION events
async function handleCancellation(
  supabaseAdmin: ReturnType<typeof createClient>,
  event: Record<string, unknown>
): Promise<void> {
  const userId = event.app_user_id as string
  if (!userId) {
    logStep('Missing app_user_id, skipping cancellation')
    return
  }

  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .in('platform', ['apple', 'google'])

  if (error) {
    logStep('Failed to update cancellation', { userId, error: error.message })
    throw new Error(`Failed to update cancellation: ${error.message}`)
  }

  logStep('Subscription marked as canceled', { userId })
}

// Handles EXPIRATION events
async function handleExpiration(
  supabaseAdmin: ReturnType<typeof createClient>,
  event: Record<string, unknown>
): Promise<void> {
  const userId = event.app_user_id as string
  if (!userId) {
    logStep('Missing app_user_id, skipping expiration')
    return
  }

  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .in('platform', ['apple', 'google'])

  if (error) {
    logStep('Failed to update expiration', { userId, error: error.message })
    throw new Error(`Failed to update expiration: ${error.message}`)
  }

  logStep('Subscription marked as expired', { userId })
}

// Handles BILLING_ISSUE events
async function handleBillingIssue(
  supabaseAdmin: ReturnType<typeof createClient>,
  event: Record<string, unknown>
): Promise<void> {
  const userId = event.app_user_id as string
  if (!userId) {
    logStep('Missing app_user_id, skipping billing issue')
    return
  }

  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .in('platform', ['apple', 'google'])

  if (error) {
    logStep('Failed to update billing issue', { userId, error: error.message })
    throw new Error(`Failed to update billing issue: ${error.message}`)
  }

  logStep('Subscription marked as past_due', { userId })
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

serve(async (request: Request) => {
  const startTime = Date.now()

  // Only accept POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ─── Authorization Verification ───────────────────────────────────────────
  const authHeader = request.headers.get('Authorization')
  const expectedKey = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_KEY')

  if (!expectedKey) {
    logStep('REVENUECAT_WEBHOOK_AUTH_KEY not configured')
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (authHeader !== `Bearer ${expectedKey}`) {
    logStep('Authorization failed', {
      hasHeader: !!authHeader,
    })
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ─── Parse Payload ────────────────────────────────────────────────────────
  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    logStep('Failed to parse request body')
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // RevenueCat nests the event under payload.event
  const event = (payload.event || payload) as Record<string, unknown>
  const eventId = event.id as string
  const eventType = event.type as string

  if (!eventId || !eventType) {
    logStep('Missing event id or type', { eventId, eventType })
    return new Response(JSON.stringify({ error: 'Missing event id or type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  logStep(`Event received: ${eventId}`, {
    type: eventType,
    appUserId: event.app_user_id,
    environment: event.environment,
  })

  // ─── Initialize Supabase Admin Client ─────────────────────────────────────
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  )

  // ─── Idempotency Check ───────────────────────────────────────────────────
  try {
    const { alreadyProcessed } = await checkIdempotency(supabaseAdmin, eventId)
    if (alreadyProcessed) {
      logStep('Event already processed, skipping', { eventId })
      return new Response(JSON.stringify({
        received: true,
        already_processed: true,
        event_id: eventId,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch (idempotencyError: unknown) {
    // If idempotency check fails, log but continue processing
    // Better to potentially duplicate than to fail silently
    const message = idempotencyError instanceof Error ? idempotencyError.message : String(idempotencyError)
    logStep('Idempotency check failed, continuing', { error: message })
  }

  // ─── Process Event ────────────────────────────────────────────────────────
  try {
    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION': {
        logStep(`Processing ${eventType}`, { appUserId: event.app_user_id })
        await handleSubscriptionActive(supabaseAdmin, event)
        break
      }

      case 'CANCELLATION': {
        logStep('Processing CANCELLATION', { appUserId: event.app_user_id })
        await handleCancellation(supabaseAdmin, event)
        break
      }

      case 'EXPIRATION': {
        logStep('Processing EXPIRATION', { appUserId: event.app_user_id })
        await handleExpiration(supabaseAdmin, event)
        break
      }

      case 'BILLING_ISSUE': {
        logStep('Processing BILLING_ISSUE', { appUserId: event.app_user_id })
        await handleBillingIssue(supabaseAdmin, event)
        break
      }

      case 'PRODUCT_CHANGE': {
        logStep('Processing PRODUCT_CHANGE', { appUserId: event.app_user_id })
        await handleSubscriptionActive(supabaseAdmin, event)
        break
      }

      case 'TEST': {
        logStep('TEST event received, no database action', { eventId })
        break
      }

      default: {
        logStep('Unhandled event type, no database action', { type: eventType })
      }
    }

    // ─── Record Successful Processing ─────────────────────────────────────
    const processingTime = Date.now() - startTime
    try {
      await recordProcessedEvent(supabaseAdmin, eventId, eventType, processingTime)
      logStep('Event recorded for idempotency', {
        eventId,
        processingTimeMs: processingTime,
      })
    } catch (recordError: unknown) {
      // Log but don't fail - event was processed successfully
      const message = recordError instanceof Error ? recordError.message : String(recordError)
      logStep('Failed to record event for idempotency', { error: message })
    }

    return new Response(JSON.stringify({
      received: true,
      event_id: eventId,
      processing_time_ms: processingTime,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    const processingTime = Date.now() - startTime
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined

    logStep('Error processing webhook', {
      error: message,
      stack,
      eventId,
      eventType,
      processingTimeMs: processingTime,
    })

    // Return 200 to prevent RevenueCat retry storms for non-transient errors
    // (mirrors stripe-webhook error handling pattern)
    return new Response(JSON.stringify({
      error: message,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
