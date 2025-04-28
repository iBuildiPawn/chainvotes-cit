'use client';
import { WalletConnect } from '@/components/ui/WalletConnect';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="h-screen w-64 bg-background border-r border-border flex flex-col fixed left-0 top-0">
      {/* Logo Section */}
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="p-1.5 bg-primary-500 rounded-full group-hover:bg-primary-400 transition-colors">
            <img className="h-7 w-7" src="/globe.svg" alt="Logo" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">
            Chain<span className="text-primary-500">Votes</span>
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
              pathname === '/dashboard'
                ? 'bg-primary-500/10 text-primary-500'
                : 'text-secondary-400 hover:bg-primary-500/5 hover:text-primary-500'
            }`}
          >
            <span>Dashboard</span>
          </Link>
        </div>
      </nav>

      {/* Wallet Connection */}
      <div className="p-4 border-t border-border">
        <WalletConnect />
      </div>
    </div>
  );
}