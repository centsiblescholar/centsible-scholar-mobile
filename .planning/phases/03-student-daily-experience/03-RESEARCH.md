# Phase 3: Student Daily Experience - Research

**Researched:** 2026-02-05
**Domain:** React Native wizard flows, confetti animations, parent progress dashboards, XP/streak systems
**Confidence:** HIGH

## Summary

Phase 3 delivers two features: (1) a combined daily assessment wizard for students (QOD + behavior self-assessment) and (2) a parent QOD progress dashboard. Research confirms that the existing codebase already contains most of the data hooks, Supabase queries, and business logic needed -- the mobile app has `useQuestionOfTheDay`, `useBehaviorAssessments`, `useParentStudents`, and the web app provides the exact XP/level system (`levelSystem.ts`), streak calculation logic (`questionOfTheDayApi.ts`), and parent stats aggregation (`useParentQODStats.ts`) to port.

The primary work is: (a) building a two-step wizard screen with smart step-skipping, (b) enhancing the mobile `useQuestionOfTheDay` hook to include XP awards and streak updates (currently missing from mobile but present in web), (c) porting the `levelSystem.ts` utility and `questionOfTheDayApi.ts` streak/XP functions to the mobile codebase, (d) adding a confetti celebration screen, (e) creating a `useParentQODStats` hook for the parent progress view, and (f) adding a new student tab in the tab bar.

**Primary recommendation:** Port the web app's XP/streak/level logic verbatim (it is pure JS with no web dependencies), build the wizard as a single screen with state-driven steps (not multi-screen navigation), use `react-native-confetti-cannon` for celebrations (pure JS, Expo Go compatible), and reuse the existing horizontal scroll FlatList pattern from Phase 2 dashboard for the parent student cards.

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native | 0.81.5 | Core framework | Already in project |
| expo-router | ~6.0.15 | Tab navigation, routing | Already in project, use `href: null` pattern for conditional tabs |
| @tanstack/react-query | ^5.90.11 | Data fetching for parent stats | Already used by all hooks |
| react-native-reanimated | ~4.1.1 | Wizard step transitions, progress bar animation | Already installed, use for smooth transitions |
| date-fns | ^4.1.0 | Date calculations for time-range filters | Already installed, used by web app's useParentQODStats |
| @expo/vector-icons (Ionicons) | ^15.0.3 | Tab bar icon for new "Daily" tab | Already in project |
| @react-native-async-storage/async-storage | 2.2.0 | QOD caching per day | Already used by existing useQuestionOfTheDay |

### New Dependencies

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-confetti-cannon | ^1.5.2 | Confetti animation on completion celebration | Pure JS implementation, no native modules, Expo Go safe |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-confetti-cannon | Custom Reanimated confetti | More work, already have Reanimated but confetti physics is complex to hand-roll |
| react-native-confetti-cannon | expo-confetti | Less popular, fewer downloads, less tested |
| @react-native-community/slider | TouchableOpacity button grid | Context DECISIONS specify "5 sliders for behavior dimensions" BUT web app uses 1-5 button grid (not sliders). Mobile already has 1-5 button grid in behavior.tsx. Recommend keeping button grid to match existing pattern |

**Installation:**
```bash
npx expo install react-native-confetti-cannon
```

**Important note on "sliders":** The CONTEXT.md mentions "5 sliders for behavior dimensions" but examining both the web app (`VibrantStudentBehaviorForm.tsx`) and the existing mobile behavior screen (`behavior.tsx`), behavior scoring uses a **1-5 button grid** (tap to select score), not slider components. The mobile app already implements this pattern in `ScoreRow` component in `behavior.tsx`. Recommend reusing the existing 1-5 button grid pattern rather than introducing actual slider components, since it matches the web app exactly.

## Architecture Patterns

### Recommended Project Structure

