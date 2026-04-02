#!/bin/bash
#
# Centsible Scholar - App Store Screenshot Capture Script
# --------------------------------------------------------
# Run this on your Mac from the project root:
#   chmod +x scripts/capture-screenshots.sh
#   ./scripts/capture-screenshots.sh
#
# Prerequisites:
#   - Xcode installed with iOS 18+ simulators
#   - Expo dev server running: npx expo start
#   - App installed on simulators (run once first via npx expo run:ios)
#
# This script captures screenshots for:
#   - iPhone 17 Pro Max (6.9" — 1320x2868)
#   - iPad (skipped if not available)

set -e

# ─── Configuration ────────────────────────────────────────────
SCHEME="centsiblescholar"
OUTPUT_DIR="./screenshots/app-store"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Device names (must match what's in `xcrun simctl list devices`)
IPHONE_DEVICE="iPhone 17 Pro Max"
IPAD_DEVICE="iPad Pro 13-inch (M4)"

# Screens to capture — tab routes use the Expo deep link scheme
# Format: "filename|deep_link_path|wait_seconds|description"
SCREENS=(
  "01_student_dashboard|dashboard|5|Student Dashboard - daily tasks and stats"
  "02_grades|grades|4|Grade Entry and Analytics"
  "03_behavior|behavior|4|Behavior Assessment"
  "04_learn|learn|4|Financial Education & QOD"
  "05_earnings|earnings|4|Earnings & Rewards Breakdown"
  "06_parent_dashboard|dashboard|5|Parent Dashboard - family overview"
  "07_grade_approval|grade-approval|4|Parent Grade Approval"
  "08_student_management|student-management|4|Student Management"
)

# ─── Helper Functions ─────────────────────────────────────────

print_step() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

wait_for_boot() {
  local device_name="$1"
  local udid="$2"
  echo "  Waiting for $device_name to boot..."
  xcrun simctl bootstatus "$udid" 2>/dev/null || true
  sleep 3
}

get_device_udid() {
  local device_name="$1"
  local udid
  udid=$(xcrun simctl list devices available -j | \
    python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data['devices'].items():
    if 'iOS' in runtime:
        for d in devices:
            if d['name'] == '$device_name' and d['isAvailable']:
                print(d['udid'])
                sys.exit(0)
sys.exit(1)
" 2>/dev/null)
  echo "$udid"
}

capture_screen() {
  local udid="$1"
  local device_label="$2"   # "iphone" or "ipad"
  local filename="$3"
  local deep_link="$4"
  local wait_secs="$5"
  local description="$6"
  local out_dir="$OUTPUT_DIR/$device_label"

  mkdir -p "$out_dir"

  echo "  📸 Capturing: $description"

  # Navigate to the screen via deep link
  xcrun simctl openurl "$udid" "${SCHEME}://${deep_link}" 2>/dev/null || true
  sleep "$wait_secs"

  # Capture screenshot
  local filepath="$out_dir/${filename}.png"
  xcrun simctl io "$udid" screenshot "$filepath" --type=png 2>/dev/null
  echo "     ✅ Saved: $filepath"
}

# ─── Pre-flight Checks ───────────────────────────────────────

print_step "Pre-flight Checks"

# Check Xcode CLI tools
if ! command -v xcrun &> /dev/null; then
  echo "❌ Xcode command line tools not found. Install Xcode first."
  exit 1
fi
echo "  ✅ Xcode CLI tools found"

# Get device UDIDs
IPHONE_UDID=$(get_device_udid "$IPHONE_DEVICE")
IPAD_UDID=$(get_device_udid "$IPAD_DEVICE")

if [ -z "$IPHONE_UDID" ]; then
  echo "❌ Could not find simulator: $IPHONE_DEVICE"
  echo "   Available devices:"
  xcrun simctl list devices available | grep -E "iPhone|iPad"
  echo ""
  echo "   You may need to download the simulator runtime in Xcode:"
  echo "   Xcode → Settings → Platforms → iOS 18.x → Download"
  exit 1
fi
echo "  ✅ Found $IPHONE_DEVICE ($IPHONE_UDID)"

if [ -z "$IPAD_UDID" ]; then
  echo "⚠️  Could not find simulator: $IPAD_DEVICE"
  echo "   Will skip iPad screenshots. You can add the simulator later."
  SKIP_IPAD=true
else
  echo "  ✅ Found $IPAD_DEVICE ($IPAD_UDID)"
  SKIP_IPAD=false
fi

# ─── Create Output Directory ─────────────────────────────────

mkdir -p "$OUTPUT_DIR/iphone" "$OUTPUT_DIR/ipad"
echo "  ✅ Output directory: $OUTPUT_DIR"

# ─── Boot Simulators ─────────────────────────────────────────

print_step "Booting Simulators"

echo "  Booting $IPHONE_DEVICE..."
xcrun simctl boot "$IPHONE_UDID" 2>/dev/null || true
wait_for_boot "$IPHONE_DEVICE" "$IPHONE_UDID"

if [ "$SKIP_IPAD" = false ]; then
  echo "  Booting $IPAD_DEVICE..."
  xcrun simctl boot "$IPAD_UDID" 2>/dev/null || true
  wait_for_boot "$IPAD_DEVICE" "$IPAD_UDID"
fi

# Open Simulator.app so screens render properly
open -a Simulator

sleep 3

# ─── Important: Manual Step ──────────────────────────────────

print_step "⚠️  ACTION REQUIRED"
echo ""
echo "  Before continuing, make sure:"
echo "  1. Your Expo dev server is running (npx expo start)"
echo "  2. The app is installed on both simulators"
echo "     - If not, press 'i' in Expo to install on the active simulator"
echo "  3. You're logged in as the STUDENT account first (for screens 1-5)"
echo ""
echo "  The script will capture student screens first, then pause"
echo "  so you can switch to the PARENT account for screens 6-8."
echo ""
read -p "  Press ENTER when ready to start capturing student screens..."

# ─── Capture iPhone Screenshots ──────────────────────────────

print_step "Capturing iPhone Screenshots ($IPHONE_DEVICE)"

# Student screens (first 5)
for i in 0 1 2 3 4; do
  IFS='|' read -r filename deep_link wait_secs description <<< "${SCREENS[$i]}"
  capture_screen "$IPHONE_UDID" "iphone" "$filename" "$deep_link" "$wait_secs" "$description"
done

echo ""
echo "  ─── Student screens done! ───"
echo ""
echo "  Now switch to the PARENT account in the app."
echo "  (Log out → Log in as parent)"
echo ""
read -p "  Press ENTER when logged in as parent..."

# Parent screens (last 3)
for i in 5 6 7; do
  IFS='|' read -r filename deep_link wait_secs description <<< "${SCREENS[$i]}"
  capture_screen "$IPHONE_UDID" "iphone" "$filename" "$deep_link" "$wait_secs" "$description"
done

echo ""
echo "  ✅ iPhone screenshots complete!"

# ─── Capture iPad Screenshots ────────────────────────────────

if [ "$SKIP_IPAD" = false ]; then
  print_step "Capturing iPad Screenshots ($IPAD_DEVICE)"

  echo "  Make sure the app is installed on the iPad simulator"
  echo "  and you're logged in as the STUDENT account."
  echo ""
  read -p "  Press ENTER when ready..."

  # Student screens
  for i in 0 1 2 3 4; do
    IFS='|' read -r filename deep_link wait_secs description <<< "${SCREENS[$i]}"
    capture_screen "$IPAD_UDID" "ipad" "$filename" "$deep_link" "$wait_secs" "$description"
  done

  echo ""
  echo "  Switch to PARENT account on iPad simulator."
  read -p "  Press ENTER when ready..."

  # Parent screens
  for i in 5 6 7; do
    IFS='|' read -r filename deep_link wait_secs description <<< "${SCREENS[$i]}"
    capture_screen "$IPAD_UDID" "ipad" "$filename" "$deep_link" "$wait_secs" "$description"
  done

  echo ""
  echo "  ✅ iPad screenshots complete!"
fi

# ─── Summary ─────────────────────────────────────────────────

print_step "✅ Screenshot Capture Complete!"
echo ""
echo "  Screenshots saved to: $OUTPUT_DIR/"
echo ""
echo "  📱 iPhone screenshots:"
ls -1 "$OUTPUT_DIR/iphone/" 2>/dev/null | sed 's/^/     /'
echo ""

if [ "$SKIP_IPAD" = false ]; then
  echo "  📱 iPad screenshots:"
  ls -1 "$OUTPUT_DIR/ipad/" 2>/dev/null | sed 's/^/     /'
  echo ""
fi

echo "  Next steps:"
echo "  1. Review screenshots in $OUTPUT_DIR/"
echo "  2. Add device frames using screenshots.pro or AppMockUp"
echo "  3. Upload to App Store Connect"
echo ""
