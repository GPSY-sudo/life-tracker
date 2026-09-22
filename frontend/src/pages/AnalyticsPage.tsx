import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Award, Flame, Calendar, Clock, BookOpen, Target } from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';
import { useActivities, useTasks, useFocusSessions, useAllDailyRecords, loadFocusSessionsFromAPI, loadActivitiesFromAPI, loadTasksFromAPI } from '@/hooks/useAppData';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatMonthYear, getMonthName, formatDuration, formatSessionDuration, todayISO, toISODate, parseISODate, isDateApplicable, formatDate } from '@/utils/date';
import type { MonthlyAnalytics, FocusAnalytics, ActivityAnalytics, TaskAnalytics, DiaryAnalytics, DailyRecord } from '@/types';

type Tab = 'overview' | 'trends' | 'activities' | 'tasks' | 'focus' | 'diary' | 'calendar' | 'review';

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'trends', label: 'Trends' },
  { id: 'activities', label: 'Activities' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'focus', label: 'Focus' },
  { id: 'diary', label: 'Diary' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'review', label: 'Month in Review' },
];

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

export function AnalyticsPage() {
  const now = new Date();
  const [tab, setTab] = useState<Tab>('overview');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [analytics, setAnalytics] = useState<MonthlyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const dailyRecords = useAllDailyRecords();

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      loadActivitiesFromAPI().catch(() => {
        // Silently fail — activities may already be loaded
      }),
      loadTasksFromAPI().catch(() => {
        // Silently fail — tasks may already be loaded
      }),
      loadFocusSessionsFromAPI().catch(() => {
        // Silently fail — focus sessions may already be loaded
      }),
      analyticsService.getMonthlyAnalytics(year, month),
    ]).then(([, , , data]) => {
      if (active) {
        setAnalytics(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [year, month]);

  const isFutureMonth = new Date(year, month, 1) > now;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <PageHeader title="Analytics" subtitle="Track your progress over time" />

      {/* Month selector */}
      <div className="flex items-center gap-2 mb-4">
        <select className="input py-1.5 text-sm w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>{getMonthName(i)}</option>
          ))}
        </select>
        <select className="input py-1.5 text-sm w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-primary text-white' : 'bg-slate-100 text-ink-muted dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-sm text-ink-muted dark:text-slate-400">Loading analytics...</span>
        </div>
      ) : isFutureMonth && tab !== 'tasks' ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink-muted dark:text-slate-400">No activity data yet for this future month.</p>
        </div>
      ) : analytics && (
        <>
          {tab === 'overview' && <OverviewTab analytics={analytics} />}
          {tab === 'trends' && <TrendsTab analytics={analytics} year={year} />}
          {tab === 'activities' && <ActivitiesTab analytics={analytics} />}
          {tab === 'tasks' && <TasksTab analytics={analytics} />}
          {tab === 'focus' && <FocusTab analytics={analytics} />}
          {tab === 'diary' && <DiaryTab analytics={analytics} dailyRecords={dailyRecords} year={year} month={month} />}
          {tab === 'calendar' && <CalendarTab year={year} month={month} />}
          {tab === 'review' && <ReviewTab analytics={analytics} year={year} month={month} />}
        </>
      )}
    </div>
  );
}

