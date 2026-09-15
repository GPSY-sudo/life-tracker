import { store } from './store';
import type { SoundPreset, SoundId } from '@/types';

const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

export const soundService = {
  async getPresets(): Promise<SoundPreset[]> {
    await delay();
    return [...store.soundPresets];
  },

  async createPreset(name: string, sounds: Record<string, number>): Promise<SoundPreset> {
    await delay();
    const preset: SoundPreset = {
      id: store.generateId('preset'),
      name,
      sounds,
      isBuiltIn: false,
    };
    store.addSoundPreset(preset);
    return preset;
  },

  async updatePreset(id: string, data: Partial<Pick<SoundPreset, 'name' | 'sounds'>>): Promise<SoundPreset | null> {
    await delay();
    const preset = store.soundPresets.find((p) => p.id === id);
    if (!preset || preset.isBuiltIn) return null;
    return store.updateSoundPreset(id, data);
  },

  async renamePreset(id: string, name: string): Promise<SoundPreset | null> {
    return this.updatePreset(id, { name });
  },

  async deletePreset(id: string): Promise<boolean> {
    await delay();
    const preset = store.soundPresets.find((p) => p.id === id);
    if (!preset || preset.isBuiltIn) return false;
    return store.removeSoundPreset(id);
  },

  async getPreferences() {
    await delay();
    return JSON.parse(JSON.stringify(store.settings.sounds));
  },

  async savePreferences(prefs: typeof store.settings.sounds): Promise<void> {
    await delay();
    store.setSettings({
      ...store.settings,
      sounds: JSON.parse(JSON.stringify(prefs)),
    });
  },
};
