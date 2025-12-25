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
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full gap-3 text-sm font-medium justify-start',
                  isActive && 'font-semibold bg-sidebar-accent'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          MoveFlow v0.1.0
        </p>
      </div>
    </aside>
  );
}
