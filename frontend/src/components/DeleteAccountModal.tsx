import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const toast = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  const isConfirmed = confirmText === 'DELETE';

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await authService.deleteAccount();
      toast('Account deleted successfully', 'success');
      logout();
      navigate('/register', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      toast(message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface-card dark:bg-surface-dark-card rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <div>
            <h3 className="font-semibold text-ink dark:text-slate-100">Delete Account?</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400 mt-1">This action cannot be undone.</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6 space-y-2">
          <p className="text-sm text-ink dark:text-slate-200">
            Deleting your account will permanently:
          </p>
          <ul className="text-sm text-ink-muted dark:text-slate-400 space-y-1 pl-4">
            <li>• Delete your account and all login credentials</li>
            <li>• Remove all activities and daily records</li>
            <li>• Remove all tasks and focus sessions</li>
            <li>• Remove all settings and preferences</li>
            <li>• Remove all diary entries</li>
          </ul>
          <p className="text-sm font-medium text-danger mt-3">
            This cannot be undone. Proceed with caution.
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="delete-confirm" className="block text-sm font-medium text-ink dark:text-slate-200 mb-2">
            Type <span className="font-semibold text-danger">DELETE</span> to confirm:
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            disabled={isDeleting}
            className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-ink dark:text-slate-200 placeholder-ink-muted dark:placeholder-slate-500 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
            autoComplete="off"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-ink dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting || !isConfirmed}
            className="flex-1 px-4 py-2 rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
