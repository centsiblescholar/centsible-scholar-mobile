# Phase 2: Auth + Student Routing - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds password recovery (OTP-based 6-digit code flow) and independent student login experience. Students sign in with their own credentials and land on a personalized dashboard showing their GPA, earnings, streak, and behavior score. Students get their own distinct tab bar (5 tabs) while parents see all 6 tabs including Earnings (already hidden via Phase 1's conditional visibility).

Password reset: "Forgot Password" link → email input → 6-digit code sent → enter code + new password.
Student dashboard: Action-first design showing today's tasks prominently, then scrollable metric cards.
First-time onboarding: Required interactive tutorial guiding students through profile/settings before full app access.

</domain>

<decisions>
## Implementation Decisions

### Student Dashboard Content & Layout
- **Today's tasks priority**: Dashboard shows "What you need to do today" (QOD + behavior check-in) at the top, action-first approach
- **Horizontal scrollable metric cards**: GPA, earnings, streak, behavior displayed as swipeable cards (Instagram stories style), not grid or list
- **Number + one-line context**: Each metric card shows the key number plus one line of context (e.g., "GPA: 3.8" + "↑ 0.2 this term" or "🔥 7 day streak")
- **Show base reward rate**: Students see their parent-set reward structure transparently ("$5 per A") — full financial visibility, not hidden
- **Full financial transparency**: Students see savings goals AND allocation breakdown (taxes, retirement, savings, discretionary) — complete view, not simplified

### First-Time Student Experience
- **Interactive tutorial (required)**: Multi-step guided experience, not skippable. Students must complete before accessing the app.
- **Tutorial starts with profile/settings**: First action is "Here's your account, you can change [X]" — personalization-first approach
- **Celebration after completion**: Tutorial ends with achievement/celebration screen ("You're all set! 🎉") before going to dashboard
- **Same tutorial for everyone**: All students see identical onboarding regardless of whether they have existing data (grades/QOD history)
- **Database flag tracking**: Add `has_completed_onboarding` boolean to `student_profiles` table, set to true after tutorial
- **Replay option in Settings**: "Replay Tutorial" button available in student settings — students can revisit anytime
- **Friendly and encouraging tone**: Tutorial copy uses positive reinforcement ("Great job!" "You've got this!") — supportive voice

### Student vs Parent Differentiation
- **Same design system and colors**: No separate visual theme — students and parents see identical branding/color palette
- **Student copy is more encouraging**: Parent UI is neutral/informational, student UI has positive reinforcement and celebration language
- **Management features completely hidden**: Students have no visibility into parent-only features (student management, family meetings, term tracking) — clean separation
- **Students CAN access**: Grades (view AND submit for approval), behavior, earnings, settings, daily tasks
- **Students can submit grades**: Students enter their own grades which go into pending approval queue for parent (uses existing MGMT-03 approval flow)

### Password Reset Flow
- Phase Context did not discuss this area — research/planner have discretion
- Requirements specify: OTP-based 6-digit code flow, email input, code + new password entry
- Roadmap decision: OTP over deep links (avoids platform-specific complexity)

### Claude's Discretion
- Password reset screen count and validation UX
- Email delivery confirmation handling
- Code expiry/retry logic
- Tutorial step count and specific interaction patterns
- Dashboard metric card visual design (icons, colors, spacing)
- Exact tutorial copy and messaging
- Error states and edge case handling
- Loading states between tutorial steps

</decisions>

<specifics>
## Specific Ideas

- Horizontal scrollable cards should feel like Instagram stories — swipe to see next metric
- Tutorial tone: "Great job!" "You've got this!" — positive and supportive
- Celebration screen uses emoji: "You're all set! 🎉"
- Metric context examples: "↑ 0.2 this term" for GPA, "🔥 7 day streak" for streaks

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Grade submission (students adding grades) already exists in validated features (MGMT-03 approval flow).

</deferred>

---

*Phase: 02-auth-student-routing*
*Context gathered: 2026-02-05*
