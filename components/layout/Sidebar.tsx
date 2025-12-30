'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus, Bookmark, Receipt, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Overview of your activity, quick stats, and getting started guides',
  },
  {
    title: 'Create Transaction',
    href: '/create',
    icon: Plus,
    description: 'Build, simulate, and execute Move smart contract transactions visually',
  },
  {
    title: 'Saved Flows',
    href: '/flows',
    icon: Bookmark,
    description: 'Reusable transaction templates - save once, execute anytime',
  },
  {
    title: 'Receipts',
    href: '/receipts',
    icon: Receipt,
    description: 'Transaction history with full details, state changes, and explorer links',
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
            <Tooltip key={item.href} delayDuration={300}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
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
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 mt-0.5 text-blue-500 shrink-0" />
                  <p className="text-xs">{item.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">MoveFlow</p>
                <p className="text-[10px] text-muted-foreground">v0.1.0</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Visual Transaction Builder for Movement Blockchain</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground">Testnet Mode</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Connected to Movement Porto Testnet - transactions use test tokens</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}

