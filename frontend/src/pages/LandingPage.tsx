import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { LandingFooter } from '../components/layout/LandingFooter';

export function LandingPage() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark class exists on html element
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Listen for changes to the dark class
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      {/* Navigation */}
      <PublicNavbar />

      {/* Hero Section - Two Column Layout */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* LEFT: Content */}
          <div className="flex flex-col justify-center space-y-4 md:space-y-6">
            {/* MiraiThread Logo */}
            <div className="w-full max-w-sm mx-auto lg:mx-0">
              <img 
                src={isDark ? "/miraithread-logo-dark.png" : "/miraithread-logo-light.png"} 
                alt="MiraiThread" 
                className="w-full h-auto max-w-xs lg:max-w-sm"
              />
            </div>
            
            {/* Tagline and Description */}
            <div className="space-y-3 md:space-y-4">
              <p className="text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-400 font-medium">
                Mirai: Future • Thread: Connection
              </p>
              <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                Bring your tasks, activities, focus sessions, diary, and progress into one connected view of your life. Your future is built from intentional days.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2">
              <button
                onClick={() => navigate('/register')}
                className="btn-primary px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                Start Your Journey
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-secondary px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base font-semibold w-full sm:w-auto"
              >
                See How It Works
              </button>
            </div>
            
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-500">
              ✨ Free • Open source • No credit card required
            </p>
          </div>

          {/* RIGHT: Connected Thread Card */}
          <div className="flex items-center justify-center mt-6 lg:mt-0">
            <div className="card p-6 md:p-8 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 w-full max-w-md shadow-sm dark:shadow-lg">
              {/* Thread Diagram */}
              <div className="mb-6 flex justify-center overflow-hidden">
                <svg className="w-full h-12 md:h-12 max-w-xs" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="connectedThreadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  {/* Main connecting line with step pattern */}
                  <path d="M 10 25 L 35 25 L 35 15 L 60 15 L 60 25 L 85 25 L 85 15 L 110 15 L 110 25 L 135 25 L 135 15 L 160 15 L 160 25 L 190 25" 
                        stroke="url(#connectedThreadGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Node dots */}
                  <circle cx="10" cy="25" r="2.5" fill="#6366F1" />
                  <circle cx="60" cy="15" r="2.5" fill="#06B6D4" />
                  <circle cx="110" cy="25" r="2.5" fill="#06B6D4" />
                  <circle cx="160" cy="15" r="2.5" fill="#06B6D4" />
                  <circle cx="190" cy="25" r="2.5" fill="#06B6D4" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-center text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4 md:mb-6 font-medium tracking-wide">
                Your connected thread
              </h3>
              
              {/* Content Items */}
              <div className="space-y-2 md:space-y-3">
                {/* Tasks */}
                <div className="flex items-start gap-3 p-2 md:p-3 rounded-lg bg-slate-100 dark:bg-slate-700/40 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white">Tasks</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Turn intentions into action</div>
                  </div>
                </div>
                
                {/* Activities */}
                <div className="flex items-start gap-3 p-2 md:p-3 rounded-lg bg-slate-100 dark:bg-slate-700/40 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white">Activities</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Track what you actually did</div>
                  </div>
                </div>
                
                {/* Focus */}
                <div className="flex items-start gap-3 p-2 md:p-3 rounded-lg bg-slate-100 dark:bg-slate-700/40 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white">Focus</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Protect your attention</div>
                  </div>
                </div>
                
                {/* Diary & Mood */}
                <div className="flex items-start gap-3 p-2 md:p-3 rounded-lg bg-slate-100 dark:bg-slate-700/40 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-semibold text-slate-900 dark:text-white">Diary & Mood</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Reflect on your day</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why MiraiThread */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ink dark:text-slate-100 mb-3 md:mb-4">
            Why MiraiThread?
          </h2>
          <p className="text-base md:text-lg text-ink-muted dark:text-slate-400 max-w-3xl mx-auto px-4">
            Every task you complete, every activity you track, every focused session you spend, and every reflection you write becomes part of one continuous thread.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-2 items-center max-w-4xl mx-auto">
          {/* Today */}
          <div className="text-center px-2">
            <div className="text-xs md:text-sm font-semibold text-ink dark:text-slate-200 mb-1 md:mb-2">Today</div>
            <div className="text-xs text-ink-muted dark:text-slate-400">Your intentions</div>
          </div>

          {/* Thread line connector */}
          <div className="hidden md:flex justify-center">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full" />
          </div>

          {/* Tomorrow */}
          <div className="text-center px-2">
            <div className="text-xs md:text-sm font-semibold text-ink dark:text-slate-200 mb-1 md:mb-2">Tomorrow</div>
            <div className="text-xs text-ink-muted dark:text-slate-400">Your actions</div>
          </div>

          {/* Thread line connector */}
          <div className="hidden md:flex justify-center">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-full" />
          </div>

          {/* Your Future */}
          <div className="text-center px-2">
            <div className="text-xs md:text-sm font-semibold text-ink dark:text-slate-200 mb-1 md:mb-2">Your Future</div>
            <div className="text-xs text-ink-muted dark:text-slate-400">Your growth</div>
          </div>
        </div>

        <div className="text-center mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs md:text-sm text-ink-muted dark:text-slate-400 max-w-2xl mx-auto px-4">
            <span className="font-semibold text-ink dark:text-slate-200">Mirai</span> means "future" in Japanese. 
            <span className="font-semibold text-ink dark:text-slate-200"> Thread</span> represents the connection between the moments that shape it.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 scroll-mt-20">

        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2 md:mb-3">
            Features to Connect Your Days
          </h2>
        
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Feature: Activities */}
          <div className="card p-4 md:p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="w-10 md:w-12 h-10 md:h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3 md:mb-4">
              <Target className="w-5 md:w-6 h-5 md:h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-ink dark:text-slate-100 mb-2">Build Consistency</h3>
            <p className="text-xs md:text-sm text-ink-muted dark:text-slate-400">
              Track recurring activities and understand what you actually accomplished. See your streaks grow and patterns emerge.
            </p>
          </div>

          {/* Feature: Tasks */}
          <div className="card p-4 md:p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="w-10 md:w-12 h-10 md:h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3 md:mb-4">
              <ListChecks className="w-5 md:w-6 h-5 md:h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-ink dark:text-slate-100 mb-2">Turn Intentions into Work</h3>
            <p className="text-xs md:text-sm text-ink-muted dark:text-slate-400">
              Create tasks, set priorities, and track progress. Move between Kanban and list views as you work.
            </p>
          </div>

          {/* Feature: Focus */}
          <div className="card p-4 md:p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="w-10 md:w-12 h-10 md:h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-3 md:mb-4">
              <Clock className="w-5 md:w-6 h-5 md:h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-ink dark:text-slate-100 mb-2">Protect Your Attention</h3>
            <p className="text-xs md:text-sm text-ink-muted dark:text-slate-400">
              Pomodoro-style focus sessions with ambient sounds. Track where your intentional hours go.
            </p>
          </div>

          {/* Feature: Diary */}
          <div className="card p-4 md:p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="w-10 md:w-12 h-10 md:h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3 md:mb-4">
              <BookOpen className="w-5 md:w-6 h-5 md:h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-ink dark:text-slate-100 mb-2">Capture & Reflect</h3>
            <p className="text-xs md:text-sm text-ink-muted dark:text-slate-400">
              Write daily entries and record how each day felt. See your emotional journey over time.
            </p>
          </div>

          {/* Feature: Mood */}
          <div className="card p-4 md:p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="w-10 md:w-12 h-10 md:h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3 md:mb-4">
              <Users className="w-5 md:w-6 h-5 md:h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-ink dark:text-slate-100 mb-2">Understand Your Days</h3>
            <p className="text-xs md:text-sm text-ink-muted dark:text-slate-400">
              Track mood without reducing life to a score. See how your feelings connect to your actions.
            </p>
          </div>

          {/* Feature: Analytics */}
          <div className="card p-4 md:p-6 hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="w-10 md:w-12 h-10 md:h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-3 md:mb-4">
              <BarChart3 className="w-5 md:w-6 h-5 md:h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-ink dark:text-slate-100 mb-2">See the Pattern</h3>
            <p className="text-xs md:text-sm text-ink-muted dark:text-slate-400">
              Comprehensive analytics show trends across your days, revealing your progress and patterns.
            </p>
          </div>
        </div>
      </section>

            {/* Analytics Section */}
      <section id="analytics" className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Insight: Speed */}
          <div className="text-center">
            <div className="w-12 md:w-16 h-12 md:h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Zap className="w-6 md:w-8 h-6 md:h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-ink dark:text-slate-100 mb-2">Fast & Smooth</h3>
            <p className="text-xs md:text-sm text-ink-muted dark:text-slate-400">
              Built for speed. Real-time sync across your devices.
            </p>
          </div>

          {/* Insight: Security */}
          <div className="text-center">
            <div className="w-12 md:w-16 h-12 md:h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Shield className="w-6 md:w-8 h-6 md:h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-ink dark:text-slate-100 mb-2">Secure</h3>
            <p className="text-xs md:text-sm text-ink-muted dark:text-slate-400">
              Your data is encrypted and protected. You own it.
            </p>
          </div>

          {/* Insight: Free */}
          <div className="text-center">
            <div className="w-12 md:w-16 h-12 md:h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Smartphone className="w-6 md:w-8 h-6 md:h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-ink dark:text-slate-100 mb-2">Open & Free</h3>
            <p className="text-xs md:text-sm text-ink-muted dark:text-slate-400">
              No paywalls, no ads. Open source. Forever free.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 scroll-mt-20">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2 md:mb-3">
            How It Works
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            Four simple steps to building your thread
          </p>
        </div>

        {/* Decorative thread line above steps (desktop) */}
        <div className="hidden md:flex justify-center mb-8">
          <svg className="w-40 h-6" viewBox="0 0 160 24" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="threadGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.5 }} />
                <stop offset="50%" style={{ stopColor: '#6366F1', stopOpacity: 0.5 }} />
                <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 0.5 }} />
              </linearGradient>
            </defs>
            {/* Decorative thread */}
            <line x1="20" y1="12" x2="140" y2="12" stroke="url(#threadGrad1)" strokeWidth="2" strokeLinecap="round" />
            {/* Nodes */}
            <circle cx="20" cy="12" r="3.5" fill="#3B82F6" opacity="0.6" />
            <circle cx="140" cy="12" r="3.5" fill="#06B6D4" opacity="0.6" />
          </svg>
        </div>

        {/* Desktop: 4 equal columns with connecting thread */}
        <div className="hidden md:relative md:grid md:grid-cols-4 md:gap-6">
          {/* SVG thread connecting steps (positioned absolutely) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ top: '25px' }} viewBox="0 0 400 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="threadGradConnect" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.4 }} />
                <stop offset="50%" style={{ stopColor: '#6366F1', stopOpacity: 0.4 }} />
                <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 0.4 }} />
              </linearGradient>
            </defs>
            {/* Main connecting line */}
            <line x1="5%" y1="50%" x2="95%" y2="50%" stroke="url(#threadGradConnect)" strokeWidth="2" strokeLinecap="round" />
            {/* Node dots */}
            <circle cx="25%" cy="50%" r="3" fill="#3B82F6" opacity="0.5" />
            <circle cx="50%" cy="50%" r="3" fill="#6366F1" opacity="0.5" />
            <circle cx="75%" cy="50%" r="3" fill="#06B6D4" opacity="0.5" />
          </svg>

          {/* Step 1 */}
          <div className="text-center relative z-10">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mx-auto mb-3">
              01
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Plan</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Decide what matters today. Set your intentions.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center relative z-10">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mx-auto mb-3">
              02
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Focus</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Spend intentional time on what matters.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center relative z-10">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mx-auto mb-3">
              03
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Reflect</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Record what happened and how it felt.
            </p>
          </div>

          {/* Step 4 */}
          <div className="text-center relative z-10">
            <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm mx-auto mb-3">
              04
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Grow</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Use patterns to understand your progress.
            </p>
          </div>
        </div>

        {/* Decorative thread line below steps (desktop) */}
        <div className="hidden md:flex justify-center mt-8">
          <svg className="w-64 h-4" viewBox="0 0 260 16" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="threadGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.4 }} />
                <stop offset="33%" style={{ stopColor: '#6366F1', stopOpacity: 0.4 }} />
                <stop offset="66%" style={{ stopColor: '#06B6D4', stopOpacity: 0.4 }} />
                <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 0.4 }} />
              </linearGradient>
            </defs>
            {/* Decorative thread */}
            <line x1="15" y1="8" x2="245" y2="8" stroke="url(#threadGrad2)" strokeWidth="1.5" strokeLinecap="round" />
            {/* Node dots */}
            <circle cx="15" cy="8" r="2.5" fill="#3B82F6" opacity="0.6" />
            <circle cx="85" cy="8" r="2.5" fill="#6366F1" opacity="0.6" />
            <circle cx="175" cy="8" r="2.5" fill="#06B6D4" opacity="0.6" />
            <circle cx="245" cy="8" r="2.5" fill="#06B6D4" opacity="0.6" />
          </svg>
        </div>

        {/* Mobile: Stacked with vertical thread */}
        <div className="md:hidden space-y-6">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mx-auto mb-2">
              01
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Plan</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Decide what matters today. Set your intentions.
            </p>
          </div>

          {/* Vertical thread connector */}
          <div className="flex justify-center">
            <svg className="w-1 h-6" viewBox="0 0 4 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="threadGradMobile" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.4 }} />
                  <stop offset="100%" style={{ stopColor: '#6366F1', stopOpacity: 0.4 }} />
                </linearGradient>
              </defs>
              <line x1="2" y1="0" x2="2" y2="24" stroke="url(#threadGradMobile)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="2" cy="12" r="2" fill="#6366F1" opacity="0.5" />
            </svg>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mx-auto mb-2">
              02
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Focus</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Spend intentional time on what matters.
            </p>
          </div>

          {/* Vertical thread connector */}
          <div className="flex justify-center">
            <svg className="w-1 h-6" viewBox="0 0 4 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="threadGradMobile2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 0.4 }} />
                  <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 0.4 }} />
                </linearGradient>
              </defs>
              <line x1="2" y1="0" x2="2" y2="24" stroke="url(#threadGradMobile2)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="2" cy="12" r="2" fill="#06B6D4" opacity="0.5" />
            </svg>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm mx-auto mb-2">
              03
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Reflect</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Record what happened and how it felt.
            </p>
          </div>

          {/* Vertical thread connector */}
          <div className="flex justify-center">
            <svg className="w-1 h-6" viewBox="0 0 4 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="threadGradMobile3" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#06B6D4', stopOpacity: 0.4 }} />
                  <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 0.4 }} />
                </linearGradient>
              </defs>
              <line x1="2" y1="0" x2="2" y2="24" stroke="url(#threadGradMobile3)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="2" cy="12" r="2" fill="#06B6D4" opacity="0.5" />
            </svg>
          </div>

          {/* Step 4 */}
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm mx-auto mb-2">
              04
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Grow</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Use patterns to understand your progress.
            </p>
          </div>
        </div>
      </section>



      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 dark:from-indigo-700 dark:via-indigo-600 dark:to-cyan-600 rounded-2xl md:rounded-3xl p-6 md:p-12 lg:p-20 text-center">
          <div className="relative">
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
              Your future is built from ordinary days.
            </h2>
            <p className="text-base md:text-lg text-indigo-50 max-w-2xl mx-auto mb-6 md:mb-8 px-2">
              Connect your intentions to your actions. Track your focus. Reflect on your progress. Build your future intentionally.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="px-6 md:px-8 py-2.5 md:py-4 bg-white text-indigo-600 font-bold rounded-lg hover:bg-slate-100 transition-colors text-sm md:text-base"
              >
                Start Your Journey
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 md:px-8 py-2.5 md:py-4 bg-indigo-500/30 text-white font-bold rounded-lg border border-white/30 hover:bg-indigo-500/50 transition-colors text-sm md:text-base"
              >
                Already a user?
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
