# Google Play Store Assets

This folder contains assets required for Google Play Store submission.

## Required Assets

### Graphics (`graphics/`)

| File | Size | Format | Description |
|------|------|--------|-------------|
| `icon-512.png` | 512 x 512 | PNG (32-bit) | Hi-res app icon for Play Store |
| `feature-graphic.png` | 1024 x 500 | PNG/JPEG | Appears at top of store listing |

### Screenshots (`screenshots/`)

#### Phone Screenshots (`screenshots/phone/`)
- Minimum size: 1080 x 1920 pixels
- Required: 2-8 screenshots
- Recommended naming: `01-dashboard.png`, `02-grades.png`, etc.

Suggested screenshots:
1. `01-dashboard.png` - Main dashboard view
2. `02-grades.png` - Grade tracking/entry
3. `03-behavior.png` - Behavior assessment
4. `04-rewards.png` - Rewards/allocations view
5. `05-qotd.png` - Question of the Day
6. `06-settings.png` - Settings/profile

#### Tablet Screenshots (`screenshots/tablet/`)
- 7" tablet: 1080 x 1920 minimum
- 10" tablet: 1920 x 1200 minimum
- Optional but recommended

## Creating Assets

### Generate Icon from Existing
```bash
# Using ImageMagick
convert ../assets/icon.png -resize 512x512 graphics/icon-512.png

# Using macOS sips
sips -z 512 512 ../assets/icon.png --out graphics/icon-512.png
```

### Taking Screenshots
1. Run app in Android emulator or device
2. Navigate to each screen
3. Capture: `adb exec-out screencap -p > screenshot.png`
4. Or use emulator's camera button

### Feature Graphic Tips
- Include app name prominently
- Show key app imagery
- Avoid text in top/bottom 10% (may be cropped)
- Use brand colors (#4F46E5)

## Asset Checklist

- [ ] `graphics/icon-512.png` - 512x512 app icon
- [ ] `graphics/feature-graphic.png` - 1024x500 feature graphic
- [ ] `screenshots/phone/01-dashboard.png`
- [ ] `screenshots/phone/02-grades.png`
- [ ] `screenshots/phone/03-behavior.png`
- [ ] `screenshots/phone/04-rewards.png`
- [ ] At least 2 phone screenshots total (minimum requirement)

## Tools for Creating Graphics

- [Figma](https://figma.com) - Free design tool
- [Canva](https://canva.com) - Easy graphic creation
- [AppMockUp](https://app-mockup.com) - Device frame mockups
- [screenshots.pro](https://screenshots.pro) - Screenshot beautification
