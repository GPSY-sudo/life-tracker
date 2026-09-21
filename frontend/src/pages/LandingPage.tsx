import { useNavigate } from 'react-router-dom';
import {
  Target,
  ListChecks,
  Clock,
  BookOpen,
  ArrowRight,
  Check,
  Smartphone,
  Zap,
  BarChart3,
  Users,
  Shield,
  Github,
  Twitter,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-ink dark:text-slate-100">Life Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="text-sm text-ink-muted dark:text-slate-400 hover:text-primary dark:hover:text-primary-300 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-ink-muted dark:text-slate-400 hover:text-primary dark:hover:text-primary-300 transition-colors"
            >
              How It Works
            </a>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-ink dark:text-slate-200 hover:text-primary dark:hover:text-primary-300 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary px-4 py-2 text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold text-ink dark:text-slate-100 leading-tight">
                Track Your Life,
                <br />
                <span className="bg-gradient-to-r from-primary to-blue-600 dark:from-primary-300 dark:to-blue-400 bg-clip-text text-transparent">
                  Master Your Goals
                </span>
              </h1>
              <p className="text-lg text-ink-muted dark:text-slate-400 max-w-md">
                All-in-one productivity system for activities, tasks, focus sessions, and personal reflection. Take control of your day.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/register')}
                className="btn-primary px-6 py-3 text-base font-semibold flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary px-6 py-3 text-base font-semibold"
              >
                Sign In
              </button>
            </div>

            <p className="text-sm text-ink-muted dark:text-slate-500">
              ✨ No credit card required • 100% free • Open source
            </p>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-600/10 dark:from-primary/20 dark:to-blue-600/20 rounded-2xl blur-3xl" />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-4">
                {/* Activity Summary Card */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-ink-muted dark:text-slate-400">Activities</p>
                    <p className="text-sm font-bold text-ink dark:text-slate-100">4 / 5 completed</p>
                  </div>
                </div>

                {/* Task Summary Card */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <ListChecks className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-ink-muted dark:text-slate-400">Tasks</p>
                    <p className="text-sm font-bold text-ink dark:text-slate-100">3 completed</p>
                  </div>
                </div>

                {/* Focus Summary Card */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-ink-muted dark:text-slate-400">Focus Time</p>
                    <p className="text-sm font-bold text-ink dark:text-slate-100">2h 15m today</p>
                  </div>
                </div>

                {/* Diary Summary Card */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-ink-muted dark:text-slate-400">Diary</p>
                    <p className="text-sm font-bold text-success dark:text-green-400">Today written ✓</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-ink dark:text-slate-100 mb-4">
            Everything You Need to Track Your Life
          </h2>
          <p className="text-lg text-ink-muted dark:text-slate-400 max-w-2xl mx-auto">
            Powerful features designed to help you build habits, complete tasks, maintain focus, and reflect on your progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature Card: Activities */}
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Activity Tracker</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400 mb-4">
              Track recurring habits and activities with daily status updates. Set custom schedules and pause periods.
            </p>
            <ul className="space-y-2 text-sm text-ink-muted dark:text-slate-400">
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>4-state tracking system</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Weekly schedules</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Streak analytics</span>
              </li>
            </ul>
          </div>

          {/* Feature Card: Tasks */}
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
              <ListChecks className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Task Manager</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400 mb-4">
              Create and organize tasks with priorities, due dates, and multiple views for maximum productivity.
            </p>
            <ul className="space-y-2 text-sm text-ink-muted dark:text-slate-400">
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Kanban & list views</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Priority levels</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Due date tracking</span>
              </li>
            </ul>
          </div>

          {/* Feature Card: Focus */}
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Focus Sessions</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400 mb-4">
              Pomodoro timer with configurable intervals. Track focus time and stay in the zone with ambient sounds.
            </p>
            <ul className="space-y-2 text-sm text-ink-muted dark:text-slate-400">
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Pomodoro technique</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Customizable timers</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Ambient sounds</span>
              </li>
            </ul>
          </div>

          {/* Feature Card: Diary */}
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Diary & Journaling</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400 mb-4">
              Daily journal entries with mood tracking. Reflect on your day and track your emotional journey.
            </p>
            <ul className="space-y-2 text-sm text-ink-muted dark:text-slate-400">
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Mood tracking</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Word count stats</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Calendar view</span>
              </li>
            </ul>
          </div>

          {/* Feature Card: Analytics */}
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Advanced Analytics</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400 mb-4">
              Comprehensive insights into your productivity patterns with beautiful visualizations and trends.
            </p>
            <ul className="space-y-2 text-sm text-ink-muted dark:text-slate-400">
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Completion trends</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Monthly reviews</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Streak tracking</span>
              </li>
            </ul>
          </div>

          {/* Feature Card: Responsive */}
          <div className="card p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Mobile Ready</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400 mb-4">
              Beautiful responsive design works perfectly on desktop, tablet, and mobile devices.
            </p>
            <ul className="space-y-2 text-sm text-ink-muted dark:text-slate-400">
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Mobile-first design</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Dark mode support</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Touch optimized</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 md:px-8 py-20 bg-white/50 dark:bg-slate-800/30 rounded-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-ink dark:text-slate-100 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-ink-muted dark:text-slate-400 max-w-2xl mx-auto">
            Simple workflow to manage your entire life in one place
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl mx-auto mb-4">
              1
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Create</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400">
              Add activities, tasks, and set your focus goals
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-slate-300 dark:text-slate-600" />
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl mx-auto mb-4">
              2
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Track</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400">
              Log daily activity status and complete tasks
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-slate-300 dark:text-slate-600" />
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl mx-auto mb-4">
              3
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Analyze</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400">
              Review analytics and improve your habits
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-slate-300 dark:text-slate-600" />
          </div>

          {/* Step 4 */}
          <div className="text-center md:col-start-4">
            <div className="w-16 h-16 rounded-full bg-success text-white flex items-center justify-center font-bold text-xl mx-auto mb-4">
              🎯
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Succeed</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400">
              Reach your goals and build lasting habits
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Benefit: Fast */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Lightning Fast</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400">
              Built with modern React and optimized performance. Sync across tabs instantly.
            </p>
          </div>

          {/* Benefit: Secure */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">100% Secure</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400">
              JWT-based authentication and encrypted password storage. Your data is safe.
            </p>
          </div>

          {/* Benefit: Free */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-ink dark:text-slate-100 mb-2">Totally Free</h3>
            <p className="text-sm text-ink-muted dark:text-slate-400">
              No paywalls, no ads, no surprises. Open source and free forever.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary to-blue-600 dark:from-primary dark:to-blue-500 rounded-2xl p-12 md:p-20 text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.03]" />
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Productivity?
            </h2>
            <p className="text-lg text-blue-50 max-w-2xl mx-auto mb-8">
              Join hundreds of users tracking their lives and achieving their goals with Life Tracker.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Create Free Account
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-blue-500/30 text-white font-semibold rounded-lg border border-blue-400/50 hover:bg-blue-500/50 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 border-t border-slate-800 mt-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white">Life Tracker</span>
              </div>
              <p className="text-sm">
                Track your life, master your goals.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-white mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-white mb-3">Follow Us</h4>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm">© 2026 Life Tracker. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0 text-sm">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
