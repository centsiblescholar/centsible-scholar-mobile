import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDataExport, ExportSummary } from '../src/hooks/useDataExport';
import { useUserProfile } from '../src/hooks/useUserProfile';
import { useTheme, type ThemeColors } from '@/theme';

type ExportFormat = 'json' | 'csv';

export default function DataExportScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const summaryStylesThemed = useMemo(() => createSummaryStyles(colors), [colors]);
  const { isParent } = useUserProfile();
  const {
    isLoading,
    isFetchingSummary,
    progress,
    summary,
    exportData,
    fetchSummary,
  } = useDataExport();

  const [format, setFormat] = useState<ExportFormat>('json');
  const [includeStudents, setIncludeStudents] = useState(true);

  useEffect(() => {
    if (isParent) {
      fetchSummary(includeStudents);
    }
  }, [isParent, fetchSummary, includeStudents]);

  const handleExport = () => {
    exportData(format, includeStudents);
  };

  const totalRecords = summary
    ? Object.values(summary).reduce((sum, val) => sum + val, 0)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>Export Your Data</Text>
        <Text style={styles.description}>
          Download a copy of all your Centsible Scholar data. Your export will include your
          profile, subscription, and family data.
        </Text>
      </View>

      {/* Summary Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Summary</Text>
        <View style={styles.card}>
          {isFetchingSummary ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.skeletonRow}>
                  <View style={styles.skeletonLabel} />
                  <View style={styles.skeletonValue} />
                </View>
              ))}
            </View>
          ) : summary ? (
            <View>
              <SummaryRow label="Total records" value={totalRecords} bold colors={colors} styles={summaryStylesThemed} />
              {summary.students > 0 && <SummaryRow label="Students" value={summary.students} colors={colors} styles={summaryStylesThemed} />}
              {summary.grades > 0 && <SummaryRow label="Grades" value={summary.grades} colors={colors} styles={summaryStylesThemed} />}
              {summary.assessments > 0 && <SummaryRow label="Behavior assessments" value={summary.assessments} colors={colors} styles={summaryStylesThemed} />}
              {summary.qod_answers > 0 && <SummaryRow label="QOD answers" value={summary.qod_answers} colors={colors} styles={summaryStylesThemed} />}
              {summary.savings_goals > 0 && <SummaryRow label="Savings goals" value={summary.savings_goals} colors={colors} styles={summaryStylesThemed} />}
              {summary.badges > 0 && <SummaryRow label="Badges" value={summary.badges} colors={colors} styles={summaryStylesThemed} />}
              {summary.behavior_bonuses > 0 && <SummaryRow label="Behavior bonuses" value={summary.behavior_bonuses} colors={colors} styles={summaryStylesThemed} />}
              {summary.family_meetings > 0 && <SummaryRow label="Family meetings" value={summary.family_meetings} colors={colors} styles={summaryStylesThemed} />}
              {summary.term_configs > 0 && <SummaryRow label="Term configs" value={summary.term_configs} colors={colors} styles={summaryStylesThemed} />}
              {summary.term_snapshots > 0 && <SummaryRow label="Term snapshots" value={summary.term_snapshots} colors={colors} styles={summaryStylesThemed} />}
            </View>
          ) : (
            <Text style={styles.emptyText}>No data available</Text>
          )}
        </View>
      </View>

      {/* Format Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Format</Text>
        <View style={styles.formatContainer}>
          <TouchableOpacity
            style={[styles.formatCard, format === 'json' && styles.formatCardSelected]}
            onPress={() => setFormat('json')}
            activeOpacity={0.7}
          >
            <View style={styles.formatRadio}>
              <View style={[styles.radioOuter, format === 'json' && styles.radioOuterSelected]}>
                {format === 'json' && <View style={styles.radioInner} />}
              </View>
            </View>
            <View style={styles.formatInfo}>
              <Text style={[styles.formatTitle, format === 'json' && styles.formatTitleSelected]}>
                JSON (Single File)
              </Text>
              <Text style={styles.formatDescription}>All data in one structured file</Text>
            </View>
            <Ionicons name="document-text-outline" size={24} color={format === 'json' ? colors.primary : colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.formatCard, format === 'csv' && styles.formatCardSelected]}
            onPress={() => setFormat('csv')}
            activeOpacity={0.7}
          >
            <View style={styles.formatRadio}>
              <View style={[styles.radioOuter, format === 'csv' && styles.radioOuterSelected]}>
                {format === 'csv' && <View style={styles.radioInner} />}
              </View>
            </View>
            <View style={styles.formatInfo}>
              <Text style={[styles.formatTitle, format === 'csv' && styles.formatTitleSelected]}>
                CSV (ZIP Archive)
              </Text>
              <Text style={styles.formatDescription}>Separate spreadsheet files per data type</Text>
            </View>
            <Ionicons name="archive-outline" size={24} color={format === 'csv' ? colors.primary : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Student Data Toggle */}
      {summary && summary.students > 0 && (
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="people-outline" size={22} color={colors.primary} />
                <View style={styles.toggleText}>
                  <Text style={styles.toggleLabel}>Include Student Data</Text>
                  <Text style={styles.toggleDescription}>
                    Export grades, assessments, and activity for {summary.students}{' '}
                    {summary.students === 1 ? 'student' : 'students'}
                  </Text>
                </View>
              </View>
              <Switch
                value={includeStudents}
                onValueChange={setIncludeStudents}
                trackColor={{ false: colors.inputBorder, true: colors.primary + '66' }}
                thumbColor={includeStudents ? colors.primary : colors.backgroundSecondary}
              />
            </View>
          </View>
        </View>
      )}

      {/* Export Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.exportButton, isLoading && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={isLoading || isFetchingSummary}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color={colors.textInverse} />
              <Text style={styles.exportButtonText}>Export Data</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      {/* Loading Overlay */}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.overlayTitle}>Preparing Export</Text>
            <Text style={styles.overlayDescription}>
              {progress < 50
                ? 'Gathering your data...'
                : progress < 80
                  ? 'Building export file...'
                  : 'Opening share sheet...'}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function SummaryRow({ label, value, bold, colors, styles }: { label: string; value: number; bold?: boolean; colors: ThemeColors; styles: any }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.value, bold && styles.bold]}>{value.toLocaleString()}</Text>
    </View>
  );
}

function createSummaryStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    label: { fontSize: 15, color: colors.text },
    value: { fontSize: 15, color: colors.textSecondary },
    bold: { fontWeight: '600', color: colors.text, fontSize: 16 },
  });
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundSecondary },
    contentContainer: { padding: 16 },
    headerSection: { alignItems: 'center', paddingVertical: 24 },
    iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
    description: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 },
    card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    skeletonContainer: { gap: 12 },
    skeletonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    skeletonLabel: { width: 120, height: 14, backgroundColor: colors.border, borderRadius: 4 },
    skeletonValue: { width: 40, height: 14, backgroundColor: colors.border, borderRadius: 4 },
    emptyText: { fontSize: 15, color: colors.textTertiary, textAlign: 'center', paddingVertical: 12 },
    formatContainer: { gap: 10 },
    formatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, minHeight: 64 },
    formatCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    formatRadio: { marginRight: 12 },
    radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.inputBorder, justifyContent: 'center', alignItems: 'center' },
    radioOuterSelected: { borderColor: colors.primary },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
    formatInfo: { flex: 1 },
    formatTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    formatTitleSelected: { color: colors.primary },
    formatDescription: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toggleInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
    toggleText: { marginLeft: 12, flex: 1 },
    toggleLabel: { fontSize: 16, fontWeight: '500', color: colors.text },
    toggleDescription: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    exportButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 52, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    exportButtonDisabled: { opacity: 0.7 },
    exportButtonText: { color: colors.textInverse, fontSize: 17, fontWeight: '600' },
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    overlayCard: { backgroundColor: colors.card, borderRadius: 16, padding: 32, alignItems: 'center', width: 280, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
    overlayTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8 },
    overlayDescription: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
    progressBarContainer: { width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
    progressText: { fontSize: 13, color: colors.textSecondary, marginTop: 8 },
  });
}
