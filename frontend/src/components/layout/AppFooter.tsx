export function AppFooter() {
  return (
    <footer className="bg-surface-card dark:bg-surface-dark-card border-t border-slate-200 dark:border-slate-700 py-4 sm:py-6 mt-8 md:mt-0 pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-2 sm:gap-4 text-xs sm:text-xs text-slate-600 dark:text-slate-400">
          {/* Left: Brand */}
          <div className="flex items-center gap-1.5 sm:gap-2 order-1 md:order-1">
            <img src="/miraithread-icon.png" alt="MiraiThread" className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">MiraiThread</span>
          </div>

          {/* Center: Tagline */}
          <p className="text-slate-600 dark:text-slate-400 text-xs order-2 md:order-2">
            Connect your days. Shape your future.
          </p>

          {/* Right: Copyright */}
          <p className="text-slate-500 dark:text-slate-500 text-xs order-3 md:order-3">
            © 2026 MiraiThread
          </p>
        </div>
      </div>
    </footer>
  );
}
