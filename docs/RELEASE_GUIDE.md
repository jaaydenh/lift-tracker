# Mobile Release Guide (EAS)

This guide documents the iOS-first release flow for Lift Tracker, followed by Android.

## Prerequisites

- Expo account with access to the Lift Tracker project.
- Apple Developer Program membership and App Store Connect access.
- Google Play Console access for the target app.
- `EAS_ACCESS_TOKEN` available for CI/manual GitHub Action runs.
- Run CLI commands from the repo root unless stated otherwise.

> This repo does not require a global EAS install. Use `bunx eas ...` locally.

## Initial project setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Confirm Expo account context:

   ```bash
   bunx eas whoami
   ```

3. If `apps/mobile/app.json` does not contain an `expo.owner`, set it to the correct Expo account/org before the first production build.

## Environment setup

Create `apps/mobile/.env` from the example file:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Set:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

If you use EAS managed environment variables, mirror the same values in Expo/EAS for each environment profile.

## iOS release flow (first)

### Build production artifact

```bash
cd apps/mobile
bunx eas build --platform ios --profile production
```

### Submit to App Store Connect

```bash
cd apps/mobile
bunx eas submit --platform ios
```

## Android release flow (after iOS)

### Build production artifact

```bash
cd apps/mobile
bunx eas build --platform android --profile production
```

### Submit to Google Play

```bash
cd apps/mobile
bunx eas submit --platform android
```

## CI/manual preview build

GitHub Actions workflow: `.github/workflows/mobile-ci.yml`

- Push/PR changes to mobile/shared packages run `typecheck`, `test`, and `lint` jobs.
- iOS preview EAS build is manual only via `workflow_dispatch` (`eas-build` job).

## Pre-submission checklist

- [ ] Replace iOS submit placeholders in `apps/mobile/eas.json`:
  - `APP_STORE_CONNECT_APP_ID`
  - `APPLE_TEAM_ID`
- [ ] Provide Android service account key at `apps/mobile/google-services-key.json` (or update `serviceAccountKeyPath`).
- [ ] Confirm `com.lifttracker.app` identifiers are correct for both iOS and Android stores.
- [ ] Replace placeholder adaptive icon asset (`apps/mobile/assets/adaptive-icon.png`) with final branded artwork.
- [ ] Verify Supabase public env vars are set for the target environment.
- [ ] Run validation commands:
  - `bun run --filter @lift-tracker/mobile tsc`
  - `bun run test`
  - `bun run --filter @lift-tracker/web lint`
  - `bun run --filter @lift-tracker/web build`

## Versioning strategy

- `expo.version` (`apps/mobile/app.json`) is the user-facing app version.
- iOS `buildNumber` must increase for each App Store Connect upload.
- Android `versionCode` must increase for each Play Console upload.
- `apps/mobile/eas.json` uses `build.production.autoIncrement: true` so EAS increments native build numbers on production builds.

## Placeholder values to replace before first store submission

In `apps/mobile/eas.json`:

- `submit.production.ios.ascAppId`
- `submit.production.ios.appleTeamId`
- `submit.production.android.serviceAccountKeyPath` (if different from default)
