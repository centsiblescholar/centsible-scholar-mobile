# Technology Stack

**Analysis Date:** 2026-02-05

## Languages

**Primary:**
- TypeScript 5.9.2 - All source code in `src/`, `app/` directories

**Secondary:**
- JavaScript - Node.js environment, build configuration

## Runtime

**Environment:**
- Expo 54.0.25 - Cross-platform mobile runtime (iOS, Android, Web)
- React Native 0.81.5 - Mobile framework
- Node.js - Development and build

**Package Manager:**
- npm 10+ (inferred from package-lock.json pattern)
- Lockfile: Present (package-lock.json)
- Config: `.npmrc` with `legacy-peer-deps=true` for dependency resolution

## Frameworks

**Core:**
- React 19.1.0 - UI framework
- Expo Router 6.0.15 - File-based routing (app directory pattern)
- React Native - Mobile UI components

**State Management:**
- TanStack React Query 5.90.11 - Server state management for Supabase queries
- Zustand 5.0.9 - Client state management
- React Context - Auth state via `src/contexts/AuthContext.tsx`

**Forms & Validation:**
- React Hook Form 7.67.0 - Form state management
- @hookform/resolvers 5.2.2 - Validation schema integration
- Zod 4.1.13 - TypeScript-first schema validation

**Navigation:**
- Expo Router 6.0.15 - Type-safe navigation with file-based routing
- expo-linking 8.0.9 - Deep linking support

**UI & Visualization:**
- React Native built-in components
- React Native Chart Kit 6.12.0 - Data visualization (earnings, analytics)
- React Native SVG 15.15.1 - SVG rendering
- @expo/vector-icons 15.0.3 - Icon library

**Animations & Interactions:**
- React Native Reanimated 4.1.1 - Performance-optimized animations
- React Native Gesture Handler 2.28.0 - Gesture recognition
- React Native Worklets 0.5.0 - Low-level animation control

**Notifications:**
- expo-notifications 0.32.16 - Push and local notifications

**Device & Platform:**
- expo-device 8.0.10 - Device information (physical device detection)
- expo-constants 18.0.13 - App configuration and constants
- expo-status-bar 3.0.8 - Status bar management
- React Native Safe Area Context 5.6.0 - Safe area layout handling
- React Native Screens 4.16.0 - Native screen containers

**Storage:**
- @react-native-async-storage/async-storage 2.2.0 - Local persistent storage

**Utilities:**
- date-fns 4.1.0 - Date manipulation and formatting
- react-native-url-polyfill 3.0.0 - URL API polyfill for React Native

## Testing & Development

**Build/Dev:**
- Babel 54.0.10 - JavaScript transpilation
- TypeScript 5.9.2 - Type checking and compilation

**Configuration:**
- tsconfig.json - Strict mode enabled, path aliases configured
- app.json - Expo configuration (EAS, plugins, platforms)
- babel.config.js - Babel preset configuration

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.86.0 - Supabase client SDK (database, auth, edge functions)

**Infrastructure:**
- react-native-reanimated 4.1.1 - Required for gesture handler performance
- react-native-safe-area-context 5.6.0 - Required for multi-platform layout safety
- expo-router 6.0.15 - Core routing (file-based to app.json entrypoint)

## Configuration

**Environment:**
- `.env` file (local, not committed)
- Environment variables:
  - `EXPO_PUBLIC_SUPABASE_URL` - Supabase project endpoint
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key for public queries

**Build Configuration:**
- `app.json` - Expo app metadata, build settings, plugins
  - `expo.owner`: "robertcentsiblescholar"
  - `expo.slug`: "centsible-scholar"
  - `expo.runtimeVersion.policy`: "appVersion"
  - `expo.newArchEnabled`: true (React Native New Architecture)
  - iOS bundle ID: "com.centsiblescholar.app"
  - Android package: "com.centsiblescholar.app"
  - EAS project ID: "4cef17e0-0133-41ca-952d-78ecc20791a3"

**Plugins:**
- expo-router - Enables file-based routing
- expo-notifications - Enables notification support with custom channels

**TypeScript Configuration:**
- Strict mode enabled
- Path aliases:
  - `@/*` → `src/*`
  - `@/shared/*` → `src/shared/*`

## Platform Requirements

**Development:**
- macOS (for iOS development)
- Xcode 15+ (iOS builds)
- Android SDK (Android builds)
- Node.js 18+
- Expo CLI (`npx expo`)
- EAS CLI (`eas`) for cloud builds (optional)

**Production:**
- iOS 13+ (based on Expo 54 requirements)
- Android 5.0+ (API 21+)
- Deployment: EAS (Expo Application Services) for builds and distribution
- Runs in Expo Go app (development) or native builds via EAS

---

*Stack analysis: 2026-02-05*
