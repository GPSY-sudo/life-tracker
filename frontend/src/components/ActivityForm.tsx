import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { todayISO } from '@/utils/date';
import type { Activity, PausePeriod } from '@/types';

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; startDate?: string; endDate?: string | null; scheduledDays?: string[]; pausePeriods?: PausePeriod[] }) => void;
  activity?: Activity | null;
  year?: number;
  month?: number;
}

export function ActivityForm({ open, onClose, onSubmit, activity, year, month }: ActivityFormProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [scheduledDays, setScheduledDays] = useState<string[]>([]);
  const [useCustomSchedule, setUseCustomSchedule] = useState(false);
  const [pausePeriods, setPausePeriods] = useState<PausePeriod[]>([]);
  const [newPauseDateStart, setNewPauseDateStart] = useState('');
  const [newPauseDateEnd, setNewPauseDateEnd] = useState('');
  const [newPauseReason, setNewPauseReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(activity?.name ?? '');
      // For new activities, default start date to today; for editing, use existing date
      setStartDate(activity?.startDate ?? (activity === null || activity === undefined ? todayISO() : ''));
      setEndDate(activity?.endDate ?? '');
      // Set noEndDate checkbox based on whether activity has an endDate
      setNoEndDate(!activity?.endDate);
      // Set schedule: if activity has scheduledDays, use them; otherwise default to all days
      const days = activity?.scheduledDays ?? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      setScheduledDays(days);
      setUseCustomSchedule(!!activity?.scheduledDays);
      // Set pause periods
      setPausePeriods(activity?.pausePeriods ?? []);
      setNewPauseDateStart('');
      setNewPauseDateEnd('');
      setNewPauseReason('');
      setError('');
    }
  }, [open, activity]);

  // Reset scheduledDays when toggling between Every Day and Custom schedule
  useEffect(() => {
    if (!useCustomSchedule) {
      // Switching to "Every Day" - clear the scheduledDays selection
      setScheduledDays([]);
    }
  }, [useCustomSchedule]);

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
      endDate: noEndDate ? null : (endDate || undefined),
      // Always send scheduledDays: empty array [] for Every Day, or the selected days for Custom
      scheduledDays: useCustomSchedule ? scheduledDays : [],
      pausePeriods: pausePeriods.length > 0 ? pausePeriods : undefined,
    });
    // Don't close here — let the caller decide when to close after async operation completes
  };

  const handleAddPausePeriod = () => {
    if (!newPauseDateStart || !newPauseDateEnd) {
      setError('Pause start and end dates are required');
      return;
    }
    if (newPauseDateStart > newPauseDateEnd) {
      setError('Pause end date must be after start date');
      return;
    }
    setPausePeriods([...pausePeriods, { startDate: newPauseDateStart, endDate: newPauseDateEnd, reason: newPauseReason }]);
    setNewPauseDateStart('');
    setNewPauseDateEnd('');
    setNewPauseReason('');
    setError('');
  };

  // Get pauses that overlap the selected month
  const getVisiblePauses = () => {
    if (year === undefined || month === undefined) {
      // If no month selected, show all pauses
      return pausePeriods;
    }
    
    // Calculate the first and last day of the selected month
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    
    // Filter pauses that overlap this month
    return pausePeriods.filter((pause) => {
      // Pause overlaps month if: pause.startDate <= monthEnd AND pause.endDate >= monthStart
      return pause.startDate <= monthEnd && pause.endDate >= monthStart;
    });
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
              disabled={noEndDate}
              value={noEndDate ? '' : endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={noEndDate}
                onChange={(e) => {
                  setNoEndDate(e.target.checked);
                  if (e.target.checked) {
                    setEndDate('');
                  }
                }}
                className="w-4 h-4"
              />
              <span className="text-sm text-ink-muted dark:text-slate-400">No end date</span>
            </label>
          </div>
        </div>
        {error && <p className="text-sm text-danger-text dark:text-red-400">{error}</p>}
        <div>
          <label className="label">Schedule</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="schedule-type"
                checked={!useCustomSchedule}
                onChange={() => setUseCustomSchedule(false)}
                className="w-4 h-4"
              />
              <span className="text-sm text-ink dark:text-slate-300">Every day</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="schedule-type"
                checked={useCustomSchedule}
                onChange={() => setUseCustomSchedule(true)}
                className="w-4 h-4"
              />
              <span className="text-sm text-ink dark:text-slate-300">Custom days</span>
            </label>
          </div>
          {useCustomSchedule && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/30 rounded">
              <div className="grid grid-cols-4 gap-2">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                  <label key={day} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduledDays.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setScheduledDays([...scheduledDays, day]);
                        } else {
                          setScheduledDays(scheduledDays.filter((d) => d !== day));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-ink dark:text-slate-300 capitalize">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="label">Pause Periods (optional)</label>
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>⚠️ Pauses are permanent history. After adding a pause, click 'Add Pause' and then 'Save Changes' to permanently record it. Saved pauses cannot be deleted.</span>
            </div>
            {getVisiblePauses().map((pause, idx) => (
              <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900/30 rounded text-sm">
                <div className="text-ink dark:text-slate-200 font-medium">
                  {pause.startDate} to {pause.endDate}
                </div>
                {pause.reason && (
                  <div className="text-ink-muted dark:text-slate-400 text-xs">{pause.reason}</div>
                )}
              </div>
            ))}
            <div className="p-2 bg-slate-50 dark:bg-slate-900/30 rounded space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="input text-sm"
                  placeholder="Pause start"
                  value={newPauseDateStart}
                  onChange={(e) => setNewPauseDateStart(e.target.value)}
                />
                <input
                  type="date"
                  className="input text-sm"
                  placeholder="Pause end"
                  value={newPauseDateEnd}
                  onChange={(e) => setNewPauseDateEnd(e.target.value)}
                />
              </div>
              <input
                type="text"
                className="input text-sm w-full"
                placeholder="Reason (optional)"
                value={newPauseReason}
                onChange={(e) => setNewPauseReason(e.target.value)}
                maxLength={50}
              />
              <button
                type="button"
                onClick={handleAddPausePeriod}
                className="btn-ghost text-sm w-full"
              >
                Add Pause
              </button>
            </div>
          </div>
        </div>
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
