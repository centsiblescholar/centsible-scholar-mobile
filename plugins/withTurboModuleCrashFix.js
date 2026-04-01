/**
 * Expo config plugin: Patch RCTTurboModule.mm to fix crash-on-launch.
 *
 * React Native 0.81.5 has a known bug where `performVoidMethodInvocation`
 * calls `convertNSExceptionToJSError(runtime, ...)` from the TurboModule
 * background queue when a native module throws an NSException.  Accessing
 * the Hermes runtime from this queue corrupts the GC, causing EXC_BAD_ACCESS.
 *
 * The non-void version (`performMethodInvocation`) was already fixed to only
 * touch the runtime on sync calls.  This plugin applies the same fix to the
 * void version.
 *
 * References:
 *   https://github.com/facebook/react-native/issues/53960
 *   https://github.com/facebook/react-native/issues/54859
 *   https://github.com/reactwg/react-native-new-architecture/discussions/276
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const TURBO_MODULE_PATH = path.join(
  'node_modules',
  'react-native',
  'ReactCommon',
  'react',
  'nativemodule',
  'core',
  'platform',
  'ios',
  'ReactCommon',
  'RCTTurboModule.mm'
);

// The buggy line in performVoidMethodInvocation — always throws via runtime.
const BUGGY_CATCH =
  '    } @catch (NSException *exception) {\n' +
  '      throw convertNSExceptionToJSError(runtime, exception, std::string{moduleName}, methodNameStr);\n' +
  '    } @finally {';

// Patched version — log instead of touching the Hermes runtime from the
// background queue.  This mirrors the fix already in performMethodInvocation.
const PATCHED_CATCH =
  '    } @catch (NSException *exception) {\n' +
  '      // Patched by withTurboModuleCrashFix: Do not access Hermes runtime\n' +
  '      // from the TurboModule background queue — it corrupts the GC.\n' +
  '      // See: https://github.com/facebook/react-native/issues/53960\n' +
  '      NSLog(@"[RCTTurboModule] Exception in void method %s.%s: %@", moduleName, methodName, exception);\n' +
  '    } @finally {';

function withTurboModuleCrashFix(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const filePath = path.resolve(projectRoot, TURBO_MODULE_PATH);

      if (!fs.existsSync(filePath)) {
        console.warn(
          '[withTurboModuleCrashFix] RCTTurboModule.mm not found at expected path. ' +
          'Skipping patch. Path: ' + filePath
        );
        return config;
      }

      let source = fs.readFileSync(filePath, 'utf-8');

      if (source.includes('Patched by withTurboModuleCrashFix')) {
        console.log('[withTurboModuleCrashFix] Already patched — skipping.');
        return config;
      }

      if (!source.includes(BUGGY_CATCH)) {
        console.warn(
          '[withTurboModuleCrashFix] Could not find the expected code pattern in ' +
          'RCTTurboModule.mm. The file may have been updated. Skipping patch.'
        );
        return config;
      }

      source = source.replace(BUGGY_CATCH, PATCHED_CATCH);
      fs.writeFileSync(filePath, source, 'utf-8');
      console.log('[withTurboModuleCrashFix] Successfully patched RCTTurboModule.mm');

      return config;
    },
  ]);
}

module.exports = withTurboModuleCrashFix;
