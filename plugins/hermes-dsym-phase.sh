set -euo pipefail

CONFIG_LOWER=$(echo "$CONFIGURATION" | tr '[:upper:]' '[:lower:]')
if [ "$CONFIG_LOWER" != "release" ]; then
  echo "Hermes dSYM: skipping ($CONFIGURATION)"
  exit 0
fi

PODSPEC="$PODS_ROOT/hermes-engine/hermes-engine.podspec.json"
if [ ! -f "$PODSPEC" ]; then
  echo "warning: hermes-engine podspec not found at $PODSPEC — skipping"
  exit 0
fi

HERMES_VERSION=$(/usr/bin/python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["version"])' "$PODSPEC")
if [ -z "$HERMES_VERSION" ]; then
  echo "error: could not read Hermes version from $PODSPEC"
  exit 1
fi

CACHE_ROOT="${HOME}/Library/Caches/CentsibleScholar/hermes-dsym"
CACHE_DIR="${CACHE_ROOT}/${HERMES_VERSION}-${CONFIG_LOWER}"
TARBALL="${CACHE_DIR}/hermes-dsym.tar.gz"
EXTRACTED="${CACHE_DIR}/extracted"
URL="https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/${HERMES_VERSION}/react-native-artifacts-${HERMES_VERSION}-hermes-framework-dSYM-${CONFIG_LOWER}.tar.gz"

if [ ! -d "$EXTRACTED" ]; then
  mkdir -p "$CACHE_DIR"
  echo "Hermes dSYM: downloading $URL"
  /usr/bin/curl -fL --retry 3 -o "$TARBALL" "$URL"
  mkdir -p "$EXTRACTED"
  /usr/bin/tar -xzf "$TARBALL" -C "$EXTRACTED"
fi

APP_HERMES="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/hermes.framework/hermes"
if [ ! -f "$APP_HERMES" ]; then
  echo "warning: hermes binary not found at $APP_HERMES — skipping dSYM copy"
  exit 0
fi

WANT_UUIDS=$(/usr/bin/xcrun dwarfdump --uuid "$APP_HERMES" | awk '{print $2}' | sort -u)
if [ -z "$WANT_UUIDS" ]; then
  echo "error: could not read UUIDs from $APP_HERMES"
  exit 1
fi

MATCH=""
while IFS= read -r candidate; do
  HAVE=$(/usr/bin/xcrun dwarfdump --uuid "$candidate" 2>/dev/null | awk '{print $2}' | sort -u)
  [ -z "$HAVE" ] && continue
  if [ "$HAVE" = "$WANT_UUIDS" ]; then
    MATCH="$(dirname "$(dirname "$(dirname "$(dirname "$candidate")")")")"
    break
  fi
  for u in $WANT_UUIDS; do
    if echo "$HAVE" | grep -qx "$u"; then
      MATCH="$(dirname "$(dirname "$(dirname "$(dirname "$candidate")")")")"
      break 2
    fi
  done
done < <(/usr/bin/find "$EXTRACTED" -type f -path '*/hermes.framework.dSYM/Contents/Resources/DWARF/hermes')

if [ -z "$MATCH" ]; then
  echo "error: no hermes.framework.dSYM in tarball matches app binary UUID(s): $WANT_UUIDS"
  exit 1
fi

mkdir -p "$DWARF_DSYM_FOLDER_PATH"
rm -rf "${DWARF_DSYM_FOLDER_PATH}/hermes.framework.dSYM"
/bin/cp -R "$MATCH" "$DWARF_DSYM_FOLDER_PATH/"
echo "Hermes dSYM: copied $MATCH -> $DWARF_DSYM_FOLDER_PATH"
