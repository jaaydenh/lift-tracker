# Mobile Feature Parity Matrix

This matrix is the implementation and QA reference for achieving **exact feature parity** between the current web app and the React Native (Expo) app.

**Legend**
- **Status:** `Planned` indicates the feature is required for mobile parity and not yet implemented.

## 1) Onboarding (first launch flow)

| Web Feature | Web Route/Component | Mobile Screen | Mobile Navigation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| First-launch onboarding gate | `OnboardingPage` + settings `hasCompletedOnboarding` | `OnboardingScreen` | Auth/Onboarding stack (initial route) | Planned | Show onboarding only when first-time user flag is false. |
| Primary unit selection (kg/lbs) | `OnboardingPage` | `OnboardingScreen` | Auth/Onboarding stack | Planned | Persist to user settings and apply across app displays. |
| Age bracket selection (young/middle/older) | `OnboardingPage` | `OnboardingScreen` | Auth/Onboarding stack | Planned | Drives detraining thresholds and dashboard urgency grouping. |
| Barbell weight setup | `OnboardingPage` + `SettingsPage` defaults | `OnboardingScreen` | Auth/Onboarding stack | Planned | Capture default barbell weight during onboarding for parity with web setup flow expectations. |
| Complete onboarding and continue to app | `OnboardingPage` (`Start Tracking`) | `OnboardingScreen` | Transition to main app navigator | Planned | Set onboarding completion flag and route to Home. |

## 2) Authentication (sign-in, callback, session)

| Web Feature | Web Route/Component | Mobile Screen | Mobile Navigation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Google sign-in option | `SignInPage` + `useAuthStore.signInWithGoogle` | `SignInScreen` | Auth stack | Planned | Must match Supabase OAuth provider behavior. |
| Apple sign-in option | `SignInPage` + `useAuthStore.signInWithApple` | `SignInScreen` | Auth stack | Planned | Apple sign-in required where platform allows. |
| OAuth callback handling | `/auth/callback` → `AuthCallbackPage` | `AuthCallbackScreen` | Deep-link route in auth stack | Planned | Native callback handled through deep link (see deltas doc). |
| Auth loading/error states | `AuthGate`, `SignInPage`, `AuthCallbackPage` | `AuthLoadingScreen`, inline auth error UI | Auth stack | Planned | Preserve visible loading and error recovery flows. |
| Session persistence on app relaunch | `useAuthStore.initialize` + Supabase session | App bootstrap/auth state | Root app initialization | Planned | Signed-in users should bypass sign-in screen when session is valid. |
| Sign out | `SettingsPage` + `useAuthStore.signOut` | `SettingsScreen` | Settings tab/stack | Planned | Clear session and return to sign-in flow. |

## 3) Dashboard/Home (exercise list, detraining indicators, quick actions)

| Web Feature | Web Route/Component | Mobile Screen | Mobile Navigation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Home dashboard landing screen | `/` → `HomePage` | `HomeScreen` | Main tab (Home) | Planned | Primary daily-use dashboard. |
| “Log Exercise” quick action CTA | `HomePage` (`/pick` link) | `HomeScreen` action button | Home → Exercise Picker stack push | Planned | Fast path to start logging. |
| Train Soon section | `HomePage` | `HomeScreen` | Main tab (Home) | Planned | Group exercises above freshness threshold. |
| Recently Trained section | `HomePage` | `HomeScreen` | Main tab (Home) | Planned | Group exercises at/below freshness threshold. |
| Detraining status indicator per exercise | `ExerciseCard` + `DetrainingBar` | `ExerciseCard` (RN) | Home list item | Planned | Keep phase visibility and urgency cues. |
| Exercise card summary (best set + time since + 1RM snapshot) | `ExerciseCard` | `ExerciseCard` (RN) | Home list item | Planned | Include dual-unit summary and rolling best estimate. |
| Quick access to Help and Settings | `HomePage` header icons | `HomeScreen` header actions | Home → Help / Settings | Planned | Preserve one-tap access from dashboard. |
| First-use empty state prompt | `HomePage` (no entries state) | `HomeScreen` empty state | Main tab (Home) | Planned | Prompt user to log first exercise. |

## 4) Exercise Picker (category browse, search, custom creation)

| Web Feature | Web Route/Component | Mobile Screen | Mobile Navigation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Exercise picker screen | `/pick` → `ExercisePickerPage` | `ExercisePickerScreen` | Home stack push | Planned | Core selection workflow before logging. |
| Search exercises by name | `ExercisePickerPage` search input | `ExercisePickerScreen` search | Home stack | Planned | Real-time filtering should match web behavior. |
| Browse categorized exercise library | `ExercisePickerPage` category lists | `ExercisePickerScreen` category sections | Home stack | Planned | Categories: barbell, dumbbell, bodyweight, machine, cable, other. |
| Expand/collapse category sections | `ExercisePickerPage` | `ExercisePickerScreen` | Home stack | Planned | Maintain discoverability and reduced scroll friction. |
| Recent exercise chips | `ExercisePickerPage` (`getRecentExerciseIds`) | `ExercisePickerScreen` recent row | Home stack | Planned | Surface most recently used exercises. |
| Select exercise to start log flow | `ExercisePickerPage` (`navigate('/log/:exerciseId')`) | `ExercisePickerScreen` item tap | Home stack → Log screen push | Planned | Selection opens logging screen for chosen exercise. |
| Create custom exercise | `ExercisePickerPage` custom form + `addCustomExercise` | `CreateCustomExercise` section/modal in picker | Home stack | Planned | Include name + category, then route directly to logging for new custom exercise. |
| Custom exercise tagging | `ExercisePickerPage` custom badge | `ExercisePickerScreen` custom badge | Home stack | Planned | Custom entries visually marked for parity. |