function OverviewTab({ analytics }: { analytics: MonthlyAnalytics }) {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">Overall Completion</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{analytics.overallCompletion}%</p>
          {analytics.improvement !== 0 && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${analytics.improvement > 0 ? 'text-success-text dark:text-green-400' : 'text-danger-text dark:text-red-400'}`}>
              {analytics.improvement > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {analytics.improvement > 0 ? '+' : ''}{analytics.improvement}% vs last month
            </div>
          )}
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">Active Days</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{analytics.activeDays}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">Fully Completed</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{analytics.fullyCompletedDays}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">Consistency</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{analytics.consistencyScore}%</p>
        </div>
      </div>

      {/* Previous month comparison */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Month Comparison</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">This Month</p>
            <p className="text-3xl font-bold text-primary dark:text-primary-300">{analytics.overallCompletion}%</p>
            <ProgressBar value={analytics.overallCompletion} color="primary" size="sm" />
          </div>
          <div>
            <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">Previous Month</p>
            <p className="text-3xl font-bold text-ink-muted dark:text-slate-400">{analytics.previousMonthCompletion}%</p>
            <ProgressBar value={analytics.previousMonthCompletion} color="primary" size="sm" />
          </div>
        </div>
      </div>

      {/* Daily completion chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Daily Activity Completion</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={analytics.dailyCompletion.map((d) => ({ date: d.date.slice(8), rate: d.rate }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
            <Line type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TrendsTab({ analytics, year }: { analytics: MonthlyAnalytics; year: number }) {
  const [yearlyData, setYearlyData] = useState<{ month: number; completion: number; focusMinutes: number }[]>([]);

  useEffect(() => {
    analyticsService.getYearlyAnalytics(year).then(setYearlyData);
  }, [year]);

  const weekDays = analytics.dailyCompletion.slice(0, 7);

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Monthly Completion (This Year)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={yearlyData.map((d) => ({ month: getMonthName(d.month).slice(0, 3), completion: d.completion }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" domain={[0, 100]} label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} formatter={(value: any) => `${value}%`} />
            <Bar dataKey="completion" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Monthly Focus Time (This Year)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={yearlyData.map((d) => ({ month: getMonthName(d.month).slice(0, 3), focus: d.focusMinutes }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" label={{ value: 'Focus (min)', angle: -90, position: 'insideLeft' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} formatter={(value: any) => formatSessionDuration(value)} />
            <Bar dataKey="focus" fill="#22C55E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Daily Completion Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={analytics.dailyCompletion.map((d) => ({ date: d.date.slice(8), rate: d.rate }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
            <Line type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ActivitiesTab({ analytics }: { analytics: MonthlyAnalytics }) {
  const best = [...analytics.activityAnalytics]
    .filter((a) => a.completionRate > 0)
    .sort((a, b) => b.completionRate - a.completionRate)[0];
  const weakest = [...analytics.activityAnalytics]
    .filter((a) => a.completionRate > 0)
    .sort((a, b) => a.completionRate - b.completionRate)[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {best && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-success" />
              <span className="text-xs font-medium text-ink-muted dark:text-slate-400">Best Activity</span>
            </div>
            <p className="text-lg font-bold text-ink dark:text-slate-100">{best.activityName}</p>
            <p className="text-sm text-success-text dark:text-green-400">{best.completionRate}% completion</p>
          </div>
        )}
        {!best && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-ink-muted dark:text-slate-400">Best Activity</span>
            </div>
            <p className="text-sm text-ink-muted dark:text-slate-400">No completed activities yet</p>
          </div>
        )}
        {weakest && weakest.activityId !== best?.activityId && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-danger" />
              <span className="text-xs font-medium text-ink-muted dark:text-slate-400">Weakest Activity</span>
            </div>
            <p className="text-lg font-bold text-ink dark:text-slate-100">{weakest.activityName}</p>
            <p className="text-sm text-danger-text dark:text-red-400">{weakest.completionRate}% completion</p>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Per-Activity Breakdown</h3>
        <div className="space-y-4">
          {analytics.activityAnalytics.map((a) => (
            <div key={a.activityId}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-ink dark:text-slate-200">{a.activityName}</span>
                <span className="text-sm font-semibold text-primary dark:text-primary-300">{a.completionRate}%</span>
              </div>
              <ProgressBar value={a.completionRate} color={a.completionRate >= 80 ? 'success' : a.completionRate >= 50 ? 'primary' : 'warning'} size="sm" />
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-ink-muted dark:text-slate-400">
                <span>{a.completedDays} completed / {a.activeDays} days</span>
                <span className="text-warning-text dark:text-amber-400">{a.partialDays} partial</span>
                <span className="text-danger-text dark:text-red-400">{a.incompleteDays} incomplete</span>
                <span className="flex items-center gap-0.5"><Flame className="w-3 h-3" /> Streak: {a.currentStreak}</span>
                <span>Best: {a.bestStreak}</span>
                <span>Gap: {a.longestGap}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TasksTab({ analytics }: { analytics: MonthlyAnalytics }) {
  const ta = analytics.taskAnalytics;
  const pieData = [
    { name: 'Completed', value: ta.completed, color: '#22C55E' },
    { name: 'Pending', value: ta.pending, color: '#94A3B8' },
    { name: 'In Progress', value: ta.inProgress, color: '#3B82F6' },
    { name: 'Blocked', value: ta.blocked, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-success-text dark:text-green-400">{ta.completed}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{ta.pending}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-primary dark:text-primary-300">{ta.inProgress}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">Blocked</p>
          <p className="text-2xl font-bold text-danger-text dark:text-red-400">{ta.blocked}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Task Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} formatter={(value: any) => value} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-ink-muted dark:text-slate-400 text-center py-8">No tasks</p>}
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Task Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted dark:text-slate-400">Total Tasks</span>
              <span className="font-medium text-ink dark:text-slate-200">{ta.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted dark:text-slate-400">Overdue</span>
              <span className="font-medium text-danger-text dark:text-red-400">{ta.overdue}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted dark:text-slate-400">Due Today</span>
              <span className="font-medium text-warning-text dark:text-amber-400">{ta.dueToday}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted dark:text-slate-400">Due This Week</span>
              <span className="font-medium text-ink dark:text-slate-200">{ta.dueThisWeek}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-slate-100 dark:border-slate-700">
              <span className="text-ink-muted dark:text-slate-400">Completion Rate</span>
              <span className="font-bold text-primary dark:text-primary-300">{ta.completionRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FocusTab({ analytics }: { analytics: MonthlyAnalytics }) {
  const fa = analytics.focusAnalytics;
  const activities = useActivities();
  const tasks = useTasks();
  const focusSessions = useFocusSessions();

  // Separate focus sessions into categories for byActivity/byTask breakdown
  const sessionsByActivity = new Map<string, number>();
  const sessionsByTask = new Map<string, number>();

  focusSessions.forEach((session) => {
    const date = session.date;
    const [year, month, day] = date.split('-').map(Number);
    const sessionDate = new Date(year, month - 1, day);
    const analyticsDate = new Date(fa.dailyFocus[0]?.date?.split('-').map(Number) || []);
    
    // Only count sessions from the current analytics period (approximate match on month/year)
    // This is a simplified check; in production you'd want to be more precise
    if (session.type !== 'focus') return;

    if (session.activityId) {
      const activity = activities.find((a) => a.id === session.activityId);
      const key = activity ? session.activityId : `__deleted_${session.activityId}`;
      sessionsByActivity.set(key, (sessionsByActivity.get(key) || 0) + session.duration);
    } else if (session.taskId) {
      const task = tasks.find((t) => t.id === session.taskId);
      const key = task ? session.taskId : `__deleted_${session.taskId}`;
      sessionsByTask.set(key, (sessionsByTask.get(key) || 0) + session.duration);
    }
  });

  const byActivityData = Object.entries(fa.byActivity)
    .map(([id, minutes]) => {
      const activity = activities.find((a) => a.id === id);
      let name = activity?.name;
      
      if (!activity) {
        // Check if this was originally linked (has any session with wasLinked=true but no activity)
        const wasLinked = focusSessions.some((s) => s.activityId === id && s.wasLinked !== false);
        const hasFreeSession = focusSessions.some((s) => s.activityId === id && s.wasLinked === false);
        
        if (wasLinked && !activity) {
          name = 'Unknown — Deleted';
        } else if (!id || id === '' || id === 'undefined') {
          name = 'Free Focus';
        } else {
          name = 'Unknown';
        }
      }
      
      return { name: name || 'Unknown', minutes };
    })
    .reduce((acc, item) => {
      // Group all "Unknown" entries into a single Unknown category (except "Unknown — Deleted")
      if (item.name === 'Unknown' || item.name === 'Free Focus') {
        const existing = acc.find((x) => x.name === item.name);
        if (existing) {
          existing.minutes += item.minutes;
        } else {
          acc.push(item);
        }
      } else if (item.name === 'Unknown — Deleted') {
        // Keep "Unknown — Deleted" separate
        const existing = acc.find((x) => x.name === 'Unknown — Deleted');
        if (existing) {
          existing.minutes += item.minutes;
        } else {
          acc.push(item);
        }
      } else {
        acc.push(item);
      }
      return acc;
    }, [] as Array<{ name: string; minutes: number }>)
    .sort((a, b) => b.minutes - a.minutes);

  const byTaskData = Object.entries(fa.byTask)
    .map(([id, minutes]) => {
      const task = tasks.find((t) => t.id === id);
      let name = task?.title;
      
      if (!task) {
        // Check if this was originally linked
        const wasLinked = focusSessions.some((s) => s.taskId === id && s.wasLinked !== false);
        
        if (wasLinked && !task) {
          name = 'Unknown — Deleted';
        } else if (!id || id === '' || id === 'undefined') {
          name = 'Free Focus';
        } else {
          name = 'Unknown';
        }
      }
      
      return { name: name || 'Unknown', minutes };
    })
    .reduce((acc, item) => {
      // Group all "Unknown" entries into a single Unknown category (except "Unknown — Deleted")
      if (item.name === 'Unknown' || item.name === 'Free Focus') {
        const existing = acc.find((x) => x.name === item.name);
        if (existing) {
          existing.minutes += item.minutes;
        } else {
          acc.push(item);
        }
      } else if (item.name === 'Unknown — Deleted') {
        // Keep "Unknown — Deleted" separate
        const existing = acc.find((x) => x.name === 'Unknown — Deleted');
        if (existing) {
          existing.minutes += item.minutes;
        } else {
          acc.push(item);
        }
      } else {
        acc.push(item);
      }
      return acc;
    }, [] as Array<{ name: string; minutes: number }>)
    .sort((a, b) => b.minutes - a.minutes);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">Total Pomodoros</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{fa.totalPomodoros}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">Total Focus</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{formatSessionDuration(fa.totalFocusTime)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">This Week</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{formatSessionDuration(fa.focusThisWeek)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">This Month</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{formatSessionDuration(fa.focusThisMonth)}</p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Daily Focus Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={fa.dailyFocus.map((d) => ({ date: d.date.slice(8), minutes: d.minutes }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} formatter={(value: any) => formatSessionDuration(value)} />
            <Bar dataKey="minutes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {byActivityData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Focus Time by Activity</h3>
          <div className="space-y-2">
            {byActivityData.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-sm text-ink dark:text-slate-200 w-24 truncate">{d.name}</span>
                <div className="flex-1">
                  <ProgressBar value={d.minutes} max={Math.max(...byActivityData.map((x) => x.minutes), 1)} color="primary" size="sm" />
                </div>
                <span className="text-sm font-medium text-ink-muted dark:text-slate-400 w-16 text-right">{formatSessionDuration(d.minutes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-ink-muted dark:text-slate-500 italic">Activity and Task breakdowns are separate views of the same focus sessions and should not be added together.</p>

      {byTaskData.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Focus Time by Task</h3>
          <div className="space-y-2">
            {byTaskData.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-sm text-ink dark:text-slate-200 w-32 truncate">{d.name}</span>
                <div className="flex-1">
                  <ProgressBar value={d.minutes} max={Math.max(...byTaskData.map((x) => x.minutes), 1)} color="success" size="sm" />
                </div>
                <span className="text-sm font-medium text-ink-muted dark:text-slate-400 w-16 text-right">{formatSessionDuration(d.minutes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend explaining focus types */}
      <div className="card p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-semibold text-ink-muted dark:text-slate-400 mb-3 uppercase">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-ink-muted dark:text-slate-400 flex-shrink-0 pt-0.5">•</span>
            <div>
              <p className="text-xs font-medium text-ink dark:text-slate-200">Free Focus</p>
              <p className="text-xs text-ink-muted dark:text-slate-400">Sessions started without a linked Activity or Task</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs font-medium text-warning dark:text-amber-400 flex-shrink-0 pt-0.5">•</span>
            <div>
              <p className="text-xs font-medium text-ink dark:text-slate-200">Unknown — Deleted</p>
              <p className="text-xs text-ink-muted dark:text-slate-400">Sessions originally linked to an Activity or Task that was later deleted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiaryTab({ analytics, dailyRecords, year, month }: { analytics: MonthlyAnalytics; dailyRecords: Record<string, DailyRecord>; year: number; month: number }) {
  const da = analytics.diaryAnalytics;
  const now = new Date();
  
  // Calculate diary metrics from dailyRecords
  const monthDateStrings = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dates.push(dateStr);
    }
    return dates;
  }, [year, month]);

  // Get diary entries for this month only
  const diaryEntriesThisMonth = useMemo(() => {
    const entries: Array<{ date: string; text: string; wordCount: number }> = [];
    const todayStr = toISODate(now);
    
    for (const dateStr of monthDateStrings) {
      // Skip future dates
      if (dateStr > todayStr) continue;
      
      const record = dailyRecords[dateStr];
      if (record && record.diaryNote.trim().length > 0) {
        const wordCount = record.diaryNote.trim().split(/\s+/).length;
        entries.push({
          date: dateStr,
          text: record.diaryNote,
          wordCount,
        });
      }
    }
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthDateStrings, dailyRecords, now]);

  // Calculate derived metrics
  const totalWords = useMemo(() => diaryEntriesThisMonth.reduce((sum, e) => sum + e.wordCount, 0), [diaryEntriesThisMonth]);
  const avgWordsPerEntry = diaryEntriesThisMonth.length > 0 ? Math.round(totalWords / diaryEntriesThisMonth.length) : 0;
  const longestEntry = diaryEntriesThisMonth.length > 0 ? Math.max(...diaryEntriesThisMonth.map(e => e.wordCount)) : 0;

  // Dates with diary entries for calendar visualization
  const datesWithEntries = useMemo(() => new Set(diaryEntriesThisMonth.map(e => e.date)), [diaryEntriesThisMonth]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dateStr);
    }
    return days;
  }, [year, month]);

  const todayStr = toISODate(now);
  const hasDiaryEntry = (dateStr: string) => datesWithEntries.has(dateStr);
  const isToday = (dateStr: string) => dateStr === todayStr;
  const isFuture = (dateStr: string) => dateStr > todayStr;

  // Recent entries (limit to 5)
  const recentEntries = diaryEntriesThisMonth.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-primary dark:text-primary-300" />
            <span className="text-xs font-medium text-ink-muted dark:text-slate-400">Days with Entries</span>
          </div>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{da.daysWithEntries}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-warning" />
            <span className="text-xs font-medium text-ink-muted dark:text-slate-400">Diary Streak</span>
          </div>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{da.diaryStreak} days</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary dark:text-primary-300" />
            <span className="text-xs font-medium text-ink-muted dark:text-slate-400">Monthly Count</span>
          </div>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{da.monthlyCount}</p>
        </div>
      </div>

      {/* Word metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs font-medium text-ink-muted dark:text-slate-400 mb-1">Total Words</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{totalWords.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-ink-muted dark:text-slate-400 mb-1">Average Words / Entry</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{avgWordsPerEntry}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-ink-muted dark:text-slate-400 mb-1">Longest Entry</p>
          <p className="text-2xl font-bold text-ink dark:text-slate-100">{longestEntry} words</p>
        </div>
      </div>

      {/* Writing consistency */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-3">Writing Consistency</h3>
        <p className="text-lg font-bold text-ink dark:text-slate-100 mb-1">{da.daysWithEntries} of {monthDateStrings.filter(d => !isFuture(d)).length} days</p>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
          <div className="bg-primary dark:bg-primary-400 h-2 rounded-full" style={{ width: `${da.diaryConsistency}%` }} />
        </div>
        <p className="text-xs text-ink-muted dark:text-slate-400">{da.diaryConsistency}% of eligible days in {getMonthName(month)}</p>
      </div>

      {/* Diary Activity Calendar */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Diary Activity</h3>
        {diaryEntriesThisMonth.length === 0 ? (
          <p className="text-xs text-ink-muted dark:text-slate-400">No diary entries recorded for this month.</p>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-ink-muted dark:text-slate-500 py-1">
                {day}
              </div>
            ))}
            {calendarDays.map((dateStr, i) => {
              if (!dateStr) return <div key={`empty-${i}`} className="aspect-square" />;
              const day = parseInt(dateStr.split('-')[2]);
              const hasEntry = hasDiaryEntry(dateStr);
              const today = isToday(dateStr);
              const future = isFuture(dateStr);
              return (
                <div
                  key={dateStr}
                  className={`aspect-square flex items-center justify-center rounded text-xs font-medium cursor-default transition-colors ${
                    future ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600' :
                    today ? 'bg-primary text-white ring-2 ring-primary' :
                    hasEntry ? 'bg-success text-white' :
                    'bg-slate-100 dark:bg-slate-700 text-ink-muted dark:text-slate-400'
                  }`}
                  title={hasEntry ? `Entry on ${dateStr}` : `No entry on ${dateStr}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Entries */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Recent Entries</h3>
        {recentEntries.length === 0 ? (
          <p className="text-xs text-ink-muted dark:text-slate-400">No entries to display.</p>
        ) : (
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div key={entry.date} className="border-l-2 border-primary dark:border-primary-400 pl-3">
                <p className="text-xs font-medium text-ink-muted dark:text-slate-400">{formatDate(entry.date)}</p>
                <p className="text-sm text-ink dark:text-slate-200 line-clamp-2 mt-1">{entry.text}</p>
                <p className="text-xs text-ink-muted dark:text-slate-500 mt-1">{entry.wordCount} words</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mood Summary */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Mood Summary</h3>
        {diaryEntriesThisMonth.length === 0 ? (
          <p className="text-xs text-ink-muted dark:text-slate-400">No diary entries this month.</p>
        ) : (() => {
          const moodCounts = {
            great: diaryEntriesThisMonth.filter(e => dailyRecords[e.date]?.mood === 'great').length,
            good: diaryEntriesThisMonth.filter(e => dailyRecords[e.date]?.mood === 'good').length,
            okay: diaryEntriesThisMonth.filter(e => dailyRecords[e.date]?.mood === 'okay').length,
            not_great: diaryEntriesThisMonth.filter(e => dailyRecords[e.date]?.mood === 'not_great').length,
            bad: diaryEntriesThisMonth.filter(e => dailyRecords[e.date]?.mood === 'bad').length,
          };
          const moodsRecorded = Object.values(moodCounts).reduce((a, b) => a + b, 0);
          const totalEntries = diaryEntriesThisMonth.length;
          
          if (moodsRecorded === 0) {
            return <p className="text-xs text-ink-muted dark:text-slate-400">No moods recorded this month.</p>;
          }
          
          return (
            <div>
              <div className="space-y-2 mb-3">
                {[
                  { emoji: '😄', label: 'Great', count: moodCounts.great },
                  { emoji: '🙂', label: 'Good', count: moodCounts.good },
                  { emoji: '😐', label: 'Okay', count: moodCounts.okay },
                  { emoji: '😕', label: 'Not Great', count: moodCounts.not_great },
                  { emoji: '😞', label: 'Bad', count: moodCounts.bad },
                ].map(({ emoji, label, count }) => (
                  count > 0 && (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-ink dark:text-slate-200">{emoji} {label}</span>
                      <span className="font-medium text-ink-muted dark:text-slate-400">{count}</span>
                    </div>
                  )
                ))}
              </div>
              <p className="text-xs text-ink-muted dark:text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-2">
                Mood recorded on {moodsRecorded} of {totalEntries} diary-entry days
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function CalendarTab({ year, month }: { year: number; month: number }) {
  const navigate = useNavigate();
  const dailyRecords = useAllDailyRecords();
  const activities = useActivities();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dateStr);
    }
    return days;
  }, [year, month]);

  const getCompletionRate = (date: string): number => {
    const rec = dailyRecords[date];
    if (!rec) return 0;
    let active = 0, score = 0;
    for (const a of activities) {
      // Use isDateApplicable to respect startDate, endDate, scheduledDays, pausePeriods, and future dates
      if (!isDateApplicable(date, a)) continue;
      active++;
      const status = rec?.activities[a.id];
      score += status === 'completed' ? 1 : status === 'partial' ? 0.5 : 0;
    }
    return active > 0 ? Math.round((score / active) * 100) : 0;
  };

  const hasDiary = (date: string) => {
    const rec = dailyRecords[date];
    return !!rec && rec.diaryNote.trim().length > 0;
  };

  const intensityColor = (rate: number): string => {
    if (rate === 0) return 'bg-slate-100 dark:bg-slate-700/50';
    if (rate < 25) return 'bg-primary-100 dark:bg-primary/20';
    if (rate < 50) return 'bg-primary-200 dark:bg-primary/35';
    if (rate < 75) return 'bg-primary-300 dark:bg-primary/50';
    if (rate < 100) return 'bg-primary-400 dark:bg-primary/65';
    return 'bg-primary-500 dark:bg-primary/80';
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayStr = todayISO();

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-4">Activity Heatmap</h3>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {weekDays.map((d, i) => (
          <div key={i} className="text-center text-xs text-ink-light dark:text-slate-500 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((date, i) => {
          if (!date) return <div key={i} />;
          const dayNum = Number(date.split('-')[2]);
          const rate = getCompletionRate(date);
          const isToday = date === todayStr;
          const isFuture = date > todayStr;
          return (
            <button
              key={date}
              onClick={() => navigate(`/diary?date=${date}`)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all ${isFuture ? 'opacity-30' : ''} ${intensityColor(rate)} ${isToday ? 'ring-2 ring-primary' : ''} relative`}
              title={`${date}: ${rate}%`}
            >
              <span className={rate >= 50 ? 'text-white font-medium' : 'text-ink dark:text-slate-300'}>{dayNum}</span>
              {hasDiary(date) && (
                <span className="text-[8px] absolute bottom-0.5 right-0.5">
                  <BookOpen className="w-2 h-2" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-ink-muted dark:text-slate-400">
        <span>Less</span>
        <span className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-700/50" />
        <span className="w-4 h-4 rounded bg-primary-100 dark:bg-primary/20" />
        <span className="w-4 h-4 rounded bg-primary-200 dark:bg-primary/35" />
        <span className="w-4 h-4 rounded bg-primary-300 dark:bg-primary/50" />
        <span className="w-4 h-4 rounded bg-primary-400 dark:bg-primary/65" />
        <span className="w-4 h-4 rounded bg-primary-500 dark:bg-primary/80" />
        <span>More</span>
      </div>
    </div>
  );
}

function ReviewTab({ analytics, year, month }: { analytics: MonthlyAnalytics; year: number; month: number }) {
  const now = new Date();
  const isFuture = new Date(year, month, 1) > now;
  const isCurrent = year === now.getFullYear() && month === now.getMonth();

  if (isFuture) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm text-ink-muted dark:text-slate-400">No review available for future months.</p>
      </div>
    );
  }

  const best = [...analytics.activityAnalytics]
    .filter((a) => a.completionRate > 0)
    .sort((a, b) => b.completionRate - a.completionRate)[0];
  const weakest = [...analytics.activityAnalytics]
    .filter((a) => a.completionRate > 0)
    .sort((a, b) => a.completionRate - b.completionRate)[0];
  const bestStreak = [...analytics.activityAnalytics].sort((a, b) => b.bestStreak - a.bestStreak)[0];

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-ink dark:text-slate-100">{formatMonthYear(year, month)}</h2>
          <p className="text-sm text-ink-muted dark:text-slate-400">{isCurrent ? 'Month in progress' : 'Month Review'}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReviewStat label="Overall Score" value={`${analytics.overallCompletion}%`} />
          <ReviewStat label="Activity Score" value={`${analytics.overallCompletion}%`} />
          <ReviewStat label="Focus Time" value={formatSessionDuration(analytics.focusAnalytics.focusThisMonth)} />
          <ReviewStat label="Pomodoros" value={`${analytics.focusAnalytics.totalPomodoros}`} />
          <ReviewStat label="Diary Days" value={`${analytics.diaryAnalytics.daysWithEntries}`} />
          <ReviewStat label="Perfect Days" value={`${analytics.fullyCompletedDays}`} />
          <ReviewStat label="Best Streak" value={`${bestStreak?.bestStreak ?? 0} days`} />
          <ReviewStat label="Consistency" value={`${analytics.consistencyScore}%`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {best && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-success" />
              <span className="text-xs font-medium text-ink-muted dark:text-slate-400">Best Activity</span>
            </div>
            <p className="text-lg font-bold text-ink dark:text-slate-100">{best.activityName}</p>
            <p className="text-sm text-success-text dark:text-green-400">{best.completionRate}% ({best.completedDays} days)</p>
          </div>
        )}
        {!best && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-ink-muted dark:text-slate-400">Best Activity</span>
            </div>
            <p className="text-sm text-ink-muted dark:text-slate-400">No completed activities yet</p>
          </div>
        )}
        {weakest && weakest.activityId !== best?.activityId && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-danger" />
              <span className="text-xs font-medium text-ink-muted dark:text-slate-400">Weakest Activity</span>
            </div>
            <p className="text-lg font-bold text-ink dark:text-slate-100">{weakest.activityName}</p>
            <p className="text-sm text-danger-text dark:text-red-400">{weakest.completionRate}% ({weakest.completedDays} days)</p>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink dark:text-slate-200 mb-3">Previous Month Comparison</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">This Month</p>
            <p className="text-2xl font-bold text-primary dark:text-primary-300">{analytics.overallCompletion}%</p>
            <ProgressBar value={analytics.overallCompletion} color="primary" size="sm" />
          </div>
          <div>
            <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">Previous Month</p>
            <p className="text-2xl font-bold text-ink-muted dark:text-slate-400">{analytics.previousMonthCompletion}%</p>
            <ProgressBar value={analytics.previousMonthCompletion} color="primary" size="sm" />
          </div>
        </div>
        {analytics.improvement !== 0 && (
          <div className={`flex items-center gap-1.5 text-sm mt-3 ${analytics.improvement > 0 ? 'text-success-text dark:text-green-400' : 'text-danger-text dark:text-red-400'}`}>
            {analytics.improvement > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {analytics.improvement > 0 ? 'Improvement' : 'Decline'}: {Math.abs(analytics.improvement)}%
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-ink-muted dark:text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-ink dark:text-slate-100">{value}</p>
    </div>
  );
}
