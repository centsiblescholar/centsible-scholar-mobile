# App Store (iOS) Assets

This folder contains assets required for Apple App Store submission.

## Required Assets

### Graphics (`graphics/`)

| File | Size | Format | Description |
|------|------|--------|-------------|
| `icon-1024.png` | 1024 x 1024 | PNG | Hi-res app icon for App Store |

**Icon requirements:**
- No transparency
- No rounded corners (Apple applies automatically)
- PNG format

### Screenshots (`screenshots/`)

| Device | Size | Required |
|--------|------|----------|
| iPhone 6.7" (Pro Max) | 1290 x 2796 | Yes |
| iPhone 6.5" (Plus/Max) | 1284 x 2778 | Yes |
| iPhone 5.5" (Plus) | 1242 x 2208 | Yes |
| iPad Pro 12.9" | 2048 x 2732 | If supporting iPad |

Suggested screenshots:
1. `01-dashboard.png` - Main dashboard view
2. `02-grades.png` - Grade tracking/entry
3. `03-behavior.png` - Behavior assessment
4. `04-rewards.png` - Rewards/allocations view
5. `05-qotd.png` - Question of the Day
6. `06-settings.png` - Settings/profile

**Organize by device size:**
```
screenshots/
├── iphone-6.7/
│   ├── 01-dashboard.png
│   ├── 02-grades.png
│   └── ...
├── iphone-6.5/
│   └── ...
├── iphone-5.5/
│   └── ...
└── ipad-12.9/
    └── ...
```

## Taking Screenshots

### Using Simulator
1. Run app in iOS Simulator
2. Select appropriate device (iPhone 15 Pro Max for 6.7")
3. Navigate to screen
4. Press `Cmd + S` to save screenshot

### Device Sizes to Simulator Mapping
- **6.7"**: iPhone 15 Pro Max, iPhone 14 Pro Max
- **6.5"**: iPhone 14 Plus, iPhone 13 Pro Max
- **5.5"**: iPhone 8 Plus (older, but still required)
- **12.9"**: iPad Pro 12.9" (any generation)

## Asset Checklist

- [ ] `graphics/icon-1024.png` - 1024x1024 app icon
- [ ] `screenshots/iphone-6.7/` - At least 3 screenshots
- [ ] `screenshots/iphone-6.5/` - At least 3 screenshots
- [ ] `screenshots/iphone-5.5/` - At least 3 screenshots
- [ ] `screenshots/ipad-12.9/` - At least 3 screenshots (if iPad supported)

## Tools

- [AppMockUp](https://app-mockup.com) - Device frame mockups
- [screenshots.pro](https://screenshots.pro) - Screenshot beautification
- [LaunchKit](https://launchkit.io) - Screenshot builder
