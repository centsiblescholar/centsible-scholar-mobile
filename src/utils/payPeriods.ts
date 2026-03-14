import {
  addDays,
  addWeeks,
  addMonths,
  differenceInDays,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
  format,
} from 'date-fns';

export type PayFrequency = 'weekly' | 'biweekly' | 'monthly' | 'midterm' | 'term';

export interface PayPeriod {
  periodNumber: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  hasEnded: boolean;
  daysRemaining: number;
  totalDays: number;
}

export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  midterm: 'Half-Term',
  term: 'Full Term',
};

/**
 * Compute all pay periods for a term given start/end dates and frequency.
 */
export function computePayPeriods(
  termStart: Date,
  termEnd: Date,
  frequency: PayFrequency
): PayPeriod[] {
  const now = startOfDay(new Date());
  const start = startOfDay(termStart);
  const end = startOfDay(termEnd);
  const periods: PayPeriod[] = [];

  if (frequency === 'term') {
    // Single period = entire term
    const totalDays = differenceInDays(end, start);
    const daysRemaining = Math.max(0, differenceInDays(end, now));
    periods.push({
      periodNumber: 1,
      startDate: start,
      endDate: end,
      isActive: !isBefore(now, start) && !isAfter(now, end),
      hasEnded: isAfter(now, end),
      daysRemaining,
      totalDays,
    });
    return periods;
  }

  let periodStart = start;
  let periodNumber = 1;

  while (isBefore(periodStart, end) || isEqual(periodStart, end)) {
    let periodEnd: Date;

    switch (frequency) {
      case 'weekly':
        periodEnd = addDays(periodStart, 6);
        break;
      case 'biweekly':
        periodEnd = addDays(periodStart, 13);
        break;
      case 'monthly':
        periodEnd = addDays(addMonths(periodStart, 1), -1);
        break;
      case 'midterm': {
        const totalTermDays = differenceInDays(end, start);
        const halfDays = Math.floor(totalTermDays / 2);
        if (periodNumber === 1) {
          periodEnd = addDays(start, halfDays - 1);
        } else {
          periodEnd = end;
        }
        break;
      }
      default:
        periodEnd = end;
    }

    // Cap at term end
    if (isAfter(periodEnd, end)) {
      periodEnd = end;
    }

    const totalDays = differenceInDays(periodEnd, periodStart) + 1;
    const daysRemaining = isAfter(now, periodEnd) ? 0 : Math.max(0, differenceInDays(periodEnd, now));

    periods.push({
      periodNumber,
      startDate: periodStart,
      endDate: periodEnd,
      isActive: !isBefore(now, periodStart) && !isAfter(now, periodEnd),
      hasEnded: isAfter(now, periodEnd),
      daysRemaining,
      totalDays,
    });

    periodStart = addDays(periodEnd, 1);
    periodNumber++;

    // Safety: midterm only has 2 periods
    if (frequency === 'midterm' && periodNumber > 2) break;
    // Safety: prevent infinite loops
    if (periodNumber > 100) break;
  }

  return periods;
}

/**
 * Get the currently active pay period, or null if none is active.
 */
export function getCurrentPayPeriod(periods: PayPeriod[]): PayPeriod | null {
  return periods.find((p) => p.isActive) || null;
}

/**
 * Get all ended periods that haven't been paid yet.
 */
export function getUnpaidEndedPeriods(
  periods: PayPeriod[],
  paidPeriodNumbers: Set<number>
): PayPeriod[] {
  return periods.filter((p) => p.hasEnded && !paidPeriodNumbers.has(p.periodNumber));
}

/**
 * Check if a pay period is ending soon (within threshold days).
 */
export function isPayPeriodEndingSoon(
  period: PayPeriod,
  thresholdDays: number = 3
): boolean {
  return period.isActive && period.daysRemaining <= thresholdDays;
}

/**
 * Format a pay period date range.
 */
export function formatPayPeriodRange(period: PayPeriod): string {
  return `${format(period.startDate, 'MMM d')} - ${format(period.endDate, 'MMM d, yyyy')}`;
}

/**
 * Get the total number of pay periods for a term.
 */
export function getPayPeriodCount(
  termStart: Date,
  termEnd: Date,
  frequency: PayFrequency
): number {
  return computePayPeriods(termStart, termEnd, frequency).length;
}
