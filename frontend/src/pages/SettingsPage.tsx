import { Sun, Moon, Monitor, Clock, LogOut, User as UserIcon, Lock, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettings, setTheme, updatePomodoroSettings } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';
import { ChangePasswordForm } from '@/components/ChangePasswordForm';
import { DeleteAccountModal } from '@/components/DeleteAccountModal';
import { appPreferenceService } from '@/services/appPreferenceService';
import { PageHeader } from '@/components/ui/PageHeader';
import type { ThemeMode } from '@/types';

export function SettingsPage() {
  const toast = useToast();
  const settings = useSettings();
  const { user, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pomodoroValues, setPomodoroValues] = useState(settings.pomodoro);
  const [isSavingPomodoro, setIsSavingPomodoro] = useState(false);

  // Sync pomodoro values from settings on mount
  useEffect(() => {
    setPomodoroValues(settings.pomodoro);
  }, [settings.pomodoro]);

  const handleSavePomodoro = async () => {
    try {
      setIsSavingPomodoro(true);
      await appPreferenceService.updateAppPreferences({
        pomodoro: pomodoroValues,
      });
      // Update the store with new values
      updatePomodoroSettings(pomodoroValues);
      toast('Pomodoro settings saved', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save Pomodoro settings';
      toast(message, 'error');
    } finally {
      setIsSavingPomodoro(false);
    }
  };

  const handlePomodoroChange = (key: keyof typeof pomodoroValues, value: number) => {
    setPomodoroValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Customize your Life Tracker experience" />

      <div className="space-y-6">
        {/* Account */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-primary dark:text-primary-300" />
            <h2 className="text-base font-semibold text-ink dark:text-slate-200">Account</h2>
          </div>
          <div className="space-y-4">
            {user ? (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div>
                    <p className="text-xs text-ink-muted dark:text-slate-400 uppercase tracking-wide">Name</p>
                    <p className="text-sm font-medium text-ink dark:text-slate-200">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div>
                    <p className="text-xs text-ink-muted dark:text-slate-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-ink dark:text-slate-200">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-ink dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
                >
                  <Lock className="w-4 h-4" />
                  {showChangePassword ? 'Hide' : 'Change Password'}
                </button>
                {showChangePassword && (
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <ChangePasswordForm />
                  </div>
                )}
                <button
                  onClick={() => {
                    logout();
                    toast('Logged out successfully', 'success');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-ink dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-danger/10 dark:bg-danger/20 text-danger hover:bg-danger/20 dark:hover:bg-danger/30 transition-colors font-medium text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </>
            ) : (
              <p className="text-sm text-ink-muted dark:text-slate-400">Loading account information...</p>
            )}
          </div>
        </section>

        <DeleteAccountModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />

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
              value={pomodoroValues.focusDuration}
              min={1}
              max={90}
              onChange={(v) => handlePomodoroChange('focusDuration', v)}
            />
            <NumberSetting
              label="Short break duration (minutes)"
              value={pomodoroValues.shortBreakDuration}
              min={1}
              max={30}
              onChange={(v) => handlePomodoroChange('shortBreakDuration', v)}
            />
            <NumberSetting
              label="Long break duration (minutes)"
              value={pomodoroValues.longBreakDuration}
              min={1}
              max={60}
              onChange={(v) => handlePomodoroChange('longBreakDuration', v)}
            />
            <NumberSetting
              label="Sessions before long break"
              value={pomodoroValues.sessionsBeforeLongBreak}
              min={1}
              max={10}
              onChange={(v) => handlePomodoroChange('sessionsBeforeLongBreak', v)}
            />
            <button
              onClick={handleSavePomodoro}
              disabled={isSavingPomodoro}
              className="w-full px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {isSavingPomodoro ? 'Saving...' : 'Save Pomodoro Settings'}
            </button>
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
  const [inputValue, setInputValue] = useState<string>(String(value));

  // Update input display when value prop changes (e.g., from - or + buttons)
  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow empty string or numeric values
    setInputValue(newValue);
  };

  const handleInputBlur = () => {
    if (inputValue === '' || inputValue === '-') {
      // Empty field → set to minimum
      onChange(min);
      setInputValue(String(min));
      return;
    }

    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed)) {
      // Non-numeric → set to minimum
      onChange(min);
      setInputValue(String(min));
      return;
    }

    // Clamp to valid range
    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(clamped);
    setInputValue(String(clamped));
  };

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-ink dark:text-slate-200">{label}</label>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-ink dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center font-semibold"
            aria-label="Decrease"
            type="button"
          >
            −
          </button>
          <input
            type="number"
            min={min}
            max={max}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-12 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-ink dark:text-slate-200 text-center text-sm font-semibold border border-slate-200 dark:border-slate-600 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            style={{ MozAppearance: 'textfield' }}
            aria-label={`${label} input`}
          />
          <button
            onClick={() => onChange(Math.min(max, value + 1))}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-ink dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center font-semibold"
            aria-label="Increase"
            type="button"
          >
            +
          </button>
        </div>
        <span className="text-xs text-ink-muted dark:text-slate-500 whitespace-nowrap">
          Min {min} • Max {max}
        </span>
      </div>
    </div>
  );
}
