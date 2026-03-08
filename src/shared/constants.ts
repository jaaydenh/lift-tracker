import type { UserSettings } from './models/types';

export const APP_NAME = 'LiftTracker';

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'user',
  primaryUnit: 'kg',
  ageBracket: 'young',
  barbellWeightKg: 20,
  hasCompletedOnboarding: false,
};

export const DEFAULT_BARBELL_WEIGHTS_KG = {
  standard: 20,
  womens: 15,
  training: 15,
  ez_curl: 10,
} as const;
