import { Modal } from './ui/Modal';

interface LogoutFarewellModalProps {
  isOpen: boolean;
  onGoHome: () => void;
}

export function LogoutFarewellModal({ isOpen, onGoHome }: LogoutFarewellModalProps) {
  return (
    <Modal open={isOpen} onClose={onGoHome} title="See You Soon" size="sm">
      <div className="space-y-6">
        {/* MiraiThread icon */}
        <div className="flex justify-center">
          <img 
            src="/miraithread-icon.png" 
            alt="MiraiThread" 
            className="h-16 w-16"
          />
        </div>

        {/* Farewell message */}
        <div className="space-y-3 text-center">
          <p className="text-base text-ink dark:text-slate-200">
            Thanks for spending your time with MiraiThread.
          </p>
          <p className="text-sm text-ink-muted dark:text-slate-400">
            Keep moving forward, one day at a time.
          </p>
        </div>

        {/* Action button */}
        <div className="flex gap-3">
          <button
            onClick={onGoHome}
            className="btn-primary w-full py-2.5 text-sm font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    </Modal>
  );
}
