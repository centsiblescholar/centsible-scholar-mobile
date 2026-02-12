/**
 * ESLint flat config for Centsible Scholar Mobile
 *
 * Rules:
 * - react-native/no-color-literals: warns on hardcoded color values in StyleSheet
 * - react-native/no-inline-styles: warns on inline style objects
 *
 * Set to 'warn' during migration. Change to 'error' after Phase 6 migration complete.
 */

const reactNativePlugin = require('eslint-plugin-react-native');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['node_modules/**', 'supabase/functions/**'],
    plugins: {
      'react-native': reactNativePlugin,
    },
    rules: {
      'react-native/no-color-literals': 'warn',
      'react-native/no-inline-styles': 'warn',
    },
  },
];
