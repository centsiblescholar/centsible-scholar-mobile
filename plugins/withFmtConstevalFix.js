/**
 * Expo config plugin: Fix fmt library consteval compilation errors.
 *
 * When building React Native from source with Xcode 16+, the `fmt` C++ library
 * uses `consteval` which triggers hard compilation errors. This plugin forces
 * `FMT_USE_CONSTEVAL=0` by patching the fmt base.h header after pod install.
 *
 * This only matters when `buildReactNativeFromSource: true` is set, since
 * prebuilt binaries don't compile fmt from source.
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FMT_BASE_H_PATH = path.join('ios', 'Pods', 'fmt', 'include', 'fmt', 'base.h');

const ORIGINAL_CHECK = '#if !defined(__cpp_lib_is_constant_evaluated)';
const PATCHED_CHECK = '// Patched by withFmtConstevalFix: Force consteval OFF for Xcode 16+\n#if 1';

function withFmtConstevalFix(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const filePath = path.resolve(projectRoot, FMT_BASE_H_PATH);

      if (!fs.existsSync(filePath)) {
        console.log('[withFmtConstevalFix] fmt/base.h not found — skipping (may not be building from source).');
        return config;
      }

      let source = fs.readFileSync(filePath, 'utf-8');

      if (source.includes('Patched by withFmtConstevalFix')) {
        console.log('[withFmtConstevalFix] Already patched — skipping.');
        return config;
      }

      if (!source.includes(ORIGINAL_CHECK)) {
        console.warn('[withFmtConstevalFix] Could not find expected pattern in fmt/base.h. Skipping.');
        return config;
      }

      source = source.replace(ORIGINAL_CHECK, PATCHED_CHECK);
      fs.writeFileSync(filePath, source, 'utf-8');
      console.log('[withFmtConstevalFix] Successfully patched fmt/base.h — FMT_USE_CONSTEVAL forced to 0.');

      return config;
    },
  ]);
}

module.exports = withFmtConstevalFix;
