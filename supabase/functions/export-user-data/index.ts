import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { zipSync, strToU8 } from 'https://esm.sh/fflate@0.8.2'

// --- Structured Logging ---
const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[EXPORT-USER-DATA] ${step}`, details ? JSON.stringify(details) : '')
}

// --- CORS Headers ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// --- CSV Helpers ---

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value)
  // Wrap in quotes if contains comma, newline, or double quote
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function arrayToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const headerLine = headers.map(escapeCsvValue).join(',')
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvValue(row[h])).join(',')
  )
  return [headerLine, ...dataLines].join('\n')
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
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    logStep('Authenticated user', { userId: user.id, email: user.email })

    // --- Verify parent role ---
    const userType = user.user_metadata?.user_type
    if (userType !== 'parent') {
      logStep('Non-parent user attempted export', { userId: user.id, userType })
      return new Response(JSON.stringify({ error: 'Only parent accounts can export data' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- Parse request body ---
    const body = await request.json()
    const format: 'json' | 'csv' = body.format || 'json'
    const includeStudents: boolean = body.includeStudents ?? true

    logStep('Export request', { userId: user.id, format, includeStudents })

    // --- Gather parent data (parallel) ---
    const [
      profileResult,
      subscriptionResult,
      familyMeetingsResult,
      termConfigsResult,
      termSnapshotsResult,
    ] = await Promise.all([
      supabaseAdmin.from('parent_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabaseAdmin
        .from('user_subscriptions')
        .select('status, subscription_type, current_period_start, current_period_end, platform')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabaseAdmin.from('family_meetings').select('*').eq('user_id', user.id),
      supabaseAdmin.from('term_configs').select('*').eq('user_id', user.id),
      supabaseAdmin.from('term_snapshots').select('*').eq('user_id', user.id),
    ])

    // Check for query errors
    for (const [name, result] of [
      ['parent_profiles', profileResult],
      ['user_subscriptions', subscriptionResult],
      ['family_meetings', familyMeetingsResult],
      ['term_configs', termConfigsResult],
      ['term_snapshots', termSnapshotsResult],
    ] as const) {
      if (result.error) {
        logStep(`Query error for ${name}`, { error: result.error.message })
        throw new Error(`Failed to query ${name}: ${result.error.message}`)
      }
    }

    const profile = profileResult.data
    const subscription = subscriptionResult.data
    const familyMeetings = familyMeetingsResult.data || []
    const termConfigs = termConfigsResult.data || []
    const termSnapshots = termSnapshotsResult.data || []

    // --- Gather student data if requested ---
    let students: Record<string, unknown>[] = []
    let allGrades: Record<string, unknown>[] = []
    let allAssessments: Record<string, unknown>[] = []
    let allAssessmentsComplete: Record<string, unknown>[] = []
    let allQodResults: Record<string, unknown>[] = []
    let allSavingsGoals: Record<string, unknown>[] = []
    let allBehaviorBonuses: Record<string, unknown>[] = []
    let allBadges: Record<string, unknown>[] = []

    if (includeStudents) {
      // Get student relationships
      const { data: relationships, error: relError } = await supabaseAdmin
        .from('parent_student_relationships')
        .select('student_user_id')
        .eq('parent_user_id', user.id)

      if (relError) {
        logStep('Error fetching relationships', { error: relError.message })
        throw new Error(`Failed to query relationships: ${relError.message}`)
      }

      const studentUserIds = (relationships || []).map((r: Record<string, unknown>) => r.student_user_id as string)
      logStep('Found student relationships', { count: studentUserIds.length })

      if (studentUserIds.length > 0) {
        // Fetch all student data in parallel
        const [
          studentProfilesResult,
          gradesResult,
          assessmentsResult,
          assessmentsCompleteResult,
          qodResult,
          savingsResult,
          bonusesResult,
          badgesResult,
        ] = await Promise.all([
          supabaseAdmin.from('student_profiles').select('*').in('user_id', studentUserIds),
          supabaseAdmin.from('student_grades').select('*').in('user_id', studentUserIds),
          supabaseAdmin.from('behavior_assessments').select('*').in('user_id', studentUserIds),
          supabaseAdmin.from('behavior_assessments_complete').select('*').in('user_id', studentUserIds),
          supabaseAdmin.from('question_of_day_results').select('*').in('user_id', studentUserIds),
          supabaseAdmin.from('savings_goals').select('*').in('user_id', studentUserIds),
          supabaseAdmin.from('behavior_bonuses').select('*').in('user_id', studentUserIds),
          supabaseAdmin.from('student_badges').select('*').in('user_id', studentUserIds),
        ])

        students = (studentProfilesResult.data || []) as Record<string, unknown>[]
        allGrades = (gradesResult.data || []) as Record<string, unknown>[]
        allAssessments = (assessmentsResult.data || []) as Record<string, unknown>[]
        allAssessmentsComplete = (assessmentsCompleteResult.data || []) as Record<string, unknown>[]
        allQodResults = (qodResult.data || []) as Record<string, unknown>[]
        allSavingsGoals = (savingsResult.data || []) as Record<string, unknown>[]
        allBehaviorBonuses = (bonusesResult.data || []) as Record<string, unknown>[]
        allBadges = (badgesResult.data || []) as Record<string, unknown>[]

        // Log any errors (non-fatal for individual tables)
        for (const [name, result] of [
          ['student_profiles', studentProfilesResult],
          ['student_grades', gradesResult],
          ['behavior_assessments', assessmentsResult],
          ['behavior_assessments_complete', assessmentsCompleteResult],
          ['question_of_day_results', qodResult],
          ['savings_goals', savingsResult],
          ['behavior_bonuses', bonusesResult],
          ['student_badges', badgesResult],
        ] as const) {
          if (result.error) {
            logStep(`Warning: query error for ${name}`, { error: result.error.message })
          }
        }
      }
    }

    // --- Build summary ---
    const summary = {
      students: students.length,
      grades: allGrades.length,
      assessments: allAssessments.length,
      assessments_complete: allAssessmentsComplete.length,
      qod_answers: allQodResults.length,
      savings_goals: allSavingsGoals.length,
      behavior_bonuses: allBehaviorBonuses.length,
      badges: allBadges.length,
      family_meetings: familyMeetings.length,
      term_configs: termConfigs.length,
      term_snapshots: termSnapshots.length,
    }

    logStep('Data gathered', summary)

    // --- JSON format ---
    if (format === 'json') {
      const content = {
        export_date: new Date().toISOString(),
        profile: profile || {},
        subscription: subscription || {},
        students,
        grades: allGrades,
        assessments: allAssessments,
        assessments_complete: allAssessmentsComplete,
        qod_results: allQodResults,
        savings_goals: allSavingsGoals,
        behavior_bonuses: allBehaviorBonuses,
        badges: allBadges,
        family_meetings: familyMeetings,
        term_configs: termConfigs,
        term_snapshots: termSnapshots,
      }

      return new Response(JSON.stringify({ format: 'json', content, summary }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- CSV/ZIP format ---
    logStep('Building CSV ZIP archive')

    // Build CSV files object for fflate
    const csvFiles: Record<string, Uint8Array> = {}

    // Profile CSV (single row)
    if (profile) {
      csvFiles['profile.csv'] = strToU8(arrayToCsv([profile as Record<string, unknown>]))
    }

    // Subscription CSV (single row)
    if (subscription) {
      csvFiles['subscription.csv'] = strToU8(arrayToCsv([subscription as Record<string, unknown>]))
    }

    // Student data CSVs
    if (includeStudents && students.length > 0) {
      csvFiles['students.csv'] = strToU8(arrayToCsv(students))
    }
    if (allGrades.length > 0) {
      csvFiles['grades.csv'] = strToU8(arrayToCsv(allGrades))
    }
    if (allAssessments.length > 0) {
      csvFiles['assessments.csv'] = strToU8(arrayToCsv(allAssessments))
    }
    if (allAssessmentsComplete.length > 0) {
      csvFiles['assessments_complete.csv'] = strToU8(arrayToCsv(allAssessmentsComplete))
    }
    if (allQodResults.length > 0) {
      csvFiles['qod_results.csv'] = strToU8(arrayToCsv(allQodResults))
    }
    if (allSavingsGoals.length > 0) {
      csvFiles['savings_goals.csv'] = strToU8(arrayToCsv(allSavingsGoals))
    }
    if (allBehaviorBonuses.length > 0) {
      csvFiles['behavior_bonuses.csv'] = strToU8(arrayToCsv(allBehaviorBonuses))
    }
    if (allBadges.length > 0) {
      csvFiles['badges.csv'] = strToU8(arrayToCsv(allBadges))
    }

    // Non-student data CSVs
    if (familyMeetings.length > 0) {
      csvFiles['family_meetings.csv'] = strToU8(arrayToCsv(familyMeetings as Record<string, unknown>[]))
    }
    if (termConfigs.length > 0) {
      csvFiles['term_configs.csv'] = strToU8(arrayToCsv(termConfigs as Record<string, unknown>[]))
    }
    if (termSnapshots.length > 0) {
      csvFiles['term_snapshots.csv'] = strToU8(arrayToCsv(termSnapshots as Record<string, unknown>[]))
    }

    // Create ZIP using fflate
    const zipped = zipSync(csvFiles)
    const base64Chunks: string[] = []
    const CHUNK_SIZE = 8192
    for (let i = 0; i < zipped.length; i += CHUNK_SIZE) {
      const chunk = zipped.subarray(i, Math.min(i + CHUNK_SIZE, zipped.length))
      base64Chunks.push(String.fromCharCode(...chunk))
    }
    const zipBase64 = btoa(base64Chunks.join(''))

    const today = new Date().toISOString().split('T')[0]
    const filename = `centsible-scholar-export-${today}.zip`

    logStep('ZIP created', { filename, csvFileCount: Object.keys(csvFiles).length })

    return new Response(
      JSON.stringify({ format: 'csv', zipBase64, filename, summary }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined

    logStep('Export error', { error: message, stack })

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
