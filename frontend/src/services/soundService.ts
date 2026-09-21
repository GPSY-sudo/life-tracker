import { apiFetch } from './api';
import { store } from './store';
import type { SoundPreset, SoundId, SoundPreferences } from '@/types';

const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

export const soundService = {
  async getPresets(): Promise<SoundPreset[]> {
    await delay();
    return [...store.soundPresets];
  },

  async createPreset(name: string, sounds: Record<string, number>): Promise<SoundPreset> {
    try {
      // Try to save to backend
      await apiFetch('/preferences/sounds/presets', {
        method: 'POST',
        body: JSON.stringify({ name, sounds }),
      });
    } catch (error) {
      console.error('Failed to save preset to backend:', error);
      // Continue with local save even if backend fails
    }

    // Create local copy
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

    try {
      // Try to delete from backend
      await apiFetch(`/preferences/sounds/presets/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete preset from backend:', error);
      // Continue with local delete even if backend fails
    }

    return store.removeSoundPreset(id);
  },

  async getPreferences(): Promise<SoundPreferences> {
    try {
      const prefs = await apiFetch<SoundPreferences>('/preferences/sounds');
      return prefs;
    } catch (error) {
      console.error('Failed to load sound preferences:', error);
      // Return current store settings as fallback to prevent breaking audio playback
      return JSON.parse(JSON.stringify(store.settings.sounds));
    }
  },

  async savePreferences(prefs: SoundPreferences): Promise<void> {
    try {
      const updated = await apiFetch<SoundPreferences>('/preferences/sounds', {
        method: 'PUT',
        body: JSON.stringify(prefs),
      });
      // Sync backend response back to store to keep them in sync
      store.setSettings({
        ...store.settings,
        sounds: updated,
      });
    } catch (error) {
      console.error('Failed to save sound preferences:', error);
      // Still update local store so playback isn't interrupted
      store.setSettings({
        ...store.settings,
        sounds: prefs,
      });
      // Re-throw error for caller to handle if needed
      throw error;
    }
  },
};
