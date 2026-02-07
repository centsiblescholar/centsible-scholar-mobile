import { Platform } from 'react-native';

export const REVENUECAT_CONFIG = {
  apiKeys: {
    ios: 'appl_REPLACE_WITH_REAL_KEY',
    android: 'goog_REPLACE_WITH_REAL_KEY',
  },
  entitlementId: 'premium',
  polling: {
    intervalMs: 2000,
    timeoutMs: 60000,
  },
} as const;

export function getRevenueCatApiKey(): string {
  return Platform.OS === 'ios'
    ? REVENUECAT_CONFIG.apiKeys.ios
    : REVENUECAT_CONFIG.apiKeys.android;
}
