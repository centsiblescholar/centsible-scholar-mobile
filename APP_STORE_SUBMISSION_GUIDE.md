# Centsible Scholar - App Store Submission Guide

This guide walks you through submitting your Expo app to the Apple App Store using EAS Build and EAS Submit.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [x] Apple Developer account ($99/year) - [developer.apple.com](https://developer.apple.com)
- [x] EAS CLI installed: `npm install -g eas-cli`
- [x] Logged into EAS: `eas login`
- [x] Expo account linked to project (already done - project ID in app.json)

---

## Step 1: Configure Apple Developer Account

### 1.1 Get Your Team ID
1. Go to [developer.apple.com/account](https://developer.apple.com/account)
2. Click "Membership details" in the sidebar
3. Copy your **Team ID** (10-character string)

### 1.2 Create App ID in Apple Developer Portal
1. Go to [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)
2. Click the **+** button to add a new identifier
3. Select "App IDs" → Continue
4. Select "App" → Continue
5. Fill in:
   - **Description**: Centsible Scholar
   - **Bundle ID**: Select "Explicit" and enter `com.centsiblescholar.app`
6. Enable any capabilities your app needs (Associated Domains is already configured)
7. Click Continue → Register

### 1.3 Create App in App Store Connect
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click "My Apps" → **+** → "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: Centsible Scholar
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Select `com.centsiblescholar.app`
   - **SKU**: `centsible-scholar-ios-001` (or your preference)
   - **User Access**: Full Access
4. Click **Create**
5. Note the **Apple ID** shown in the App Information page (numeric ID like `1234567890`)

### 1.4 Update eas.json with Your IDs
Open `eas.json` and replace the placeholder values:

```json
"ios": {
  "appleId": "rcisrael2@gmail.com",
  "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",  ← Replace with Apple ID from step 1.3
  "appleTeamId": "YOUR_APPLE_TEAM_ID"           ← Replace with Team ID from step 1.1
}
```

---

## Step 2: Prepare App Store Assets

### 2.1 Required Screenshots
You need screenshots for these device sizes:

| Device | Size | Required |
|--------|------|----------|
| iPhone 6.7" (Pro Max) | 1290 x 2796 | ✅ Required |
| iPhone 6.5" (Plus/Max) | 1284 x 2778 | ✅ Required |
| iPhone 5.5" (Plus) | 1242 x 2208 | ✅ Required |
| iPad Pro 12.9" | 2048 x 2732 | If supporting iPad |

**Tips:**
- Take screenshots in Simulator: `Cmd + S` while running
- Use [screenshots.pro](https://screenshots.pro) or [AppMockUp](https://app-mockup.com) for device frames
- Include 3-10 screenshots per device size
- Show key features: Dashboard, Grades, Behavior, Settings

### 2.2 App Icon
Your current icon (`assets/icon.png`) should be:
- **1024 x 1024 pixels** (required for App Store)
- PNG format, no transparency, no rounded corners

### 2.3 App Store Metadata
Prepare the following text:

**App Name** (30 chars max):
```
Centsible Scholar
```

**Subtitle** (30 chars max):
```
Reward Kids for Learning
```

**Promotional Text** (170 chars, can change anytime):
```
Help your children develop better study habits with real financial rewards. Track grades, monitor behavior, and watch them grow!
```

**Description** (4000 chars max):
```
Centsible Scholar transforms academic achievement into real rewards, helping parents motivate their children through a proven incentive system.

KEY FEATURES:

📊 Grade Tracking
- Log grades from all subjects and assignments
- Watch GPA progress over time
- Celebrate academic improvements

⭐ Behavior Monitoring
- Track daily behavior assessments
- Reward positive conduct
- Build consistent habits

💰 Smart Rewards
- Set custom reward amounts
- Automatic calculations based on performance
- Flexible allocation options

📱 Family Dashboard
- Parents can manage multiple children
- Real-time progress updates
- Easy-to-understand analytics

🎓 Financial Literacy
- Teach money management through rewards
- Build saving habits early
- Connect effort to earnings

Perfect for parents who want to:
- Motivate kids to do their best in school
- Create a structured reward system
- Teach financial responsibility
- Track academic progress easily

Join thousands of families using Centsible Scholar to make learning rewarding!
```

**Keywords** (100 chars, comma-separated):
```
education,grades,rewards,kids,allowance,GPA,tracking,behavior,parenting,school,motivation,learning
```

**Support URL**:
```
https://centsiblescholar.com/help
```

**Privacy Policy URL**:
```
https://centsiblescholar.com/privacy
```

**Category**: Education

**Age Rating**: 4+ (no objectionable content)

---

## Step 3: Build for App Store

### 3.1 Build the Production App
Run this command from your project directory:

```bash
eas build --platform ios --profile production
```

This will:
- Create a production build in the cloud
- Handle code signing automatically
- Generate an `.ipa` file for App Store submission

**First time setup:**
- You'll be prompted to log into your Apple Developer account
- EAS will create necessary certificates and provisioning profiles
- This may take 15-30 minutes

### 3.2 Monitor Build Progress
- Check status at [expo.dev](https://expo.dev) → Your project → Builds
- You'll get an email when the build completes

---

## Step 4: Submit to App Store

### 4.1 Submit Using EAS
Once your build completes:

```bash
eas submit --platform ios --latest
```

Or submit a specific build:

```bash
eas submit --platform ios --id <build-id>
```

### 4.2 Complete App Store Connect Setup
After submission, go to [App Store Connect](https://appstoreconnect.apple.com):

1. **App Information**
   - Category: Education
   - Age Rating: Complete the questionnaire (likely 4+)
   - License Agreement: Use Apple's standard EULA or your custom one

2. **Pricing and Availability**
   - Price: Free (since subscriptions are via web)
   - Availability: Select countries

3. **App Privacy**
   - Data Collection: Complete the privacy questionnaire
   - Your app collects: Name, Email, Grades (Education data)
   - Data linked to user: Yes (for personalization)
   - Data used for tracking: No

4. **Version Information**
   - Add screenshots for all required sizes
   - Enter description, keywords, support URL
   - What's new: "Initial release"

5. **Build Selection**
   - Select your uploaded build

6. **Submit for Review**
   - Click "Add for Review"
   - Answer any export compliance questions (select "No" - already configured in app.json)
   - Submit!

---

## Step 5: App Review Preparation

### 5.1 Demo Account (REQUIRED)
Apple reviewers need to test your app. Create a demo account:

1. Create a test user at centsiblescholar.com with:
   - Email: `appreview@centsiblescholar.com` (or similar)
   - Password: Something simple like `AppReview2024!`
   - Pre-populate with sample data (grades, behavior records)

2. In App Store Connect → App Review Information:
   - Sign-in required: Yes
   - Username: `appreview@centsiblescholar.com`
   - Password: `AppReview2024!`

### 5.2 Review Notes
Add notes explaining your app to reviewers:

```
Centsible Scholar is a companion app for parents and students using our web platform (centsiblescholar.com).

Users create accounts and manage subscriptions on our website. This app allows existing users to:
- View and track grades
- Monitor behavior assessments
- Check reward calculations
- Manage account settings

Demo account credentials are provided above. The demo account has sample grade and behavior data pre-populated for testing.

For subscription management, users are directed to our website where Stripe handles payments.
```

### 5.3 Common Rejection Reasons to Avoid
✅ **Already handled:**
- Account deletion option (added to Settings)
- Privacy policy link (in Settings)
- Terms of service link (added to Settings)
- No unused permission requests

⚠️ **Things to ensure:**
- Demo account works and has data
- All links work (privacy, terms, help, subscription management)
- Web-based account deletion page exists at `centsiblescholar.com/settings/delete-account`

---

## Step 6: After Submission

### Timeline
- **Review time**: Typically 24-48 hours (can be up to 7 days)
- **Status updates**: Check App Store Connect or wait for email

### If Rejected
1. Read rejection reason carefully
2. Common issues:
   - Missing demo account credentials
   - Broken links
   - Missing privacy information
   - Crashes during review
3. Fix issues and resubmit

### After Approval
1. Set release date or release immediately
2. Monitor crash reports in App Store Connect
3. Respond to user reviews
4. Plan your update cycle

---

## Quick Reference Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo/EAS
eas login

# Build for iOS production
eas build --platform ios --profile production

# Submit latest build to App Store
eas submit --platform ios --latest

# Build and submit in one command
eas build --platform ios --profile production --auto-submit

# Check build status
eas build:list

# View logs for a build
eas build:view <build-id>
```

---

## Website Requirements

Ensure these pages exist on centsiblescholar.com:

| Page | URL | Status |
|------|-----|--------|
| Privacy Policy | `/privacy` | ✅ Linked in app |
| Terms of Service | `/terms` | ✅ Linked in app |
| Help Center | `/help` | ✅ Linked in app |
| Account Settings | `/settings` | ✅ Linked in app |
| Delete Account | `/settings/delete-account` | ⚠️ **Must create** |

The delete account page should:
- Require user authentication
- Explain what data will be deleted
- Have a confirmation step
- Actually delete the account and all associated data

---

## Support

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **EAS Build**: [docs.expo.dev/build](https://docs.expo.dev/build/introduction/)
- **EAS Submit**: [docs.expo.dev/submit](https://docs.expo.dev/submit/introduction/)
- **App Store Review Guidelines**: [developer.apple.com/app-store/review/guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

*Last updated: January 2026*
