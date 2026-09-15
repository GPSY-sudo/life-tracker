import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/hooks/useToast';
import { useTheme } from '@/hooks/useAppData';
import { DashboardPage } from '@/pages/DashboardPage';
import { TodayPage } from '@/pages/TodayPage';
import { ActivityTrackerPage } from '@/pages/ActivityTrackerPage';
import { TasksPage } from '@/pages/TasksPage';
import { FocusPage } from '@/pages/FocusPage';
import { DiaryPage } from '@/pages/DiaryPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';

function ThemeApplier() {
  useTheme();
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ThemeApplier />
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/activities" element={<ActivityTrackerPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/focus" element={<FocusPage />} />
            <Route path="/diary" element={<DiaryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AppLayout>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
