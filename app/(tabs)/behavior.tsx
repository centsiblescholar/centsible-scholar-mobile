import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function BehaviorScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Behavior Assessment</Text>
        <Text style={styles.subtitle}>
          Track your daily behaviors to earn bonus rewards
        </Text>

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Daily Check-in</Text>
          <Text style={styles.emptyDescription}>
            Complete your behavior assessment each day to earn bonus rewards on top of your grade-based earnings.
          </Text>
        </View>

        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>Assessment Categories</Text>

          <View style={styles.categorySection}>
            <Text style={styles.categoryHeader}>Obligations</Text>
            <View style={styles.categoryList}>
              <Text style={styles.categoryItem}>Diet</Text>
              <Text style={styles.categoryItem}>Exercise</Text>
              <Text style={styles.categoryItem}>School Work</Text>
              <Text style={styles.categoryItem}>Hygiene</Text>
              <Text style={styles.categoryItem}>Respect</Text>
            </View>
          </View>

          <View style={styles.categorySection}>
            <Text style={styles.categoryHeader}>Opportunities</Text>
            <View style={styles.categoryList}>
              <Text style={styles.categoryItem}>Responsibilities</Text>
              <Text style={styles.categoryItem}>Attitude</Text>
              <Text style={styles.categoryItem}>Cooperation</Text>
              <Text style={styles.categoryItem}>Courtesy</Text>
              <Text style={styles.categoryItem}>Service</Text>
            </View>
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
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  categoriesContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 8,
  },
  categoryList: {
    gap: 4,
  },
  categoryItem: {
    fontSize: 14,
    color: '#6B7280',
    paddingLeft: 12,
  },
});
