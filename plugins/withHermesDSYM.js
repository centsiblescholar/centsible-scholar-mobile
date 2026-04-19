/**
 * Expo config plugin: Inject a matching hermes.framework.dSYM into the archive.
 *
 * RN 0.81.5 consumes Hermes as a prebuilt xcframework from Maven that ships
 * WITHOUT dSYMs, producing an App Store Connect "Upload Symbols Failed" warning
 * on every archive and unsymbolicated Hermes crashes in production.
 *
 * Adds a Run Script build phase that, on Release builds, downloads the matching
 * dSYM tarball from the same Maven namespace and copies the UUID-matching
 * hermes.framework.dSYM into $DWARF_DSYM_FOLDER_PATH.
 */
const { withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PHASE_NAME = '[CentsibleScholar] Download Hermes dSYM';
const SCRIPT_PATH = path.join(__dirname, 'hermes-dsym-phase.sh');

function withHermesDSYM(config) {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const projectName = config.modRequest.projectName;

    const nativeTargets = xcodeProject.pbxNativeTargetSection();
    let targetUuid = null;
    for (const [uuid, target] of Object.entries(nativeTargets)) {
      if (uuid.endsWith('_comment')) continue;
      const name = (target.name || '').replace(/"/g, '');
      if (name === projectName) {
        targetUuid = uuid;
        break;
      }
    }

    if (!targetUuid) {
      console.warn(`[withHermesDSYM] Could not find native target "${projectName}" — skipping.`);
      return config;
    }

    const shellScriptSection = xcodeProject.hash.project.objects['PBXShellScriptBuildPhase'] || {};
    const target = nativeTargets[targetUuid];
    const existing = (target.buildPhases || []).some((ref) => {
      const phase = shellScriptSection[ref.value];
      if (!phase) return false;
      const phaseName = (phase.name || '').replace(/"/g, '');
      return phaseName === PHASE_NAME;
    });

    if (existing) {
      console.log('[withHermesDSYM] Build phase already present — skipping.');
      return config;
    }

    const shellScript = fs.readFileSync(SCRIPT_PATH, 'utf-8');

    xcodeProject.addBuildPhase(
      [],
      'PBXShellScriptBuildPhase',
      PHASE_NAME,
      targetUuid,
      {
        shellPath: '/bin/sh',
        shellScript,
        inputPaths: [],
        outputPaths: [],
      }
    );

    console.log(`[withHermesDSYM] Added "${PHASE_NAME}" build phase to ${projectName}.`);
    return config;
  });
}

module.exports = withHermesDSYM;
