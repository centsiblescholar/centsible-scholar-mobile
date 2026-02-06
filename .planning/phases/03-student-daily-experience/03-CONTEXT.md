# Phase 3: Student Daily Experience - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

## Phase Boundary

This phase delivers two distinct experiences:
1. **Student:** Combined daily assessment flow where students complete Question of the Day (QOD) + behavior self-assessment in a single streamlined wizard
2. **Parent:** Family-wide QOD progress dashboard showing aggregate education stats and per-student progress cards

Scope is limited to these two features. Creating posts, grade submission, and other student/parent features are separate phases.

## Implementation Decisions

### Combined Assessment Flow Structure
- **Two-step wizard:** QOD first (Step 1), then behavior assessment (Step 2)
- **Smart step skipping:** If student already completed one part today, skip that step automatically and show only the incomplete step
- **QOD presentation:** Match web app format exactly (question text, answer choices, validation, feedback)
- **Behavior assessment:** 5 sliders for behavior dimensions (Respect, Responsibility, Perseverance, etc.) - same as web app
- **Answer feedback:** Match web app behavior for showing correct/incorrect after QOD answer
- **Edit policy:** Match web app rules for whether students can change answers after submitting
- **Streak logic:** Match web app streak rules (QOD-based, behavior-based, or combined)
- **Entry points:** Both dashboard task cards AND dedicated new tab in student nav bar
  - Tapping "Question of the Day" or "Behavior Check-in" card from Today's Tasks (Phase 2) starts flow
  - New dedicated tab (e.g., "Daily" or "Check-in") in student tab bar for direct access
- **QOD availability:** System guarantees a QOD is available every day (no edge case handling needed)
- **Post-completion access:** Students can view (read-only) what they answered today, but cannot change it

### Progress Indicators and Celebration
- **Progress visualization:** Horizontal progress bar showing completion (50% after Step 1, 100% after Step 2)
- **Intermediate feedback:** Show mini celebration ("Nice! Great job!") after CORRECT QOD answers only, then proceed to behavior. Wrong answers go straight to behavior step.
- **Completion celebration:** Encouraging message with confetti animation (warm, positive tone - NOT metrics/rewards display)
- **Celebration tone:** Warm and encouraging, matching Phase 2 student dashboard tone ("Great work today.", "You're doing well.")
- **Post-celebration navigation:** Return to student dashboard after celebration (task cards now show checkmarks)

### Parent QOD Progress Dashboard
- **Access location:** Integrate into existing "Learn" tab (parent tab bar already has Learn tab with QOD viewing)
- **Information hierarchy:** Aggregate family stats at top (total XP, average accuracy, active streaks), then per-student cards below
- **Per-student cards:** Comprehensive snapshot format
  - Student name
  - Photo
  - 🔥 X-day streak
  - Accuracy percentage
  - Last answer date
  - Total QOD answered count
- **Card arrangement:** Horizontal scroll (swipeable left/right, like Instagram stories - matches Phase 2 student metrics pattern)
- **Card interaction:** Tapping a student card opens that student's main profile/dashboard view
- **Card ordering:** Alphabetical by student name (simple, predictable, no sorting/filtering)
- **Time range:** Toggleable filters - "This Week / This Month / All Time" (default to all-time)

### Data Visualization and Metrics
- **Accuracy display:** Number with color coding
  - Green: >90%
  - Yellow: 75-90%
  - Red: <75%
- **XP display:** Number + level/rank format ("Level 12 - 450/500 XP to next level")
- **XP level system:** Match web app level calculation/formula exactly
- **Streak visualization:** Fire emoji + number (🔥 7 days) - consistent with Phase 2 student dashboard
- **Charts/graphs:** None in this phase - numbers and cards only (keep it simple)

### Claude's Discretion
- Exact wording of celebration messages (within warm/encouraging tone)
- Loading state implementations
- Error handling specifics
- Transition animations between wizard steps
- Progress bar visual design (color, height, animation)
- Empty state messaging if a student has no QOD history yet
- Confetti animation implementation details
- Tab icon and label for new student daily assessment tab

## Specific Ideas

- "The combined flow should feel fast and seamless - students shouldn't feel like they're filling out a form"
- "Parents should be able to glance at the progress view and immediately know if their kids are staying engaged"
- "Use the horizontal scroll pattern from Phase 2 student dashboard - it worked well for metrics cards"
- "Match the web app for QOD format, feedback, and streak logic - don't reinvent"

## Deferred Ideas

None - discussion stayed within phase scope

---

*Phase: 03-student-daily-experience*
*Context gathered: 2026-02-06*
