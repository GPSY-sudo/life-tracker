import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileMenu } from './MobileMenu';
import { AppFooter } from './AppFooter';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface dark:bg-surface-dark">
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Authenticated Mobile Header with Hamburger + Logo + Branding */}
          <header className="md:hidden sticky top-0 z-30 bg-surface-card dark:bg-surface-dark-card border-b border-slate-200 dark:border-slate-700 px-2 sm:px-3 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
            <MobileMenu />
          </header>
          <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <AppFooter />
    </div>
  );
}
