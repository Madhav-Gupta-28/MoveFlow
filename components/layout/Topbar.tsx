import { Wifi, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
        <Badge variant="outline" className="gap-1.5 text-muted-foreground">
          <Wifi className="w-3 h-3" />
          Movement Testnet
        </Badge>
        <Badge variant="outline" className="gap-1.5">
          <Wallet className="w-3 h-3" />
          Wallet Connected
        </Badge>
      </div>
    </header>
  );
}
