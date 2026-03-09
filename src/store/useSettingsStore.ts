import { create } from 'zustand';
import { db } from '../db/database';
import { DEFAULT_SETTINGS } from '../shared/constants';
import type { UserSettings } from '../shared/models/types';
import { enqueueSync } from '../sync/queue';

interface SettingsStore {
  settings: UserSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    const savedSettings = await db.settings.get(DEFAULT_SETTINGS.id);

    set({
      settings: savedSettings ?? DEFAULT_SETTINGS,
      isLoaded: true,
    });
  },

  updateSettings: async (partial) => {
    const nextSettings: UserSettings = {
      ...get().settings,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    set({ settings: nextSettings });
    await db.settings.put(nextSettings);
    await enqueueSync('settings', 'upsert', nextSettings.id, nextSettings);
  },

  completeOnboarding: async () => {
    await get().updateSettings({ hasCompletedOnboarding: true });
  },
}));
