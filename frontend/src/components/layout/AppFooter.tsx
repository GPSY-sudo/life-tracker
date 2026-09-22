export function AppFooter() {
  return (
    <footer className="bg-surface-card dark:bg-surface-dark-card border-t border-slate-200 dark:border-slate-700 py-6 mt-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          {/* Left: Brand */}
          <div className="flex items-center gap-2">
            <img src="/miraithread-icon.png" alt="MiraiThread" className="h-5 w-5" />
            <span className="font-semibold text-slate-900 dark:text-white">MiraiThread</span>
          </div>

          {/* Center: Tagline */}
          <p className="text-slate-600 dark:text-slate-400">
            Connect your days. Shape your future.
          </p>

          {/* Right: Copyright */}
          <p className="text-slate-500 dark:text-slate-500">
            © 2026 MiraiThread
          </p>
        </div>
      </div>
    </footer>
  );
}
