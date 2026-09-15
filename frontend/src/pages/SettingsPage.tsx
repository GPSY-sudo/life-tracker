import { useState } from 'react';
import { Sun, Moon, Monitor, Clock, Volume2, Bell, Save } from 'lucide-react';
import { useSettings, setTheme, updatePomodoroSettings, updateSoundPreferences } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { soundDefinitions } from '@/data/mockData';
import { PageHeader } from '@/components/ui/PageHeader';
import type { ThemeMode, SoundId } from '@/types';

export function SettingsPage() {
  const toast = useToast();
  const settings = useSettings();

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Customize your Life Tracker experience" />

      <div className="space-y-6">
        {/* Appearance */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-primary dark:text-primary-300" />
            <h2 className="text-base font-semibold text-ink dark:text-slate-200">Appearance</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([
              { mode: 'light' as ThemeMode, label: 'Light', icon: Sun },
              { mode: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
              { mode: 'system' as ThemeMode, label: 'System', icon: Monitor },
            ]).map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => {
                  setTheme(mode);
                  toast(`Theme set to ${label}`, 'success');
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                  settings.theme === mode
                    ? 'border-primary bg-primary-50 dark:bg-primary/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon className={`w-6 h-6 ${settings.theme === mode ? 'text-primary dark:text-primary-300' : 'text-ink-muted dark:text-slate-400'}`} />
                <span className={`text-sm font-medium ${settings.theme === mode ? 'text-primary dark:text-primary-300' : 'text-ink dark:text-slate-200'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Focus Settings */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary dark:text-primary-300" />
            <h2 className="text-base font-semibold text-ink dark:text-slate-200">Focus</h2>
          </div>
          <div className="space-y-4">
            <NumberSetting
              label="Focus duration (minutes)"
              value={settings.pomodoro.focusDuration}
              min={1}
              max={90}
              onChange={(v) => updatePomodoroSettings({ focusDuration: v })}
            />
            <NumberSetting
              label="Short break duration (minutes)"
              value={settings.pomodoro.shortBreakDuration}
              min={1}
              max={30}
              onChange={(v) => updatePomodoroSettings({ shortBreakDuration: v })}
            />
            <NumberSetting
              label="Long break duration (minutes)"
              value={settings.pomodoro.longBreakDuration}
              min={1}
              max={60}
              onChange={(v) => updatePomodoroSettings({ longBreakDuration: v })}
            />
            <NumberSetting
              label="Sessions before long break"
              value={settings.pomodoro.sessionsBeforeLongBreak}
              min={1}
              max={10}
              onChange={(v) => updatePomodoroSettings({ sessionsBeforeLongBreak: v })}
            />
            <ToggleSetting
              label="Auto-start breaks"
              description="Automatically start break timer after focus session"
              checked={settings.pomodoro.autoStartBreaks}
              onChange={(v) => updatePomodoroSettings({ autoStartBreaks: v })}
            />
            <ToggleSetting
              label="Auto-start focus sessions"
              description="Automatically start next focus session after break"
              checked={settings.pomodoro.autoStartFocus}
              onChange={(v) => updatePomodoroSettings({ autoStartFocus: v })}
            />
            <ToggleSetting
              label="Play ambience during breaks"
              description="Keep ambient sounds playing during break sessions"
              checked={settings.pomodoro.playAmbienceDuringBreaks}
              onChange={(v) => updatePomodoroSettings({ playAmbienceDuringBreaks: v })}
            />
          </div>
        </section>

        {/* Sound Settings */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-primary dark:text-primary-300" />
            <h2 className="text-base font-semibold text-ink dark:text-slate-200">Sounds</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Master Volume</label>
                <span className="text-sm font-medium text-ink dark:text-slate-200">{settings.sounds.masterVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.sounds.masterVolume}
                onChange={(e) => updateSoundPreferences({ masterVolume: Number(e.target.value) })}
                className="w-full"
                aria-label="Master volume"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function NumberSetting({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-ink dark:text-slate-200">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-ink dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center"
          aria-label="Decrease"
        >
          -
        </button>
        <span className="text-sm font-semibold text-ink dark:text-slate-100 w-10 text-center">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-ink dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center"
          aria-label="Increase"
        >
          +
        </button>
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label className="text-sm text-ink dark:text-slate-200">{label}</label>
        {description && <p className="text-xs text-ink-muted dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors shrink-0 relative ${checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
