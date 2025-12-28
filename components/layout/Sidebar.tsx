'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus, Bookmark, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Create Transaction',
    href: '/create',
    icon: Plus,
  },
  {
    title: 'Saved Flows',
    href: '/flows',
    icon: Bookmark,
  },
  {
    title: 'Receipts',
    href: '/receipts',
    icon: Receipt,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-border bg-sidebar h-[calc(100vh-3.5rem)] flex flex-col">
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className="relative">
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                )}
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full gap-3 text-sm font-medium justify-start transition-all duration-200',
                    isActive && 'font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100',
                    !isActive && 'hover:bg-muted'
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-blue-600" : "text-muted-foreground"
                  )} />
                  {item.title}
                </Button>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">MoveFlow</p>
            <p className="text-[10px] text-muted-foreground">v0.1.0</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-[10px] text-muted-foreground">Testnet Mode</span>
        </div>
      </div>
    </aside>
  );
}
