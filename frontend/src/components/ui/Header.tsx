'use client';

import { WalletConnect } from '@/components/ui/WalletConnect';
import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-1.5 bg-primary-500 rounded-full group-hover:bg-primary-400 transition-colors">
                <img className="h-7 w-7" src="/globe.svg" alt="Logo" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">
                Chain<span className="text-primary-500">Votes</span>
              </span>
            </Link>
            <div className="ml-12 hidden space-x-10 lg:block">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-base font-medium text-foreground hover:text-primary-500 transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <WalletConnect className="hidden md:flex" />
          </div>
        </div>
        {/* Mobile menu */}
        <div className="flex flex-wrap justify-between items-center py-4 lg:hidden">
          <Link
            href="/dashboard"
            className="text-base font-medium text-foreground hover:text-primary-500 transition-colors"
          >
            Dashboard
          </Link>
          <WalletConnect className="mt-4 md:hidden" />
        </div>
      </nav>
    </header>
  );
}