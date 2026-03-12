import { create } from 'zustand';
import type { UserSettings } from '@lift-tracker/shared';
import { getStorageAdapter } from '../app/adapterRuntime';
import { DEFAULT_SETTINGS } from '../shared/constants';
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
    const storage = getStorageAdapter();
    const savedSettings = await storage.settings.get(DEFAULT_SETTINGS.id);

    set({
      settings: savedSettings ?? DEFAULT_SETTINGS,
      isLoaded: true,
    });
  },

  updateSettings: async (partial) => {
    const storage = getStorageAdapter();
    const nextSettings: UserSettings = {
      ...get().settings,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    set({ settings: nextSettings });
    await storage.settings.put(nextSettings);
    await enqueueSync('settings', 'upsert', nextSettings.id, nextSettings, storage);
  },

  completeOnboarding: async () => {
    await get().updateSettings({ hasCompletedOnboarding: true });
  },
}));
