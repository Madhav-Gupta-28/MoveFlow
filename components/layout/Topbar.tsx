'use client';

import { Wifi, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WalletButton } from "@/components/wallet";

export function Topbar() {
  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6">
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 cursor-help">
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
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px]">
          <div className="space-y-1">
            <p className="font-medium text-sm">Visual Transaction Builder</p>
            <p className="text-xs text-muted-foreground">
              Build, simulate, and execute Move smart contract transactions without writing code
            </p>
          </div>
        </TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-4">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Badge className="gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 cursor-help">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Movement Testnet
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[280px]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium text-sm">Connected to Movement Porto Testnet</span>
              </div>
              <p className="text-xs text-muted-foreground">
                RPC: aptos.testnet.porto.movementlabs.xyz
              </p>
              <p className="text-xs text-yellow-600">
                ⚠️ Use test tokens only - not real funds
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
        <WalletButton />
      </div>
    </header>
  );
}
