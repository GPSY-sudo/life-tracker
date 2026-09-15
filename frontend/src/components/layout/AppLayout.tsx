import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileMenu } from './MobileMenu';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface dark:bg-surface-dark">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 bg-surface-card dark:bg-surface-dark-card border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center">
          <MobileMenu />
        </header>
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
