'use client';

import { Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WalletButton } from "@/components/wallet";

export function Topbar() {
  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-background"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="18" r="3" />
              <circle cx="12" cy="6" r="3" />
              <path d="M6 15V9a6 6 0 0 1 12 0v6" />
              <path d="M12 9v6" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight">MoveFlow</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge className="gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Movement Testnet
        </Badge>
        <WalletButton />
      </div>
    </header>
  );
}