```
app/
  (tabs)/
    _layout.tsx              # ADD new "daily" tab with conditional student-only visibility
    daily.tsx                # NEW: Student combined assessment wizard screen
    dashboard.tsx            # MODIFY: task cards become tappable entry points
    learn.tsx                # MODIFY: add parent QOD progress section (role-conditional)

src/
  utils/
    levelSystem.ts           # PORT: from web app (pure JS, no changes needed)
    questionOfTheDayApi.ts   # PORT: streak calc, XP award, XP reward calc (adapt Supabase client import)
    celebrations.ts          # NEW: streak milestone messages (port subset from web)
  hooks/
    useQuestionOfTheDay.ts   # ENHANCE: add XP/streak logic from web version
    useBehaviorAssessments.ts # REUSE: already has todayAssessment, saveAssessment
    useParentQODStats.ts     # NEW: port from web app (adapt imports)
    useDailyAssessment.ts    # NEW: orchestration hook for combined wizard flow
  components/
    daily/
      AssessmentWizard.tsx   # NEW: two-step wizard container with progress bar
      QODStep.tsx            # NEW: question presentation + answer selection + feedback
      BehaviorStep.tsx       # NEW: 5-category behavior self-assessment (simplified from full 10)
      CompletionCelebration.tsx # NEW: confetti + encouraging message + return to dashboard
      ProgressBar.tsx        # NEW: horizontal progress bar (50%/100%)
```

### Pattern 1: Single-Screen Wizard with State-Driven Steps

**What:** The combined assessment flow is a SINGLE screen (`daily.tsx`) that manages wizard state internally, not multiple screens with navigation.

**When to use:** When steps are sequential, tightly coupled, and share state (QOD result influences behavior step UX).

**Why:** Avoids navigation stack complexity, prevents back-button issues, enables smooth animated transitions between steps, and keeps state contained. The wizard is 2 steps + 1 celebration screen = 3 states.

**Example:**
```typescript
type WizardStep = 'qod' | 'behavior' | 'celebration';

function DailyAssessmentScreen() {
  const [currentStep, setCurrentStep] = useState<WizardStep>('qod');
  const [qodCompleted, setQodCompleted] = useState(false);
  const [behaviorCompleted, setBehaviorCompleted] = useState(false);

  // Smart step skipping: check what's already done today
  const { hasAnsweredToday } = useQuestionOfTheDay(gradeLevel);
  const { todayAssessment } = useBehaviorAssessments(userId);

  useEffect(() => {
    if (hasAnsweredToday && todayAssessment) {
      // Both done - show read-only view
      setCurrentStep('celebration'); // or a "completed" state
    } else if (hasAnsweredToday) {
      setCurrentStep('behavior'); // Skip QOD
    } else {
      setCurrentStep('qod'); // Start from beginning
    }
  }, [hasAnsweredToday, todayAssessment]);

  // Render based on step
  switch (currentStep) {
    case 'qod': return <QODStep onComplete={() => setCurrentStep('behavior')} />;
    case 'behavior': return <BehaviorStep onComplete={() => setCurrentStep('celebration')} />;
    case 'celebration': return <CompletionCelebration onDismiss={() => router.replace('/(tabs)/dashboard')} />;
  }
}
```

### Pattern 2: Conditional Tab Visibility (Established Pattern)

**What:** Use `href: null` to hide the new "Daily" tab from parent users, matching the established pattern from Phase 1.

**When to use:** The new "Daily" tab should only be visible to students. Parents see Learn/Earnings tabs instead.

**Example:**
```typescript
// In app/(tabs)/_layout.tsx
<Tabs.Screen
  name="daily"
  options={{
    title: 'Daily',
    href: userRole === 'parent' ? null : '/(tabs)/daily',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="today-outline" size={size} color={color} />
    ),
  }}
/>
```

### Pattern 3: Parent Progress as Role-Conditional Section in Learn Tab

**What:** Instead of a new screen, add the parent QOD progress dashboard as a role-conditional section within the existing Learn tab.

**When to use:** CONTEXT.md specifies "Integrate into existing Learn tab." The Learn tab currently shows QOD for the selected student. For parents, add aggregate stats + per-student cards above or instead of the single-student QOD view.

**Example:**
```typescript
// In app/(tabs)/learn.tsx
export default function LearnScreen() {
  const { userRole } = useAuth();

  if (userRole === 'parent') {
    return <ParentQODProgressView />;
  }

  // Existing student QOD view (unchanged or redirect to daily tab)
  return <StudentLearnView />;
}
```

