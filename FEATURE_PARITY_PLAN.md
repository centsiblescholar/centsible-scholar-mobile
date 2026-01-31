# Feature Parity Plan: Mobile vs Premium Web App

This document compares the centsible-scholar-mobile app with the centsible-scholar-premium web app and outlines what needs to be implemented to achieve feature parity.

---

## Quick Summary

| Category | Premium Web | Mobile | Gap |
|----------|-------------|--------|-----|
| Dashboard | ✅ Full | ⚠️ Basic | Need enhancements |
| Grades | ✅ Full | ✅ Good | Minor gaps |
| Behavior | ✅ Full | ⚠️ Basic | Missing analytics/bonuses |
| Learn (QOD) | ✅ Full | ✅ Good | Missing bonus tracking |
| Budget/Earnings | ✅ Full | ❌ None | **Major gap** |
| Family Meetings | ✅ Full | ❌ None | **Major gap** |
| Term Tracking | ✅ Full | ❌ None | **Major gap** |
| Analytics | ✅ Full | ❌ None | **Major gap** |
| Settings | ✅ Full | ⚠️ Basic | Missing edit profile |
| Student Management | ✅ Full | ⚠️ View only | Missing CRUD |

---

## Detailed Feature Comparison

### ✅ FEATURES MOBILE HAS (Good Parity)

1. **Authentication**
   - ✅ Email/password login
   - ✅ Sign out
   - ✅ Account deletion link
   - ✅ Session management

2. **Dashboard Basics**
   - ✅ Total rewards display
   - ✅ Current GPA
   - ✅ Behavior score
   - ✅ Allocation breakdown (Tax, Retirement, Savings, Discretionary)
   - ✅ Recent grades list
   - ✅ Multi-student selection (parents)

3. **Grade Entry & Tracking**
   - ✅ Add new grades
   - ✅ View grade history
   - ✅ Grade multiplier system (A-F)
   - ✅ Reward calculations

4. **Behavior Assessment**
   - ✅ 10 categories (5 Obligations + 5 Opportunities)
   - ✅ 1-5 scoring scale
   - ✅ Save as draft
   - ✅ Submit assessment
   - ✅ Today's score display

5. **Question of the Day**
   - ✅ Daily financial questions
   - ✅ Grade-appropriate content
   - ✅ Answer feedback
   - ✅ Streak tracking

6. **Settings**
   - ✅ Profile display
   - ✅ Subscription status
   - ✅ Privacy policy link
   - ✅ Terms of service link
   - ✅ Help center link
   - ✅ Contact support

---

### ⚠️ FEATURES MOBILE IS MISSING

#### Priority 1: Core Functionality Gaps

**1. Budget Planner & Earnings View**
*Complexity: Medium | Impact: High*

Web app has:
- Earnings summary / paycheck breakdown
- Budget calculator
- Savings goals tracking
- Visual allocation breakdown

Mobile needs:
- New "Earnings" or "Money" tab (or section in Dashboard)
- Paycheck breakdown view
- Savings goals management
- External savings account tracking

**2. Behavior Analytics & Bonuses**
*Complexity: Medium | Impact: High*

Web app has:
- Behavior dashboard with charts
- Historical trends visualization
- Behavior bonus calculations and tracking
- Weekly/term summaries

Mobile needs:
- Charts/graphs showing behavior trends
- Bonus tier display and current bonus amount
- Historical assessment views
- Bonus calculation: 3.0-3.49 (5%), 3.5-3.99 (10%), 4.0-4.49 (15%), 4.5-5.0 (20%)

**3. Education Bonus Tracking**
*Complexity: Low | Impact: Medium*

Web app has:
- QOD progress tracking with percentage
- Education bonus calculations
- XP/Level system

Mobile needs:
- Show education bonus in dashboard
- QOD accuracy percentage
- Bonus tiers: 90%+ (5%), 80-89% (4%), 70-79% (3%), 60-69% (2%), 50-59% (1%)

---

#### Priority 2: Enhanced Features

**4. Term Tracking**
*Complexity: High | Impact: Medium*

Web app has:
- Term configuration (start/end dates)
- Term snapshots
- GPA history by term
- Printable summaries
- Term-to-term comparison

Mobile needs:
- Term management screen
- Term progress indicators
- Historical term data view

**5. Family Meetings**
*Complexity: High | Impact: Medium*

Web app has:
- Meeting scheduling
- Meeting history
- Attendance tracking
- Post-meeting self-assessments (students)
- Low score alerts
- Child comparison view

