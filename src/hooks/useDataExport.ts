import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '../integrations/supabase/client';

export interface ExportSummary {
  students: number;
  grades: number;
  assessments: number;
  assessments_complete: number;
  qod_answers: number;
  savings_goals: number;
  behavior_bonuses: number;
  badges: number;
  family_meetings: number;
  term_configs: number;
  term_snapshots: number;
}

interface ExportState {
  isLoading: boolean;
  isFetchingSummary: boolean;
  progress: number;
  error: string | null;
  summary: ExportSummary | null;
}

export function useDataExport() {
  const [state, setState] = useState<ExportState>({
    isLoading: false,
    isFetchingSummary: false,
    progress: 0,
    error: null,
    summary: null,
  });

  // Track last export params for retry
  const lastExportRef = useRef<{ format: 'json' | 'csv'; includeStudents: boolean } | null>(null);

  const fetchSummary = useCallback(async (includeStudents: boolean = true) => {
    setState((prev) => ({ ...prev, isFetchingSummary: true, error: null }));
    try {
      const { data, error } = await supabase.functions.invoke('export-user-data', {
        body: { format: 'json', includeStudents },
      });

      if (error) throw new Error(error.message || 'Failed to fetch export summary');
      if (data?.error) throw new Error(data.error);

      setState((prev) => ({
        ...prev,
        isFetchingSummary: false,
        summary: data.summary as ExportSummary,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, isFetchingSummary: false, error: message }));
    }
  }, []);

  const exportData = useCallback(async (format: 'json' | 'csv', includeStudents: boolean) => {
    lastExportRef.current = { format, includeStudents };
    setState((prev) => ({ ...prev, isLoading: true, progress: 10, error: null }));

    try {
      // Call edge function
      const { data, error } = await supabase.functions.invoke('export-user-data', {
        body: { format, includeStudents },
      });

      if (error) throw new Error(error.message || 'Export request failed');
      if (data?.error) throw new Error(data.error);

      setState((prev) => ({ ...prev, progress: 50 }));

      const today = new Date().toISOString().split('T')[0];
      let fileUri: string;

      if (format === 'json') {
        // Write JSON file
        const filename = `centsible-scholar-export-${today}.json`;
        const file = new File(Paths.cache, filename);
        if (file.exists) {
          file.delete();
        }
        file.create();
        file.write(JSON.stringify(data.content, null, 2));
        fileUri = file.uri;
      } else {
        // Write ZIP file from base64
        const filename = data.filename || `centsible-scholar-export-${today}.zip`;
        const file = new File(Paths.cache, filename);
        if (file.exists) {
          file.delete();
        }
        file.create();
        file.write(data.zipBase64, { encoding: 'base64' });
        fileUri = file.uri;
      }

      setState((prev) => ({ ...prev, progress: 80 }));

      // Open share sheet
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: format === 'json' ? 'application/json' : 'application/zip',
        dialogTitle: 'Export Your Data',
        UTI: format === 'json' ? 'public.json' : 'com.pkware.zip-archive',
      });

      setState((prev) => ({ ...prev, progress: 100, isLoading: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, isLoading: false, progress: 0, error: message }));
      Alert.alert('Export Failed', message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: () => {
            if (lastExportRef.current) {
              exportData(lastExportRef.current.format, lastExportRef.current.includeStudents);
            }
          },
        },
      ]);
    }
  }, []);

  const retry = useCallback(() => {
    if (lastExportRef.current) {
      exportData(lastExportRef.current.format, lastExportRef.current.includeStudents);
    }
  }, [exportData]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    isLoading: state.isLoading,
    isFetchingSummary: state.isFetchingSummary,
    progress: state.progress,
    error: state.error,
    summary: state.summary,
    fetchSummary,
    exportData,
    retry,
    clearError,
  };
}
