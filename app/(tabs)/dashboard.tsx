import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Add refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Rewards</Text>
          <Text style={styles.cardValue}>$0.00</Text>
          <Text style={styles.cardSubtitle}>This term</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current GPA</Text>
          <Text style={styles.cardValue}>--</Text>
          <Text style={styles.cardSubtitle}>No grades yet</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allocation Breakdown</Text>
        <View style={styles.allocationCard}>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Taxes (15%)</Text>
            <Text style={styles.allocationValue}>$0.00</Text>
          </View>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Retirement (10%)</Text>
            <Text style={styles.allocationValue}>$0.00</Text>
          </View>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Savings (25%)</Text>
            <Text style={styles.allocationValue}>$0.00</Text>
          </View>
          <View style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>Discretionary (50%)</Text>
            <Text style={styles.allocationValue}>$0.00</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Enter Grades</Text>
            <Text style={styles.actionDescription}>
              Add your latest grades to calculate rewards
            </Text>
          </View>
          <View style={styles.actionCard}>
            <Text style={styles.actionTitle}>Daily Check-in</Text>
            <Text style={styles.actionDescription}>
              Complete your behavior assessment
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 20,
    backgroundColor: '#4F46E5',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 4,
  },
  cardsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  allocationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  allocationLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  allocationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