## 5) Workout Logging (set input, weight/reps, warmup, notes, save, edit)

| Web Feature | Web Route/Component | Mobile Screen | Mobile Navigation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| New logging flow | `/log/:exerciseId` → `LogExercisePage` | `LogExerciseScreen` | Home stack push | Planned | Primary write flow for entries. |
| Edit existing logged entry | `/edit/:entryId` → `LogExercisePage` (edit mode) | `EditExerciseEntryScreen` (shared component) | History → Edit push | Planned | Reuse logging UI with edit-mode behavior. |
| Performed date input | `LogExercisePage` date field | `LogExerciseScreen` date selector | Log screen | Planned | Persist date as session performed-at timestamp. |
| Add/remove sets | `LogExercisePage` + `SetRow` | `LogExerciseScreen` set list | Log screen | Planned | Add set button and remove control per set. |
| Weight entry per set (kg internal, display by unit) | `SetRow` + `DualWeightInput` | `SetRow` (RN) + unit-aware weight input | Log screen | Planned | Keep kg as canonical storage and unit-converted UI. |
| Reps entry per set | `SetRow` reps controls | `SetRow` (RN) reps controls | Log screen | Planned | Increment/decrement and direct numeric edit parity. |
| Warmup toggle per set | `SetRow` warmup button | `SetRow` (RN) warmup toggle | Log screen | Planned | Warmup sets excluded from best working-set comparisons. |
| Bodyweight exercise behavior | `LogExercisePage` + `SetRow` (no weight for bodyweight category) | `LogExerciseScreen` conditional set UI | Log screen | Planned | Hide/disable weight input when exercise is bodyweight. |
| Previous session summary context | `LogExercisePage` (`Last session` panel) | `LogExerciseScreen` context panel | Log screen | Planned | Show last logged performance and recency. |
| Estimated 1RM summary + rep-count warning | `LogExercisePage` + `best1RMFromSetsDetailed` | `LogExerciseScreen` | Log screen | Planned | Keep warning for less-accurate high-rep source sets. |
| Percentage chart for estimated 1RM | `LogExercisePage` + `PercentageChart` | `LogExerciseScreen` chart section | Log screen | Planned | Match table/percent output for planning loads. |
| Session notes | `ExerciseEntry.notes` model + log flow | `LogExerciseScreen` notes input | Log screen | Planned | Preserve notes field in create/edit flows. |
| Save new entry | `LogExercisePage` + `addEntry` | `LogExerciseScreen` save action | Log screen → Home | Planned | Confirm save and return to Home for new entries. |
| Update existing entry | `LogExercisePage` + `updateEntry` | `EditExerciseEntryScreen` update action | Edit screen → History | Planned | Confirm update and return to exercise history. |

## 6) Exercise History (entry list, 1RM chart)

| Web Feature | Web Route/Component | Mobile Screen | Mobile Navigation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Exercise history screen | `/history/:exerciseId` → `ExerciseHistoryPage` | `ExerciseHistoryScreen` | Home/Log → History push | Planned | Per-exercise historical detail view. |
| Session list (most recent first) | `ExerciseHistoryPage` | `ExerciseHistoryScreen` list | History stack | Planned | Keep descending chronological ordering. |
| Session detail rows (sets, warmup labeling) | `ExerciseHistoryPage` set render | `ExerciseHistoryScreen` entry cards | History stack | Planned | Show each set with bodyweight/weight formatting + warmup flag. |
| 1RM summary cards (current, rolling best, all-time best) | `ExerciseHistoryPage` + `use1RM` | `ExerciseHistoryScreen` summary panel | History stack | Planned | Match derived metric definitions and display order. |
| Rolling best percentage chart | `ExerciseHistoryPage` + `PercentageChart` | `ExerciseHistoryScreen` chart section | History stack | Planned | Same chart logic and unit formatting as web. |
| 1RM trend chart over time | `ExerciseHistoryPage` `OneRMTrendChart` | `ExerciseHistoryScreen` trend chart | History stack | Planned | Keep timeline and value scaling semantics. |
| Edit session from history | `ExerciseHistoryPage` edit action | `ExerciseHistoryScreen` edit action | History → Edit push | Planned | Deep-link to edit flow for chosen entry. |
| Delete session from history | `ExerciseHistoryPage` delete action + confirm | `ExerciseHistoryScreen` delete action + confirmation | History stack | Planned | Preserve confirmation requirement before deletion. |