### Pattern 4: Horizontal ScrollView for Student Cards (Established Pattern)

**What:** Reuse the FlatList horizontal scroll with snap-to pattern from Phase 2 student dashboard for parent per-student progress cards.

**When to use:** Per-student progress cards in the parent Learn tab.

**Example:**
```typescript
// Reuse exact pattern from dashboard.tsx StudentDashboardView
<FlatList
  data={studentCards}
  horizontal
  pagingEnabled={false}
  snapToInterval={CARD_WIDTH + CARD_GAP}
  decelerationRate="fast"
  showsHorizontalScrollIndicator={false}
  renderItem={({ item }) => <StudentProgressCard stats={item} />}
/>
```

### Anti-Patterns to Avoid
- **Multi-screen navigation for wizard:** Do NOT use `router.push` between QOD and behavior steps. Users might press back and lose state. Use single-screen state management.
- **Duplicating Supabase logic:** The web app's `questionOfTheDayApi.ts` contains the exact streak/XP calculation logic. Port it, don't rewrite it.
- **Full 10-category behavior form in wizard:** The CONTEXT mentions "5 sliders for behavior dimensions (Respect, Responsibility, Perseverance, etc.)." The web app has 10 categories (5 obligations + 5 opportunities). Clarification needed -- the CONTEXT likely refers to 5 simplified categories OR all 10. Research the web app pattern: the `VibrantStudentBehaviorForm` uses all 10. The existing mobile `behavior.tsx` also uses all 10. **Recommend matching web app with all 10 categories** since the data schema expects all 10 scores, but displaying them in a compact scrollable format.
- **Blocking the wizard on XP award failures:** XP and streak updates should be fire-and-forget with try/catch. The web app already does this (`try { ... } catch (streakError) { /* don't fail submission */ }`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XP level calculation | Custom level formula | Port `src/utils/levelSystem.ts` from web app | 10 levels with specific thresholds and titles already defined |
| Streak calculation | Custom streak logic | Port `calculateStreak()` from web `questionOfTheDayApi.ts` | Edge cases (same day, consecutive day, missed day) already handled |
| XP reward amounts | Custom XP values | Port `calculateXPReward()` from web `questionOfTheDayApi.ts` | Base XP (10), correct bonus (5), milestone bonuses (50/100/250) already calibrated |
| Confetti animation | Custom particle system | `react-native-confetti-cannon` | Physics-based confetti is surprisingly complex; library is pure JS |
| Date range filtering | Custom date math | `date-fns` (already installed) | `startOfWeek`, `endOfWeek`, `subWeeks`, `format` already used by web `useParentQODStats` |
| Parent student list | Direct Supabase queries | Existing `useParentStudents` hook | Already resolves parent-student relationships and returns `StudentInfo[]` |
| Behavior save logic | Custom upsert | Existing `useBehaviorAssessments.saveAssessment` | Already handles insert-or-update, sets `student_user_id`, handles status |

**Key insight:** The web app is the authoritative source for ALL business logic in this phase. Every calculation, threshold, and data flow already exists. The mobile work is primarily UI + porting JS utilities.

## Common Pitfalls

### Pitfall 1: Missing XP/Streak Logic in Mobile QOD Hook
**What goes wrong:** The current mobile `useQuestionOfTheDay.ts` saves the QOD answer but does NOT update streaks or award XP. The web version does both.
**Why it happens:** The mobile hook was a simplified port that omitted streak/XP tracking.
**How to avoid:** Enhance the mobile hook to include `getStreakData`, `calculateStreak`, `updateStreakData`, `calculateXPReward`, and `awardXP` calls from the web version. Port the utility functions first, then update the hook.
**Warning signs:** QOD answers save but streak count stays at 0 and XP never increases.

### Pitfall 2: StudentProfile Missing streak_count/total_xp/longest_streak Fields
**What goes wrong:** The mobile `StudentProfile` interface in `useStudentProfile.ts` does NOT include `streak_count`, `total_xp`, `longest_streak`, or `last_qod_date` fields. The web app's Supabase types DO include these.
**Why it happens:** Mobile types were defined before these columns were added or the mobile type was simplified.
**How to avoid:** Add these fields to the mobile `StudentProfile` interface. Use the pre-migration type casting pattern (`as unknown as StudentProfile`) if types are not yet generated.
**Warning signs:** TypeScript errors when accessing `profile.streak_count` or `profile.total_xp`.

### Pitfall 3: Behavior Scores Schema Mismatch
**What goes wrong:** CONTEXT says "5 sliders for behavior dimensions" but the database schema has 10 behavior score columns.
**Why it happens:** The CONTEXT simplified the description.
**How to avoid:** Use all 10 behavior categories matching the web app and existing mobile `behavior.tsx` screen. The `BehaviorScores` type already defines all 10: diet, exercise, work, hygiene, respect, responsibilities, attitude, cooperation, courtesy, service. The combined wizard should include all 10 in a compact format.
**Warning signs:** Saving only 5 scores leaves 5 columns as 0, skewing the average calculation.

### Pitfall 4: Tab Order and Conditional Visibility
**What goes wrong:** Adding a new tab file without properly positioning it or making it student-only can show it to parents or break tab ordering.
**Why it happens:** Expo Router orders tabs based on file order and `<Tabs.Screen>` order in `_layout.tsx`.
**How to avoid:** Add the `daily.tsx` file in `app/(tabs)/`, then in `_layout.tsx` add the `<Tabs.Screen name="daily">` entry with `href: userRole === 'parent' ? null : '/(tabs)/daily'`. Place it logically (e.g., after dashboard, before grades).
**Warning signs:** Tab appears for both roles, or tab order looks wrong.

### Pitfall 5: RLS Policy on xp_transactions Table
**What goes wrong:** Inserting into `xp_transactions` might fail if RLS policies don't allow student self-insert.
**Why it happens:** The web app's XP award function inserts with the student's own `user_id`. RLS must allow this.
**How to avoid:** Verify that the `xp_transactions` table has an RLS policy allowing `INSERT` where `auth.uid() = user_id`. If not, the XP award will need to be done via edge function or the RLS policy needs updating.
**Warning signs:** XP awards silently fail, XP stays at 0 despite completing QOD.

### Pitfall 6: Time Range Filter State Not Refreshing Data
**What goes wrong:** Parent toggles "This Week / This Month / All Time" but data doesn't change.
**Why it happens:** The query key doesn't include the time range, so React Query serves stale cache.
**How to avoid:** Include the time range in the query key: `['parentQODStats', userId, timeRange]`. When time range changes, query refetches automatically.
**Warning signs:** Toggling filters has no visible effect on numbers.

### Pitfall 7: Wizard Re-entry After Completion
**What goes wrong:** Student completes both steps, sees celebration, goes back to dashboard, then taps "Daily" tab again and sees celebration again instead of read-only view.
**Why it happens:** Celebration is a transient state, not persisted.
**How to avoid:** On screen mount, check `hasAnsweredToday` and `todayAssessment`. If both are complete, show a "completed for today" read-only view (not the celebration again). Only show celebration as the final step of an active wizard session.
**Warning signs:** Repeated celebration animations on every tab visit.

## Code Examples

### Porting levelSystem.ts (Direct Copy)
```typescript
// src/utils/levelSystem.ts
// Copy VERBATIM from web app: centsible-scholar-premium/src/utils/levelSystem.ts
// Zero changes needed -- pure TypeScript with no web dependencies
// Exports: calculateLevelInfo, getLevel, getLevelTitle, checkLevelUp, getLevelColors, LEVEL_THRESHOLDS
```

### Porting Streak/XP Logic
```typescript
// src/utils/questionOfTheDayApi.ts
// Port from web app, changing only the import:
// WEB:    import { supabase } from '@/integrations/supabase/client';
// MOBILE: import { supabase } from '../integrations/supabase/client';
//
// Functions to port:
// - calculateStreak(lastQodDate, todayDate) => number
// - getStreakData(studentId) => StreakData
// - updateStreakData(studentId, newStreakCount, todayDate) => void
// - calculateXPReward(isCorrect, newStreakCount) => XPAward[]
// - awardXP(userId, studentId, award) => void
//
// Remove: fetchTodayResult, fetchWeeklyStats, fetchTermStats, saveQuestionResult
// (these are handled by the existing mobile hook)
```

### Enhanced useQuestionOfTheDay Hook
```typescript
// Add to existing mobile hook (matching web app pattern):
// After saving QOD result, add streak/XP handling:
if (studentId) {
  try {
    const streakData = await getStreakData(studentId);
    if (streakData) {
      const streakSignal = calculateStreak(streakData.last_qod_date, today);
      let newStreakCount: number;
      if (streakSignal === -1) {
        newStreakCount = streakData.streak_count + 1;
      } else if (streakSignal === 0) {
        newStreakCount = streakData.streak_count;
      } else {
        newStreakCount = streakSignal;
      }
      await updateStreakData(studentId, newStreakCount, today);
      const xpAwards = calculateXPReward(correct, newStreakCount);
      let totalXpEarned = 0;
      for (const award of xpAwards) {
        await awardXP(userId, studentId, award);
        totalXpEarned += award.amount;
      }
      setStreakCount(newStreakCount);
      setTotalXP(streakData.total_xp + totalXpEarned);
      setXpEarned(totalXpEarned);
    }
  } catch (streakError) {
    console.error('Error updating streak/XP:', streakError);
    // Non-blocking: don't fail QOD submission
  }
}
```

### Confetti Celebration Component
```typescript
// src/components/daily/CompletionCelebration.tsx
import ConfettiCannon from 'react-native-confetti-cannon';

function CompletionCelebration({ onDismiss }: { onDismiss: () => void }) {
  return (
    <View style={styles.container}>
      <ConfettiCannon
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart
        fadeOut
      />
      <Text style={styles.title}>Great work today!</Text>
      <Text style={styles.subtitle}>You completed your daily check-in.</Text>
      <TouchableOpacity style={styles.button} onPress={onDismiss}>
        <Text style={styles.buttonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Parent QOD Stats Hook (Port from Web)
```typescript
// src/hooks/useParentQODStats.ts
// Port from web: centsible-scholar-premium/src/hooks/useParentQODStats.ts
// Changes:
// 1. Import supabase from mobile path
// 2. Use @tanstack/react-query instead of manual useState/useEffect
// 3. Add timeRange parameter for "This Week / This Month / All Time" filter
// 4. Key query by timeRange for proper cache invalidation

export function useParentQODStats(timeRange: 'week' | 'month' | 'all' = 'all') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['parentQODStats', user?.id, timeRange],
    queryFn: () => fetchParentQODStats(user!.id, timeRange),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}
