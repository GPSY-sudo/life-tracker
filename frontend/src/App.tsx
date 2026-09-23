import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ToastProvider } from '@/hooks/useToast';
import { useTheme } from '@/hooks/useAppData';
import { useAuth } from '@/context/AuthContext';
import { AuthProvider } from '@/context/AuthContext';
import { DashboardPage } from '@/pages/DashboardPage';
import { TodayPage } from '@/pages/TodayPage';
import { ActivityTrackerPage } from '@/pages/ActivityTrackerPage';
import { TasksPage } from '@/pages/TasksPage';
import { FocusPage } from '@/pages/FocusPage';
import { DiaryPage } from '@/pages/DiaryPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { LandingPage } from '@/pages/LandingPage';

function ThemeApplier() {
  useTheme();
  return null;
}

function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes — no layout, no auth required */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Home route: Landing page for unauthenticated users, Dashboard for authenticated users */}
      <Route
        path="/"
        element={
          user ? (
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          ) : (
            <LandingPage />
          )
        }
      />

      {/* Protected routes — wrapped in AppLayout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/today" element={<TodayPage />} />
                <Route path="/activities" element={<ActivityTrackerPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/focus" element={<FocusPage />} />
                <Route path="/diary" element={<DiaryPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ToastProvider>
        <ThemeApplier />
        {/* AuthProvider must be inside BrowserRouter so it can call useNavigate */}
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
