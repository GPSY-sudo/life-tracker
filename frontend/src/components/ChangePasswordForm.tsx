import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/useToast';

export function ChangePasswordForm() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast('All fields are required', 'error');
      return;
    }

    if (newPassword.length < 6) {
      toast('New password must be at least 6 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast('New password and confirmation do not match', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      toast('New password must be different from current password', 'error');
      return;
    }

    try {
      setIsLoading(true);
      await authService.changePassword({
        currentPassword,
        newPassword,
      });

      // Clear fields and show success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast('Password changed successfully', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      toast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="current-password" className="block text-sm text-ink dark:text-slate-200 mb-2">
          Current Password
        </label>
        <div className="relative">
          <input
            id="current-password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isLoading}
            className="input w-full pr-10"
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
            title={showCurrentPassword ? 'Hide password' : 'Show password'}
          >
            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="new-password" className="block text-sm text-ink dark:text-slate-200 mb-2">
          New Password
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading}
            className="input w-full pr-10"
            placeholder="Enter your new password (min 6 characters)"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            title={showNewPassword ? 'Hide password' : 'Show password'}
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm text-ink dark:text-slate-200 mb-2">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className="input w-full pr-10"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            title={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn btn-primary"
      >
        {isLoading ? 'Updating...' : 'Change Password'}
      </button>
    </form>
  );
}
