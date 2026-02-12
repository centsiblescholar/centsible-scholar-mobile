import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// --- Structured Logging ---
const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[DELETE-ACCOUNT] ${step}`, details ? JSON.stringify(details) : '')
}

// --- CORS Headers ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// --- Main Handler ---

serve(async (request: Request) => {
  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // --- Authentication ---
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      logStep('Missing Authorization header')
      return new Response(JSON.stringify({ success: false, error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      logStep('Authentication failed', { error: authError?.message })
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    logStep('Authenticated user', { userId: user.id, email: user.email })

    // --- Verify parent role ---
    const userType = user.user_metadata?.user_type
    if (userType !== 'parent') {
      logStep('Non-parent user attempted account deletion', { userId: user.id, userType })
      return new Response(
        JSON.stringify({ success: false, error: 'Only parent accounts can delete accounts. Students cannot delete their own accounts.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // --- Check subscription status ---
    logStep('Checking subscription status', { userId: user.id })

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (subError) {
      logStep('Subscription check failed', { userId: user.id, error: subError.message })
      throw new Error(`Failed to check subscription status: ${subError.message}`)
    }

    if (subscription) {
      logStep('Active subscription blocks deletion', { userId: user.id, status: subscription.status })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please cancel your subscription before deleting your account. You can manage your subscription in the App Store or Google Play.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    logStep('Subscription check passed (no active subscription)', { userId: user.id })

    // --- Find student relationships ---
    const { data: students, error: relError } = await supabaseAdmin
      .from('parent_student_relationships')
      .select('student_user_id')
      .eq('parent_user_id', user.id)

    if (relError) {
      logStep('Failed to fetch student relationships', { userId: user.id, error: relError.message })
      throw new Error(`Failed to fetch student relationships: ${relError.message}`)
    }

    const studentCount = students?.length || 0
    logStep('Found student relationships', { userId: user.id, studentCount })

    // --- Cascade delete: students first, then parent ---
    // CRITICAL: Delete auth users FIRST. Foreign key CASCADE handles public table cleanup.
    // Do NOT manually delete from public tables before auth.admin.deleteUser.

    // Delete each student's auth user
    for (const student of students || []) {
      logStep('Deleting student auth user', { studentUserId: student.student_user_id })

      const { error: studentDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        student.student_user_id
      )

      if (studentDeleteError) {
        logStep('Failed to delete student', {
          studentUserId: student.student_user_id,
          error: studentDeleteError.message,
        })
        throw new Error('Failed to delete student account. Please contact support.')
      }

      logStep('Student auth user deleted', { studentUserId: student.student_user_id })
    }

    // Delete the parent's auth user (CASCADE handles parent_profiles, etc.)
    logStep('Deleting parent auth user', { userId: user.id })

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) {
      logStep('Failed to delete parent user', { userId: user.id, error: deleteError.message })
      throw deleteError
    }

    logStep('Parent auth user deleted', { userId: user.id })

    // --- Success response ---
    logStep('Account deletion complete', {
      userId: user.id,
      studentsDeleted: studentCount,
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully',
        studentsDeleted: studentCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined

    logStep('Account deletion error', { error: message, stack })

    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