```

### Time Range Filter Toggle
```typescript
// Segmented control for time range (matches Phase 2 tab toggle pattern from behavior.tsx)
const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');

<View style={styles.tabContainer}>
  {(['week', 'month', 'all'] as const).map((range) => (
    <TouchableOpacity
      key={range}
      style={[styles.tab, timeRange === range && styles.tabActive]}
      onPress={() => setTimeRange(range)}
    >
      <Text style={[styles.tabText, timeRange === range && styles.tabTextActive]}>
        {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mobile QOD saves answer only | Web QOD saves + updates streak + awards XP | Web always had it; mobile was simplified | Mobile must be enhanced to match web |
| Full 10-category behavior form | Same 10 categories but in wizard step | Current phase | Compact layout needed for wizard context |
| Parent views individual student QOD | Family-wide aggregate + per-student cards | This phase | New `useParentQODStats` hook needed |
| No dedicated student daily tab | New "Daily" tab in student nav | This phase | Tab layout update + new screen file |

**Deprecated/outdated:**
- The mobile `useQuestionOfTheDay` hook's streak handling is incomplete (just reads `streak_count` from profile, never updates it). Must be enhanced.
- The `learn.tsx` currently shows single-student QOD for both parents and students. Parents will get the progress dashboard view instead.

## Open Questions

1. **Behavior categories: 5 or 10?**
   - What we know: CONTEXT says "5 sliders for behavior dimensions (Respect, Responsibility, Perseverance, etc.)." But web app and mobile both use 10 categories (diet, exercise, work, hygiene, respect, responsibilities, attitude, cooperation, courtesy, service). The DB schema has 10 columns.
   - What's unclear: Does the user want a simplified 5-category student self-assessment, or the full 10?
   - Recommendation: **Use all 10 categories** to match web app and DB schema. Display them in a compact format (perhaps 2 sections: Obligations and Opportunities, matching web). The word "5 sliders" in CONTEXT may have been approximate. Using 10 ensures data consistency. If only 5 are used, the remaining 5 would default to 0 and break average calculations.

2. **xp_transactions RLS policy**
   - What we know: The web app's `awardXP` function inserts into `xp_transactions`. This table must allow student users to insert their own records.
   - What's unclear: Whether RLS policies are configured for student self-insert on this table.
   - Recommendation: Test the insert during implementation. If RLS blocks it, add policy: `CREATE POLICY "Students can insert own XP" ON xp_transactions FOR INSERT WITH CHECK (auth.uid() = user_id)`.

3. **student_profiles columns for XP/streak**
   - What we know: Web app Supabase types include `streak_count`, `longest_streak`, `total_xp`, `last_qod_date` on `student_profiles`. Mobile types don't include these yet.
   - What's unclear: Whether these columns exist in the actual DB (they should since the web app uses them).
   - Recommendation: Use the pre-migration type casting pattern (`as unknown as ExtendedStudentProfile`) until types are regenerated. Add these fields to the `StudentProfile` interface.

## Sources

### Primary (HIGH confidence)
- Web app `src/utils/levelSystem.ts` -- XP level thresholds and calculation logic (examined directly)
- Web app `src/utils/questionOfTheDayApi.ts` -- Streak calculation, XP rewards, streak data management (examined directly)
- Web app `src/hooks/useParentQODStats.ts` -- Parent aggregate QOD stats and per-student breakdown (examined directly)
- Web app `src/hooks/useQuestionOfTheDay.ts` -- Full QOD flow with XP/streak integration (examined directly)
- Web app `src/pages/QODProgress.tsx` -- Parent QOD progress page layout (examined directly)
- Web app `src/components/qod/StudentQODCard.tsx` -- Per-student progress card layout (examined directly)
- Web app `src/pages/DailyAssessment.tsx` -- Combined QOD + behavior assessment page (examined directly)
- Mobile `src/hooks/useQuestionOfTheDay.ts` -- Current mobile QOD hook (lacks streak/XP) (examined directly)
- Mobile `src/hooks/useBehaviorAssessments.ts` -- Behavior data hook with todayAssessment (examined directly)
- Mobile `app/(tabs)/dashboard.tsx` -- Horizontal scroll FlatList pattern, task cards (examined directly)
- Mobile `app/(tabs)/_layout.tsx` -- Tab configuration with `href: null` pattern (examined directly)
- Mobile `app/(tabs)/behavior.tsx` -- 10-category ScoreRow component with 1-5 buttons (examined directly)
- Mobile `app/(tabs)/learn.tsx` -- Current QOD display and answer UI (examined directly)
- Mobile `src/data/questionBank.ts` -- Question format: id, question, options[], correctAnswer, explanation, topic (examined directly)

### Secondary (MEDIUM confidence)
- react-native-confetti-cannon npm page -- Pure JS, no native modules, works on iOS/Android/Web
- @react-native-community/slider Expo docs -- Available but not needed (behavior uses button grid, not sliders)

### Tertiary (LOW confidence)
- Expo Go compatibility of react-native-confetti-cannon with RN 0.81 -- Package is 5 years old but pure JS so should work. Test during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed except confetti cannon (pure JS addition)
- Architecture: HIGH -- patterns directly observed in existing codebase and web reference
- Business logic: HIGH -- all XP/streak/level formulas examined in web app source code
- Pitfalls: HIGH -- identified from direct code examination and cross-referencing web vs mobile gaps
- Confetti library: MEDIUM -- pure JS should work in Expo Go but not verified with RN 0.81 specifically

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (stable -- business logic won't change, codebase is under our control)
