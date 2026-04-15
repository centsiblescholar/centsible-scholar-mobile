import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Resend } from 'https://esm.sh/resend@2.0.0'

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

// ─── One-off (non-subscription) Coaching products ─────────────────────────────
// Any product_id in this set is routed to handleCoachingPurchase instead of
// handleSubscriptionActive. Coaching rows live in `coaching_orders`, NOT
// `user_subscriptions` — they don't grant recurring access, they're one-shot
// booking tickets.
const COACHING_PRODUCT_IDS = new Set<string>([
  'one_on_one_coaching',
])

// Fallback email if COACHING_NOTIFICATION_EMAIL secret is missing. Prevents
// the silent-failure class that dropped the first two test bookings.
const DEFAULT_COACHING_NOTIFICATION_EMAIL = 'coaching@centsiblescholar.com'

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

// Validate that a string is a valid UUID (Supabase user_id format).
// RevenueCat sends `$RCAnonymousID:...` when the SDK wasn't identified with
// a real user — these MUST be rejected before hitting the UUID column.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isValidUUID(value: string): boolean {
  return UUID_RE.test(value)
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

  if (!isValidUUID(userId)) {
    logStep('CRITICAL: app_user_id is not a valid UUID — RevenueCat SDK was not identified with Supabase user ID', {
      app_user_id: userId,
      productId,
      store,
      originalTransactionId,
    })
    // Don't throw — we return 200 to prevent retries, but log loudly so we catch this in monitoring
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

// ─── Coaching one-time purchase handler ──────────────────────────────────────
// Handles INITIAL_PURCHASE (and NON_RENEWING_PURCHASE, which RC may emit for
// Consumables) for coaching product IDs. Writes to `coaching_orders`, NOT
// `user_subscriptions`.
//
// Flow:
//   1. Find the most-recently-created pending coaching_orders row for this
//      user (created by `create-coaching-iap-order` before the Apple purchase).
//   2. If found: UPDATE → status='paid', stamp iap_original_transaction_id,
//      purchased_at.
//   3. If NOT found (client failed to call create-coaching-iap-order, or the
//      user purchased via a path that skipped the form): INSERT a bare paid
//      row so the payment is at least recorded.
//   4. Send the Resend notification email with whatever buyer details exist.
//
// Idempotency: the unique index `idx_coaching_orders_iap_txn` on
// `iap_original_transaction_id` (WHERE not null) ensures RC's at-least-once
// delivery can't create duplicate paid rows for the same Apple transaction.
async function handleCoachingPurchase(
  supabaseAdmin: ReturnType<typeof createClient>,
  event: Record<string, unknown>
): Promise<void> {
  const userId = event.app_user_id as string
  const productId = event.product_id as string
  const store = event.store as string
  const purchasedAtMs = event.purchased_at_ms as number | null
  const originalTransactionId = (event.original_transaction_id as string | null) || null

  if (!userId) {
    logStep('Coaching: missing app_user_id, skipping')
    return
  }

  const platform = STORE_PLATFORM_MAP[store] || 'apple'
  const purchasedAt = msToISO(purchasedAtMs)

  // Short-circuit on duplicate delivery: if a paid row with this txn id
  // already exists, we've already fired the email. Skip cleanly.
  if (originalTransactionId) {
    const { data: existingPaid } = await supabaseAdmin
      .from('coaching_orders')
      .select('id, status')
      .eq('iap_original_transaction_id', originalTransactionId)
      .maybeSingle()

    if (existingPaid && (existingPaid as Record<string, unknown>).status === 'paid') {
      logStep('Coaching: duplicate txn already paid, skipping', {
        orderId: (existingPaid as Record<string, unknown>).id,
        originalTransactionId,
      })
      return
    }
  }

  // Step 1 — find the pending row created by create-coaching-iap-order.
  const { data: pendingRow, error: findError } = await supabaseAdmin
    .from('coaching_orders')
    .select('id, customer_email, customer_name, customer_phone, best_day_to_call, best_time_to_call, session_notes')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .eq('platform', 'apple')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findError) {
    logStep('Coaching: failed to query pending row', { userId, error: findError.message })
  }

  let orderId: string
  let customerEmail: string | null = null
  let customerName: string | null = null
  let customerPhone: string | null = null
  let bestDayToCall: string | null = null
  let bestTimeToCall: string | null = null
  let sessionNotes: string | null = null

  if (pendingRow) {
    const row = pendingRow as Record<string, string | null>
    // Step 2 — update the pending row to paid.
    orderId = row.id as string
    customerEmail = row.customer_email
    customerName = row.customer_name
    customerPhone = row.customer_phone
    bestDayToCall = row.best_day_to_call
    bestTimeToCall = row.best_time_to_call
    sessionNotes = row.session_notes

    const { error: updateError } = await supabaseAdmin
      .from('coaching_orders')
      .update({
        status: 'paid',
        iap_original_transaction_id: originalTransactionId,
        iap_product_id: productId,
        platform,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      logStep('Coaching: failed to mark pending row paid', { orderId, error: updateError.message })
      throw new Error(`Failed to mark coaching_orders paid: ${updateError.message}`)
    }

    logStep('Coaching: pending row marked paid', { orderId, userId, originalTransactionId })
  } else {
    // Step 3 — no pending row (form skipped or create_pending failed).
    // Insert a bare paid row so the $89 payment is at least on record.
    logStep('Coaching: no pending row found, inserting bare paid row', { userId })

    // Look up the user's email from auth.users as a last resort so the
    // notification email has *something* to identify the buyer.
    try {
      const { data: userLookup } = await (supabaseAdmin as unknown as {
        auth: { admin: { getUserById: (id: string) => Promise<{ data: { user: { email: string | null } | null } }> } }
      }).auth.admin.getUserById(userId)
      customerEmail = userLookup?.user?.email ?? null
    } catch (err: unknown) {
      logStep('Coaching: failed to look up user email for bare row', {
        error: err instanceof Error ? err.message : String(err),
      })
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('coaching_orders')
      .insert({
        user_id: userId,
        amount: 8900,
        currency: 'usd',
        status: 'paid',
        platform,
        iap_product_id: productId,
        iap_original_transaction_id: originalTransactionId,
        customer_email: customerEmail,
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      logStep('Coaching: failed to insert bare paid row', { error: insertError?.message })
      throw new Error(`Failed to insert coaching_orders: ${insertError?.message}`)
    }

    orderId = (inserted as Record<string, string>).id
  }

  // Step 4 — fire notification email. Failures do NOT throw — the payment
  // and DB update already succeeded, we don't want RC to retry a successful
  // webhook just because Resend is down.
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      logStep('Coaching: RESEND_API_KEY not configured, skipping notification email')
      return
    }

    const notifyTo =
      Deno.env.get('COACHING_NOTIFICATION_EMAIL') || DEFAULT_COACHING_NOTIFICATION_EMAIL
    const resend = new Resend(resendApiKey)

    const safe = (s: string | null) =>
      (s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    const html = `
      <h2>New coaching session booked — $89</h2>
      <p><strong>Source:</strong> iOS In-App Purchase</p>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><strong>Name</strong></td><td>${safe(customerName) || '—'}</td></tr>
        <tr><td><strong>Email</strong></td><td>${safe(customerEmail) || '—'}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${safe(customerPhone) || '—'}</td></tr>
        <tr><td><strong>Best day to call</strong></td><td>${safe(bestDayToCall) || '—'}</td></tr>
        <tr><td><strong>Best time to call</strong></td><td>${safe(bestTimeToCall) || '—'}</td></tr>
        <tr><td valign="top"><strong>Session goals</strong></td><td>${safe(sessionNotes) || '—'}</td></tr>
      </table>
      <p>
        <strong>Coaching order:</strong> ${orderId}<br/>
        <strong>Apple txn:</strong> ${safe(originalTransactionId) || '—'}<br/>
        <strong>Purchased at:</strong> ${safe(purchasedAt) || '—'}
      </p>
    `.trim()

    const text = [
      `New coaching session booked — $89`,
      ``,
      `Source: iOS In-App Purchase`,
      `Name: ${customerName || '—'}`,
      `Email: ${customerEmail || '—'}`,
      `Phone: ${customerPhone || '—'}`,
      `Best day to call: ${bestDayToCall || '—'}`,
      `Best time to call: ${bestTimeToCall || '—'}`,
      `Session goals: ${sessionNotes || '—'}`,
      ``,
      `Coaching order: ${orderId}`,
      `Apple txn: ${originalTransactionId || '—'}`,
      `Purchased at: ${purchasedAt || '—'}`,
    ].join('\n')

    // IMPORTANT: Resend verifies sending domains *exactly* — the verified
    // domain in this project is `send.centsiblescholar.com`, NOT the bare
    // root `centsiblescholar.com`. Sending from `noreply@centsiblescholar.com`
    // returns a 403 "domain is not verified" error even though the parent
    // domain exists and receives email. Always send from an address at
    // `@send.centsiblescholar.com`.
    const emailResult = await resend.emails.send({
      from: 'Centsible Scholar <noreply@send.centsiblescholar.com>',
      to: [notifyTo],
      subject: 'New coaching session booked — $89',
      html,
      text,
    })

    // Resend v4 returns { data, error } — never trust absence-of-throw.
    if (emailResult.error) {
      logStep('Coaching: Resend returned error', { error: emailResult.error })
    } else {
      logStep('Coaching: notification email sent', {
        to: notifyTo,
        messageId: emailResult.data?.id,
        orderId,
      })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    logStep('Coaching: notification email threw', { error: message })
  }
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
  // If the product is a coaching one-shot, route to the coaching handler BEFORE
  // the subscription switch — coaching rows live in `coaching_orders`, not
  // `user_subscriptions`, and we don't want the "unknown product → default to
  // single tier" fallthrough in PRODUCT_TYPE_MAP to fabricate a fake
  // subscription row for a coaching buyer.
  const incomingProductId = event.product_id as string | undefined
  const isCoachingProduct =
    typeof incomingProductId === 'string' && COACHING_PRODUCT_IDS.has(incomingProductId)

  try {
    if (
      isCoachingProduct &&
      (eventType === 'INITIAL_PURCHASE' || eventType === 'NON_RENEWING_PURCHASE')
    ) {
      logStep(`Processing coaching ${eventType}`, {
        appUserId: event.app_user_id,
        productId: incomingProductId,
      })
      await handleCoachingPurchase(supabaseAdmin, event)

      // Record for idempotency + return.
      const processingTime = Date.now() - startTime
      try {
        await recordProcessedEvent(supabaseAdmin, eventId, eventType, processingTime)
      } catch (recordError: unknown) {
        const message = recordError instanceof Error ? recordError.message : String(recordError)
        logStep('Failed to record coaching event for idempotency', { error: message })
      }
      return new Response(JSON.stringify({
        received: true,
        event_id: eventId,
        coaching: true,
        processing_time_ms: processingTime,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Coaching events we don't have explicit handling for (cancellation,
    // refund, expiration on a consumable — rare) are logged and skipped
    // so they never fall through into the subscription path below.
    if (isCoachingProduct) {
      logStep('Coaching event type not handled, skipping', {
        type: eventType,
        productId: incomingProductId,
      })
      const processingTime = Date.now() - startTime
      try {
        await recordProcessedEvent(supabaseAdmin, eventId, eventType, processingTime)
      } catch { /* best-effort */ }
      return new Response(JSON.stringify({
        received: true,
        event_id: eventId,
        coaching: true,
        unhandled: true,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

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

      case 'TRANSFER': {
        // TRANSFER fires when RevenueCat moves a purchase from one user to
        // another (e.g. anonymous → identified). The event contains both
        // `transferred_from` and `transferred_to` arrays. The current event
        // payload's `app_user_id` is the NEW owner. Treat it like an
        // INITIAL_PURCHASE so the subscription record lands under the correct
        // Supabase user_id.
        logStep('Processing TRANSFER as subscription active', {
          appUserId: event.app_user_id,
          productId: event.product_id,
        })
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