## 7) Settings (units, age bracket, barbell weight, account)

| Web Feature | Web Route/Component | Mobile Screen | Mobile Navigation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Settings screen | `/settings` → `SettingsPage` | `SettingsScreen` | Settings tab/stack | Planned | Main preferences and account screen. |
| Account identity display | `SettingsPage` account section | `SettingsScreen` account section | Settings tab | Planned | Show signed-in email/user identity. |
| Auth provider display | `SettingsPage` provider label | `SettingsScreen` provider row | Settings tab | Planned | Show source provider (Google/Apple). |
| Sign out action | `SettingsPage` sign-out button | `SettingsScreen` sign-out action | Settings tab → Auth flow | Planned | Returns user to sign-in stack after successful sign-out. |
| Primary unit preference | `SettingsPage` primary unit controls | `SettingsScreen` unit controls | Settings tab | Planned | App-wide unit display preference (kg/lbs). |
| Age bracket preference | `SettingsPage` age bracket controls | `SettingsScreen` age controls | Settings tab | Planned | Drives detraining threshold logic. |
| Default barbell weight preference | `SettingsPage` barbell weight controls | `SettingsScreen` barbell controls | Settings tab | Planned | Numeric input and increment/decrement parity. |
| Sync status visibility | `SettingsPage` pending/last-synced section | `SettingsScreen` sync status section | Settings tab | Planned | Show pending local changes and last successful sync time. |
| Onboarding completion flag persistence | `useSettingsStore.completeOnboarding` | Settings store (no dedicated UI) | App bootstrap flow | Planned | Required for gating onboarding vs. normal app start. |

## 8) Help/Docs (help content)

| Web Feature | Web Route/Component | Mobile Screen | Mobile Navigation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Help screen route | `/help` → `HelpPage` | `HelpScreen` | Home header action → push | Planned | Preserve dedicated educational/help destination. |
| Detraining model explanation content | `HelpPage` content section | `HelpScreen` content section | Help stack | Planned | Keep explanatory text about phase meaning and training prioritization. |
| Age-adjusted detraining phase table | `HelpPage` threshold table | `HelpScreen` threshold table/list | Help stack | Planned | Include Fresh/Maintain/Declining/Decaying ranges by age bracket. |
| Guidance/disclaimer note | `HelpPage` tip/disclaimer | `HelpScreen` note | Help stack | Planned | Maintain training-guidance disclaimer context. |

## 9) Data Sync (offline queue, push/pull, migration)

| Web Feature | Web Route/Component | Mobile Screen | Mobile Navigation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Offline-first writes to local database | Stores + local DB (`useExerciseStore`, `useSettingsStore`, `db`) | Global data layer | Not screen-based (app-wide service) | Planned | User actions must succeed locally even when offline. |
| Sync queue enqueuing on mutations | `sync/queue.ts` + store mutation paths | Global sync service | Not screen-based | Planned | Queue entries/exercises/settings upserts/deletes for later push. |
| Push pending queue to Supabase | `sync/push.ts` | Global sync service | Not screen-based | Planned | Upload local queued changes when authenticated + online. |
| Pull remote changes from Supabase | `sync/pull.ts` | Global sync service | Not screen-based | Planned | Download cloud updates and merge into local store. |
| Sync orchestration loop | `sync/syncEngine.ts` | Global sync service | Not screen-based | Planned | Keep periodic and event-triggered sync behavior aligned with web. |
| Local-to-cloud migration on first sign-in | `sync/migration.ts` + `AuthGate` | Auth migration step screen/state | Auth flow transition | Planned | Migrate existing anonymous/local data into authenticated user scope once. |
| Sync progress/user visibility | `SettingsPage` sync status | `SettingsScreen` sync status | Settings tab | Planned | Expose pending count and last synced timestamp for trust/diagnosis. |

## 10) Connectivity (online/offline handling)

| Web Feature | Web Route/Component | Mobile Screen | Mobile Navigation | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Online event-triggered sync | `sync/syncEngine.ts` (`online` listener) | Connectivity service | Not screen-based | Planned | Trigger sync when connection returns. |
| Visibility-triggered sync | `sync/syncEngine.ts` (`visibilitychange`) | App lifecycle service | Not screen-based | Planned | Native analog uses AppState resume trigger (documented in deltas). |
| 30-second sync interval | `sync/syncEngine.ts` (`SYNC_INTERVAL_MS = 30_000`) | Connectivity/sync service | Not screen-based | Planned | Maintain equivalent periodic sync cadence on mobile. |
| Offline-safe behavior with deferred upload | Local stores + sync queue | Global data layer | Not screen-based | Planned | Continue allowing logs/settings changes offline and sync later. |
| Offline status communication | `SettingsPage` pending sync + app status patterns | Mobile offline badge + settings sync status | Global UI + Settings | Planned | Mobile should make offline state more prominent for user awareness. |
