# Native Behavior Deltas (Web → React Native)

This document defines **intentional behavior differences** between the web app and the React Native (Expo) app while preserving feature parity.

## Scope Notes
- These deltas describe **platform-driven implementation differences**, not product-scope reductions.
- Functional outcomes (auth, logging, history, sync, settings) must remain equivalent unless explicitly noted.

---

## 1) Navigation

**Web baseline**
- Route-based navigation via browser URLs and history (`/`, `/pick`, `/log/:exerciseId`, `/history/:exerciseId`, etc.).
- Header links/buttons and browser back behavior.

**Native delta**
- Use React Navigation with a tab + stack structure (e.g., Home, Settings tabs; stack pushes for picker/log/history/help).
- Use platform back affordances (Android hardware back, iOS swipe-back gesture) instead of browser back.
- Support deep-link scheme: `lifttracker://`.

**Parity requirement**
- Every web route destination must have a reachable native screen and equivalent back path.

---

## 2) Input handling

**Web baseline**
- Text/number/date inputs in browser forms.

**Native delta**
- Use numeric keyboard types for weight/reps (`decimal-pad`/`number-pad` as appropriate).
- Implement keyboard avoidance to prevent set rows / save CTA from being obscured.
- Add haptic feedback for high-confidence actions (e.g., set completion/save confirmation) where platform support exists.

**Parity requirement**
- Weight/reps correctness and save/edit behavior must match web data semantics (kg internal, unit-converted display).

---

## 3) Auth flow

**Web baseline**
- Supabase OAuth redirects through browser route `/auth/callback`.

**Native delta**
- Use in-app/system browser OAuth flow (Expo AuthSession or equivalent).
- Handle callback via deep link: `lifttracker://auth/callback`.
- Map callback handling to native auth state initialization equivalent to `AuthCallbackPage` + `AuthGate` behavior.

**Parity requirement**
- Google/Apple sign-in, session restoration, and sign-out outcomes must match web.

---

## 4) Lifecycle

**Web baseline**
- Uses document visibility (`visibilitychange`) and page runtime semantics.

**Native delta**
- Use `AppState` (`active`, `background`, `inactive`) lifecycle model.
- Trigger sync on app resume (`background/inactive` → `active`) to mirror web “visible again” behavior.

**Parity requirement**
- User returns to fresh-enough data after app resume, equivalent to web visibility-triggered sync intent.

---

## 5) Storage

**Web baseline**
- IndexedDB via Dexie for exercises, entries, settings, sync queue/state.

**Native delta**
- Use SQLite (`expo-sqlite`) as local persistence layer.
- Keep the same logical data model and record semantics (`exercises`, `entries`, `settings`, `syncQueue`, `syncState`).

**Parity requirement**
- Data integrity and migration/sync behavior must be model-compatible with web.

---

## 6) Connectivity

**Web baseline**
- Network and foreground checks via `navigator.onLine` + `visibilitychange`.

**Native delta**
- Use `@react-native-community/netinfo` (or Expo NetInfo equivalent) for connectivity status.
- Use `AppState` in place of `visibilitychange` for foreground-triggered sync.

**Parity requirement**
- Preserve online-triggered sync, resume-triggered sync, and periodic sync cadence.

---

## 7) Notifications

**Web baseline**
- No local mobile push/reminder concept in current parity baseline.

**Native delta**
- Optional workout reminders are a **mobile-only enhancement candidate for v2**.
- Do **not** include reminder notifications in v1 parity scope.

**Parity requirement**
- v1 acceptance must ignore notifications; parity is measured without this enhancement.

---

## 8) Platform-specific UI patterns

**Web baseline**
- Browser layout assumptions with fixed viewport behavior and desktop/mobile web controls.

**Native delta**
- Respect safe area insets on iOS/Android.
- Handle status bar style/spacing natively.
- Use pull-to-refresh for list refresh patterns where appropriate.
- Prefer swipe actions for destructive row operations (e.g., swipe-to-delete entry) when aligned with platform UX.

**Parity requirement**
- Interaction patterns may differ, but capabilities (edit/delete/history/logging/help/settings) must remain functionally equivalent.

---

## 9) Offline indicators

**Web baseline**
- Offline context is implicit; user can infer from browser/network context plus sync status.

**Native delta**
- Show a more prominent in-app offline badge/banner on mobile (no URL bar context).
- Keep sync status visibility in Settings (pending changes + last synced).

**Parity requirement**
- Users must clearly understand offline state and deferred-sync behavior while retaining offline-first logging.

---

## QA Mapping Reminder

When validating parity, test both:
1. **Feature outcome parity** (same user-result as web), and
2. **Native behavioral delta compliance** (mobile conventions above are applied correctly).
