import { useEffect, useSyncExternalStore } from 'react';
import { store } from '@/services/store';
import type { Activity, Task, FocusSession, SoundPreset, AppSettings, DailyRecord } from '@/types';

function useStoreData<T>(selector: () => T): T {
  return useSyncExternalStore((cb) => store.subscribe(cb), selector, selector);
}

export function useActivities(): Activity[] { return useStoreData(() => store.activities); }
export function useTasks(): Task[] { return useStoreData(() => store.tasks); }
export function useFocusSessions(): FocusSession[] { return useStoreData(() => store.focusSessions); }
export function useSoundPresets(): SoundPreset[] { return useStoreData(() => store.soundPresets); }
export function useDailyRecord(date: string): DailyRecord | undefined { return useStoreData(() => store.dailyRecords[date]); }
export function useAllDailyRecords(): Record<string, DailyRecord> { return useStoreData(() => store.dailyRecords); }
export function useSettings(): AppSettings { return useStoreData(() => store.settings); }

export function useTheme() {
  const settings = useSettings();
  useEffect(() => {
    const applyTheme = (mode: typeof settings.theme) => {
      const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme(settings.theme);
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings.theme]);
  return settings.theme;
}

export function setTheme(theme: AppSettings['theme']) {
  store.setSettings({ ...store.settings, theme });
}
export function updatePomodoroSettings(data: Partial<AppSettings['pomodoro']>) {
  store.setSettings({ ...store.settings, pomodoro: { ...store.settings.pomodoro, ...data } });
}
export function updateSoundPreferences(data: Partial<AppSettings['sounds']>) {
  store.setSettings({ ...store.settings, sounds: { ...store.settings.sounds, ...data } });
}
