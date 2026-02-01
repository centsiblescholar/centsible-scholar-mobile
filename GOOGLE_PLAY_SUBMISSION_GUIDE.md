# Centsible Scholar - Google Play Store Submission Guide

This guide walks you through submitting your Expo app to the Google Play Store using EAS Build and EAS Submit.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Google Play Developer account ($25 one-time fee) - [play.google.com/console](https://play.google.com/console)
- [x] EAS CLI installed: `npm install -g eas-cli`
- [x] Logged into EAS: `eas login`
- [x] Expo account linked to project (project ID: `4cef17e0-0133-41ca-952d-78ecc20791a3`)
- [x] Android package configured: `com.centsiblescholar.app`

---

## Step 1: Set Up Google Play Console

### 1.1 Create Developer Account
1. Go to [play.google.com/console](https://play.google.com/console)
2. Pay the one-time $25 registration fee
3. Complete identity verification (may take 24-48 hours)
4. Accept the Developer Distribution Agreement

### 1.2 Create Your App in Play Console
1. Click **Create app**
2. Fill in:
   - **App name**: Centsible Scholar
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
3. Accept declarations and click **Create app**

### 1.3 Complete Store Listing Setup
Navigate through the required sections in the left sidebar:

#### App Access
- Select: **All functionality is available without special access**
  - OR if login required: **All or some functionality is restricted** and provide test credentials

#### Ads
- Select: **No, my app does not contain ads**

#### Content Rating
1. Start the questionnaire
2. Answer honestly (likely "Family/Education" category)
3. For Centsible Scholar, select:
   - No violence
   - No sexual content
   - No gambling
   - No controlled substances
4. Complete and apply the rating

#### Target Audience
- Select: **13 and over** (due to financial data handling)
- If targeting under 13, additional requirements apply

#### News Apps
- Select: **My app is not a news app**

#### COVID-19 Apps
- Select: **My app is not a COVID-19 contact tracing or status app**

#### Data Safety
Complete the data safety form:

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Name | Yes | No | Account personalization |
| Email | Yes | No | Account management |
| User IDs | Yes | No | App functionality |
| App interactions | Yes | No | Analytics, app functionality |
| Crash logs | Yes | No | Bug fixing |

Security practices:
- Data is encrypted in transit: **Yes**
- Data can be deleted: **Yes** (provide instructions)

#### Government Apps
- Select: **This is not a government app**

---

## Step 2: Create Google Service Account for EAS Submit

This allows automated submission from EAS to Google Play.

### 2.1 Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the **Google Play Android Developer API**:
   - Go to APIs & Services → Library
   - Search "Google Play Android Developer API"
   - Click Enable

### 2.2 Create Service Account Credentials
1. Go to APIs & Services → Credentials
2. Click **Create Credentials** → **Service Account**
3. Fill in:
   - Service account name: `eas-submit`
   - Service account ID: `eas-submit`
4. Click **Create and Continue**
5. Skip role assignment (not needed)
6. Click **Done**

### 2.3 Generate JSON Key
1. Click on the newly created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Download the key file
6. **IMPORTANT**: Rename and save as `google-service-account.json` in your project root
7. **Add to .gitignore** to prevent committing secrets:
   ```
   google-service-account.json
   ```

### 2.4 Link Service Account to Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to **Users and permissions** → **Invite new users**
3. Enter the service account email (found in the JSON file, looks like `eas-submit@project.iam.gserviceaccount.com`)
4. Set permissions:
   - **Admin (all permissions)** OR at minimum:
   - App access: Select your app
   - Permissions: Releases → Create, edit, and roll out releases
5. Click **Invite user**
6. Wait for invite to process (usually instant)

---

## Step 3: Update EAS Configuration

Your `eas.json` is already configured. Verify the Android submit section:

```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./google-service-account.json",
      "track": "internal"
    }
  }
}
```

**Track options:**
- `internal` - Internal testing (up to 100 testers, instant)
- `alpha` - Closed testing
- `beta` - Open testing
- `production` - Full release

**Recommended flow:** `internal` → `alpha/beta` → `production`

---

## Step 4: Prepare Store Assets

### 4.1 Required Graphics

Store your assets in `store-assets/google-play/`:

| Asset | Size | Format | Required |
|-------|------|--------|----------|
| App icon | 512 x 512 | PNG (32-bit) | Yes |
| Feature graphic | 1024 x 500 | PNG/JPEG | Yes |
| Phone screenshots | 1080 x 1920 (min) | PNG/JPEG | Yes (2-8) |
| 7" tablet screenshots | 1080 x 1920 (min) | PNG/JPEG | Recommended |
| 10" tablet screenshots | 1920 x 1200 (min) | PNG/JPEG | Recommended |

### 4.2 App Icon
Your current icon needs a 512x512 version:
- Must be PNG with 32-bit color
- No transparency on Play Store icon
- No rounded corners (Play Store applies its own)

**Create from existing:**
```bash
# If you have ImageMagick installed:
convert assets/icon.png -resize 512x512 store-assets/google-play/graphics/icon-512.png
```

### 4.3 Feature Graphic
The feature graphic appears at the top of your store listing:
- Size: 1024 x 500 pixels
- Should include app name and key visual
- No text in the top/bottom 10% (may be cropped)

### 4.4 Screenshots
Recommended screenshots (in order):
1. **Dashboard** - Main app overview
2. **Grade Tracking** - Grade entry/history
3. **Behavior Assessment** - Daily scoring
4. **Rewards** - Financial allocations
5. **Question of the Day** - Financial literacy
6. **Settings** - Account management

**Screenshot tips:**
- Use a clean device with full battery icon
- Hide status bar elements or use clean mock data
- Consider using device frames with [AppMockUp](https://app-mockup.com) or [screenshots.pro](https://screenshots.pro)

---

## Step 5: Store Listing Content

### 5.1 Basic Information

**App name** (50 chars max):
```
Centsible Scholar
```

**Short description** (80 chars max):
```
Help your kids build better study habits with real financial rewards for learning
```

**Full description** (4000 chars max):
```
Centsible Scholar transforms academic achievement into real rewards, helping parents motivate their children through a proven incentive system.

KEY FEATURES:

Grade Tracking
- Log grades from all subjects and assignments
- Watch GPA progress over time
- Celebrate academic improvements

Behavior Monitoring
- Track daily behavior assessments
- Reward positive conduct
- Build consistent habits

Smart Rewards
- Set custom reward amounts
- Automatic calculations based on performance
- Flexible allocation options

Family Dashboard
- Parents can manage multiple children
- Real-time progress updates
- Easy-to-understand analytics

Financial Literacy
- Daily financial education questions
- Teach money management through rewards
- Build saving habits early
- Connect effort to earnings

Perfect for parents who want to:
- Motivate kids to do their best in school
- Create a structured reward system
- Teach financial responsibility
- Track academic progress easily

HOW IT WORKS:
1. Create your account at centsiblescholar.com
2. Add your children's profiles
3. Track grades and behavior
4. Watch rewards calculate automatically
5. Teach valuable financial lessons

Join thousands of families using Centsible Scholar to make learning rewarding!

SUBSCRIPTION:
Centsible Scholar is free to download. Premium features require a subscription managed through our website.
- Standard Plan: $9.99/month (1 student)
- Premium Plan: $12.99/month (3 students + family dashboard)
- 60-day free trial for new users

Questions? Visit centsiblescholar.com/help or email support@centsiblescholar.com
```

### 5.2 Categorization

**Category**: Education
**Tags**: education, grades, rewards, kids, allowance, GPA tracking, behavior, parenting, school, motivation

### 5.3 Contact Details

**Email**: support@centsiblescholar.com
**Website**: https://centsiblescholar.com
**Privacy Policy**: https://centsiblescholar.com/privacy

---

## Step 6: Build for Google Play

### 6.1 Build Production AAB
Google Play requires Android App Bundle (AAB) format:

```bash
eas build --platform android --profile production
```

This will:
- Create a production build in EAS cloud
- Generate signing credentials (first time)
- Produce an `.aab` file for Play Store

**Build time:** Usually 10-20 minutes

### 6.2 Monitor Build
- Check status: `eas build:list`
- View in browser: [expo.dev](https://expo.dev) → Your project → Builds
- You'll receive an email when complete

### 6.3 Download Build (Optional)
If you need to manually upload:
```bash
eas build:list --platform android --status finished
# Copy the build URL and download
```

---

## Step 7: Submit to Google Play

### 7.1 Automated Submission (Recommended)
Once your build completes:

```bash
eas submit --platform android --latest
```

Or submit a specific build:
```bash
eas submit --platform android --id <build-id>
```

### 7.2 Manual Submission (Alternative)
1. Download the `.aab` file from EAS
2. Go to Google Play Console → Your app
3. Navigate to **Release** → **Production** (or testing track)
4. Click **Create new release**
5. Upload the `.aab` file
6. Add release notes
7. Review and roll out

### 7.3 First Release to Internal Testing
For initial testing:
1. Go to **Testing** → **Internal testing**
2. Create a release
3. Upload AAB or use EAS submit with `"track": "internal"`
4. Add testers by email
5. Roll out

---

## Step 8: Release Checklist

### Pre-Submission
- [ ] App icon (512x512) uploaded
- [ ] Feature graphic (1024x500) uploaded
- [ ] At least 2 phone screenshots uploaded
- [ ] Short description completed
- [ ] Full description completed
- [ ] Privacy policy URL valid and accessible
- [ ] Content rating completed
- [ ] Data safety form completed
- [ ] Target audience defined
- [ ] Contact email verified

### App Configuration
- [ ] `google-service-account.json` in project root
- [ ] Service account linked in Play Console
- [ ] `eas.json` configured for Android submit
- [ ] Production build completed successfully

### Testing
- [ ] Internal testing release successful
- [ ] Test accounts work properly
- [ ] All links functional (privacy, terms, help)
- [ ] Crash-free on target devices

---

## Step 9: Review Process

### Timeline
- **Internal/Closed testing**: Usually instant
- **Open testing**: 1-3 days review
- **Production**: 1-7 days review (first release may take longer)

### Common Rejection Reasons

**Policy violations to avoid:**
1. **Misleading claims** - Don't promise unrealistic results
2. **Privacy issues** - Ensure data collection is disclosed
3. **Payment issues** - Clearly state subscription is via website
4. **Broken functionality** - Test thoroughly before submission
5. **Inappropriate content** - Keep age-appropriate

**Technical issues:**
1. Crashes on launch
2. Missing privacy policy
3. Non-functional features
4. Poor performance

### If Rejected
1. Read rejection email carefully
2. Fix identified issues
3. Resubmit with detailed notes explaining fixes
4. Consider reaching out to developer support if unclear

---

## Step 10: Post-Release

### Monitor Performance
- **Android Vitals**: Watch crash rates, ANRs
- **User Reviews**: Respond promptly
- **Ratings**: Address negative feedback

### Update Cycle
```bash
# Bump version in app.json
# Build new release
eas build --platform android --profile production

# Submit update
eas submit --platform android --latest
```

Version auto-incrementing is enabled in `eas.json`.

---

## Quick Reference Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo/EAS
eas login

# Build for Android production
eas build --platform android --profile production

# Submit to Google Play (internal track)
eas submit --platform android --latest

# Build and submit in one command
eas build --platform android --profile production --auto-submit

# Check build status
eas build:list --platform android

# View specific build
eas build:view <build-id>

# Build APK for testing (not for Play Store)
eas build --platform android --profile preview
```

---

## Folder Structure

```
centsible-scholar-mobile/
├── store-assets/
│   └── google-play/
│       ├── screenshots/
│       │   ├── phone/
│       │   │   ├── 01-dashboard.png
│       │   │   ├── 02-grades.png
│       │   │   ├── 03-behavior.png
│       │   │   └── ...
│       │   └── tablet/
│       │       └── ...
│       └── graphics/
│           ├── icon-512.png
│           └── feature-graphic.png
├── google-service-account.json (DO NOT COMMIT)
├── eas.json
└── app.json
```

---

## Website Requirements

Ensure these pages exist on centsiblescholar.com:

| Page | URL | Status |
|------|-----|--------|
| Privacy Policy | `/privacy` | Required |
| Terms of Service | `/terms` | Required |
| Help Center | `/help` | Required |
| Account Deletion | `/settings/delete-account` | Required (GDPR/Play Policy) |

**Account Deletion Requirements (Google Play Policy):**
- Users must be able to request account deletion
- Must delete associated data within reasonable time
- Can be a web page or in-app option
- Must be accessible without app access

---

## Troubleshooting

### Service Account Issues
```
Error: Unable to authenticate
```
- Verify JSON key file path in `eas.json`
- Check service account has proper permissions in Play Console
- Ensure Google Play Android Developer API is enabled

### Build Failures
```
Error: Build failed
```
- Check EAS build logs for specific error
- Verify `app.json` Android configuration
- Ensure all dependencies are compatible

### Upload Errors
```
Error: APK or AAB must be signed
```
- EAS handles signing automatically
- If manual upload, use the exact AAB from EAS build

---

## Support Resources

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **EAS Build**: [docs.expo.dev/build](https://docs.expo.dev/build/introduction/)
- **EAS Submit**: [docs.expo.dev/submit](https://docs.expo.dev/submit/introduction/)
- **Google Play Console Help**: [support.google.com/googleplay/android-developer](https://support.google.com/googleplay/android-developer)
- **Play Console Policy Center**: [play.google.com/console/policy](https://play.google.com/console/about/policy/)

---

*Last updated: January 2026*
