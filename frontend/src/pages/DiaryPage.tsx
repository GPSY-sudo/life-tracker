import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen, Save, Calendar } from 'lucide-react';
import { useAllDailyRecords, useActivities, useTasks, useFocusSessions, loadActivitiesFromAPI, loadFocusSessionsFromAPI, updateDiaryNoteAndSync, loadDailyRecordsForRange } from '@/hooks/useAppData';
import { useToast } from '@/hooks/useToast';
import { diaryService } from '@/services/diaryService';
import { PageHeader } from '@/components/ui/PageHeader';
import { ActivityStatusIcon } from '@/components/ActivityStatusIcon';
import { todayISO, formatDate, addDays, getDayName, formatDuration, formatSessionDuration, formatTimeFromDate, isDateApplicable } from '@/utils/date';

export function DiaryPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const dailyRecords = useAllDailyRecords();
  const activities = useActivities();
  const tasks = useTasks();
  const focusSessions = useFocusSessions();

  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('date') || todayISO());
  const [diaryText, setDiaryText] = useState('');
  const [diaryMood, setDiaryMood] = useState<'great' | 'good' | 'okay' | 'not_great' | 'bad' | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load activities and focus sessions on mount if not already loaded
  useEffect(() => {
    Promise.all([
      loadActivitiesFromAPI().catch(() => {
        // Silently fail — activities may already be loaded
      }),
      loadFocusSessionsFromAPI().catch(() => {
        // Silently fail — focus sessions may already be loaded
      }),
    ]);
  }, []);

  useEffect(() => {
    const date = searchParams.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) setSelectedDate(date);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    diaryService.getDiary(selectedDate)
      .then((data) => {
        if (active) {
          setDiaryText(data.note);
          setDiaryMood(data.mood);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load diary:', err);
          setError('Failed to load diary entry');
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [selectedDate]);

  const isToday = selectedDate === todayISO();
  const isFuture = selectedDate > todayISO();

  const dayRecord = dailyRecords[selectedDate];
  const dayFocusSessions = useMemo(
    () => focusSessions.filter((s) => s.date === selectedDate && s.type === 'focus'),
    [focusSessions, selectedDate]
  );
  const dayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate === selectedDate),
    [tasks, selectedDate]
  );

  // Calendar with diary indicators
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dateStr);
    }
    return days;
  }, [calYear, calMonth]);

  // Load daily records for the displayed calendar month
  useEffect(() => {
    const startDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const endDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    loadDailyRecordsForRange(startDate, endDate).catch((err) => {
      console.error('Failed to load daily records for calendar:', err);
      // Silently fail — calendar can still show without data
    });
  }, [calYear, calMonth]);

  const hasDiary = (date: string) => {
    const rec = dailyRecords[date];
    return !!rec && rec.diaryNote.trim().length > 0;
  };

  const handleSave = async () => {
    try {
      await updateDiaryNoteAndSync(selectedDate, diaryText, diaryMood);
      toast('Diary saved', 'success');
    } catch (err) {
      toast('Failed to save diary', 'error');
      console.error(err);
    }
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <PageHeader title="Diary" subtitle="Write about your day" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 sm:gap-6">
        {/* Main diary editor */}
        <div>
          {/* Date navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="btn-ghost px-2 sm:px-3 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Previous day">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-ink dark:text-slate-100">{formatDate(selectedDate)}</h2>
              <p className="text-xs sm:text-sm text-ink-muted dark:text-slate-400">{getDayName(selectedDate)}</p>
            </div>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="btn-ghost px-2 sm:px-3 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Next day">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Diary editor */}
          <div className="card p-5 mb-4">
            {isFuture ? (
              <p className="text-sm text-ink-muted dark:text-slate-400 py-8 text-center">
                You can't write diary entries for future dates.
              </p>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-danger-text dark:text-red-400">{error}</p>
              </div>
            ) : loading ? (
              <div className="h-32 flex items-center justify-center">
                <span className="text-sm text-ink-muted dark:text-slate-400">Loading...</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-xs sm:text-sm font-medium text-ink dark:text-slate-200 mb-2">How was your day?</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                    {[
                      { value: 'great', emoji: '😄', label: 'Great' },
                      { value: 'good', emoji: '🙂', label: 'Good' },
                      { value: 'okay', emoji: '😐', label: 'Okay' },
                      { value: 'not_great', emoji: '😕', label: 'Not Great' },
                      { value: 'bad', emoji: '😞', label: 'Bad' },
                    ].map(({ value, emoji, label }) => (
                      <button
                        key={value}
                        onClick={() => setDiaryMood(diaryMood === value ? undefined : (value as any))}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          diaryMood === value
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-ink-muted dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {emoji} <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] sm:text-xs text-ink-muted dark:text-slate-500">Mood is optional — you can leave it unselected.</p>
                </div>
                <textarea
                  className="input min-h-[150px] sm:min-h-[200px] resize-y text-xs sm:text-sm leading-relaxed"
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  placeholder="Write about your day..."
                  autoFocus
                />
                <div className="flex justify-end mt-3">
                  <button onClick={handleSave} className="btn-primary px-3 sm:px-4 py-2 text-xs sm:text-sm">
                    <Save className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Save Entry</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Day summary */}
          {!isFuture && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
              {/* Activities */}
              <div className="card p-4 sm:p-5">
                <h3 className="text-xs sm:text-sm font-semibold text-ink dark:text-slate-200 mb-3">Activities</h3>
                {activities.length === 0 ? (
                  <p className="text-xs text-ink-muted dark:text-slate-400">No activities tracked.</p>
                ) : (
                  <div className="space-y-1">
                    {activities.map((a) => {
                      const isActive = isDateApplicable(selectedDate, a);
                      if (!isActive) return null;
                      let status = dayRecord?.activities[a.id];
                      
                      // Apply the new rule: past applicable unrecorded → incomplete
                      if (!status && selectedDate < todayISO()) {
                        status = 'incomplete';
                      }
                      
                      return (
                        <div key={a.id} className="flex items-center gap-3 p-1.5">
                          <ActivityStatusIcon status={status} size="sm" />
                          <span className={`text-xs sm:text-sm ${status === 'completed' ? 'text-ink-muted dark:text-slate-500 line-through' : 'text-ink dark:text-slate-200'}`}>
                            {a.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="card p-4 sm:p-5">
                <h3 className="text-xs sm:text-sm font-semibold text-ink dark:text-slate-200 mb-3">Tasks</h3>
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-ink-muted dark:text-slate-400">No tasks due on this day.</p>
                ) : (
                  <div className="space-y-1">
                    {dayTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 p-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'completed' ? 'bg-success' : t.status === 'in_progress' ? 'bg-primary' : t.status === 'blocked' ? 'bg-danger' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <span className={`text-xs sm:text-sm truncate ${t.status === 'completed' ? 'text-ink-muted dark:text-slate-500 line-through' : 'text-ink dark:text-slate-200'}`}>
                          {t.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Focus */}
              <div className="card p-4 sm:p-5">
                <h3 className="text-xs sm:text-sm font-semibold text-ink dark:text-slate-200 mb-3">Focus Sessions</h3>
                {dayFocusSessions.length === 0 ? (
                  <p className="text-xs text-ink-muted dark:text-slate-400">No focus sessions on this day.</p>
                ) : (
                  <div className="space-y-1">
                    {dayFocusSessions.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 text-xs p-1.5">
                        <span className="text-ink-muted dark:text-slate-400 w-12 flex-shrink-0">{formatTimeFromDate(s.startTime)}</span>
                        <span className="text-ink dark:text-slate-200 flex-1 truncate">
                          {tasks.find((t) => t.id === s.taskId)?.title ?? activities.find((a) => a.id === s.activityId)?.name ?? 'Free focus'}
                        </span>
                        <span className="text-ink-muted dark:text-slate-400 flex-shrink-0">{formatSessionDuration(s.duration)}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-xs sm:text-sm font-medium text-ink dark:text-slate-200">
                        Total: {formatSessionDuration(dayFocusSessions.reduce((s, x) => s + x.duration, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Calendar sidebar */}
        <div className="card p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="btn-ghost p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-semibold text-ink dark:text-slate-200 text-center flex-1">
              {new Date(calYear, calMonth, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
            </span>
            <button onClick={nextMonth} className="btn-ghost p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Next month">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {weekDays.map((d, i) => (
              <div key={i} className="text-center text-[10px] sm:text-xs text-ink-light dark:text-slate-500 font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((date, i) => {
              if (!date) return <div key={i} />;
              const dayNum = Number(date.split('-')[2]);
              const isToday = date === todayISO();
              const isSelected = date === selectedDate;
              const hasEntry = hasDiary(date);
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] sm:text-xs transition-colors relative min-h-[28px] sm:min-h-[32px] ${
                    isSelected ? 'bg-primary text-white' :
                    isToday ? 'bg-primary-50 text-primary dark:bg-primary/15 dark:text-primary-300 ring-1 ring-primary' :
                    'hover:bg-slate-100 dark:hover:bg-slate-700 text-ink dark:text-slate-300'
                  }`}
                  aria-label={`${date}${hasEntry ? ' - has diary entry' : ''}`}
                >
                  <span className="font-medium">{dayNum}</span>
                  {hasEntry && (
                    <span className={`text-[7px] sm:text-[8px] ${isSelected ? 'text-white' : ''}`}>
                      <BookOpen className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-[10px] sm:text-xs text-ink-muted dark:text-slate-400">
            <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" /> = has entry
          </div>
        </div>
      </div>
    </div>
  );
}
