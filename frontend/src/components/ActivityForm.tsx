import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { Activity } from '@/types';

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; startDate?: string; endDate?: string }) => void;
  activity?: Activity | null;
}

export function ActivityForm({ open, onClose, onSubmit, activity }: ActivityFormProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(activity?.name ?? '');
      setStartDate(activity?.startDate ?? '');
      setEndDate(activity?.endDate ?? '');
      setError('');
    }
  }, [open, activity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Activity name is required');
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setError('End date must be after start date');
      return;
    }
    onSubmit({
      name: name.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={activity ? 'Edit Activity' : 'Add Activity'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="activity-name">Name</label>
          <input
            id="activity-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. DSA, Python, Exercise"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="activity-start">Start Date (optional)</label>
            <input
              id="activity-start"
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="activity-end">End Date (optional)</label>
            <input
              id="activity-end"
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-danger-text dark:text-red-400">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-ghost px-4" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary px-4">
            {activity ? 'Save Changes' : 'Add Activity'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