Mobile needs:
- Family meetings tab or section
- Meeting schedule view
- Meeting reminder notifications
- Self-assessment form (students)

**6. Analytics & Reporting**
*Complexity: Medium | Impact: Medium*

Web app has:
- Bar charts, pie charts, line graphs
- Data export (CSV/JSON)
- Comprehensive analytics dashboard

Mobile needs:
- Chart components (use react-native-chart-kit or similar)
- Visual analytics views
- Data export capability

**7. Edit Profile**
*Complexity: Low | Impact: Medium*

Web app has:
- Edit student name
- Change grade level
- Update base reward amount

Mobile needs:
- Edit profile screen in settings
- Form for updating profile fields
- API integration for updates

---

#### Priority 3: Nice-to-Have Features

**8. Student Management (Parents)**
*Complexity: Medium | Impact: Medium*

Web app has:
- Add new students
- Remove students
- Edit student details
- Set student passwords

Mobile needs:
- Student management screen
- Add student form
- Student profile editing

**9. Grade Approval Workflow (Parents)**
*Complexity: Medium | Impact: Low*

Web app has:
- Pending grades review
- Approve/reject workflow

Mobile needs:
- Pending grades list for parents
- Approval actions

**10. Behavior Dispute Resolution**
*Complexity: Medium | Impact: Low*

Web app has:
- Dispute dialog for score disagreements
- Resolution workflow

Mobile needs:
- Dispute submission UI
- Resolution status tracking

---

### ❌ FEATURES TO EXCLUDE FROM MOBILE

These features are better suited for web-only:

1. **Influencer Portal** - Complex admin functionality
2. **Admin Dashboard** - Backend management
3. **Monitoring/Debug Pages** - Developer tools
4. **Data Management/Export** - Complex data operations
5. **Vibrant Theme Variants** - Can add later as enhancement

---

## Recommended Implementation Order

### Phase 1: Quick Wins (1-2 weeks)
1. ✅ Education bonus display on dashboard
2. ✅ Behavior bonus display and calculation
3. ✅ Edit profile screen
4. ✅ QOD accuracy tracking

### Phase 2: Core Parity (2-3 weeks)
5. ✅ Earnings/Budget screen
6. ✅ Behavior analytics with charts
7. ✅ Grade history charts
8. ✅ Savings goals

### Phase 3: Enhanced Features (3-4 weeks)
9. 📅 Term tracking
10. 👨‍👩‍👧 Family meetings basics
11. 👶 Student management (parents)
12. ✓ Grade approval workflow

---

## Technical Implementation Notes

### New Dependencies Needed
```bash
npm install react-native-chart-kit
npm install react-native-svg
npm install date-fns
```

### New Files to Create

```
app/
├── (tabs)/
│   ├── earnings.tsx          # New earnings/budget tab
│   └── _layout.tsx           # Update to add new tab
├── (settings)/
│   ├── edit-profile.tsx      # Edit profile screen
│   └── term-tracking.tsx     # Term management
├── family-meetings/
│   ├── index.tsx             # Family meetings list
│   └── assessment.tsx        # Meeting self-assessment
src/
├── components/
│   ├── charts/
│   │   ├── BehaviorChart.tsx
│   │   ├── GradeChart.tsx
│   │   └── AllocationPie.tsx
│   └── earnings/
│       ├── PaycheckBreakdown.tsx
│       └── SavingsGoals.tsx
├── hooks/
│   ├── useTermTracking.ts
│   ├── useFamilyMeetings.ts
│   ├── useEducationBonus.ts
│   └── useBehaviorBonus.ts
```

### Database Tables Already Available
These Supabase tables exist and can be queried:
- `term_snapshots`
- `family_meetings`
- `meeting_assessments`
- `savings_goals`
- `education_bonus_results`
- `behavior_bonuses`

---

## Estimated Development Time

| Phase | Features | Estimate |
|-------|----------|----------|
| Phase 1 | Quick wins | 1-2 weeks |
| Phase 2 | Core parity | 2-3 weeks |
| Phase 3 | Enhanced | 3-4 weeks |
| **Total** | Full parity | **6-9 weeks** |

---

## Next Steps

1. **Review this plan** and prioritize based on user needs
2. **Start with Phase 1** - Quick wins for immediate impact
3. **Build incrementally** - Ship features as they're ready
4. **Test on device** - Ensure charts and UI work well on mobile

Would you like me to start implementing any of these features?
