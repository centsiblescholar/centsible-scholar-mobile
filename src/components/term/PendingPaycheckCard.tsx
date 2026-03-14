import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TermSnapshot } from '../../hooks/useTermTracking';

interface PendingPaycheckCardProps {
  paycheck: TermSnapshot;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export function PendingPaycheckCard({
  paycheck,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: PendingPaycheckCardProps) {
  const isBusy = isApproving || isRejecting;
  const allocation = paycheck.allocation_breakdown;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.pendingBadge}>
            <Ionicons name="time-outline" size={14} color="#F59E0B" />
            <Text style={styles.pendingText}>Pending Review</Text>
          </View>
          {paycheck.pay_period_number && (
            <Text style={styles.periodLabel}>Period {paycheck.pay_period_number}</Text>
          )}
        </View>
        <Text style={styles.totalAmount}>${paycheck.total_earnings.toFixed(2)}</Text>
      </View>

      {/* Earnings breakdown */}
      <View style={styles.breakdownSection}>
        <EarningsRow label="Grade Earnings" amount={paycheck.grade_earnings} icon="school-outline" />
        <EarningsRow label="Behavior Bonus" amount={paycheck.behavior_earnings} icon="heart-outline" />
        <EarningsRow label="Education Bonus" amount={paycheck.education_earnings} icon="book-outline" />
      </View>

      {/* GPA */}
      {paycheck.gpa !== null && (
        <View style={styles.gpaRow}>
          <Text style={styles.gpaLabel}>GPA</Text>
          <Text style={styles.gpaValue}>{paycheck.gpa.toFixed(2)}</Text>
        </View>
      )}

      {/* Allocation preview */}
      {allocation && (
        <View style={styles.allocationSection}>
          <Text style={styles.allocationTitle}>Allocation Preview</Text>
          <View style={styles.allocationGrid}>
            <AllocationItem label="Taxes" amount={allocation.tax ?? 0} color="#EF4444" />
            <AllocationItem label="Retirement" amount={allocation.retirement ?? 0} color="#8B5CF6" />
            <AllocationItem label="Savings" amount={allocation.savings ?? 0} color="#3B82F6" />
            <AllocationItem label="Spending" amount={allocation.discretionary ?? 0} color="#10B981" />
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.rejectButton, isBusy && styles.disabledButton]}
          onPress={() => onReject(paycheck.id)}
          disabled={isBusy}
        >
          {isRejecting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.approveButton, isBusy && styles.disabledButton]}
          onPress={() => onApprove(paycheck.id)}
          disabled={isBusy}
        >
          {isApproving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.approveButtonText}>Approve</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EarningsRow({ label, amount, icon }: { label: string; amount: number; icon: string }) {
  return (
    <View style={styles.earningsRow}>
      <View style={styles.earningsRowLeft}>
        <Ionicons name={icon as any} size={14} color="#6B7280" />
        <Text style={styles.earningsLabel}>{label}</Text>
      </View>
      <Text style={styles.earningsAmount}>${amount.toFixed(2)}</Text>
    </View>
  );
}

function AllocationItem({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <View style={styles.allocationItem}>
      <View style={[styles.allocationDot, { backgroundColor: color }]} />
      <Text style={styles.allocationLabel}>{label}</Text>
      <Text style={styles.allocationAmount}>${amount.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  periodLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  breakdownSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earningsLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  earningsAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  gpaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  gpaLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  gpaValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6366F1',
  },
  allocationSection: {
    marginBottom: 14,
  },
  allocationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  allocationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '47%',
  },
  allocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  allocationLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  allocationAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
