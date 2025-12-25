import { useState } from "react";
import { Check, X, ChevronRight, Clock, Fuel, Hash, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const receipts = [
  {
    id: "1",
    function: "increment",
    module: "0xabc::counter",
    timestamp: "2024-01-15 14:32:05",
    status: "success",
    gasUsed: "1,234",
    params: [],
    signer: "User Wallet",
    stateChanges: [
      { key: "counter.value", before: "4", after: "5" },
    ],
    txHash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
  },
  {
    id: "2",
    function: "deposit",
    module: "0xabc::vault",
    timestamp: "2024-01-15 12:15:22",
    status: "success",
    gasUsed: "2,456",
    params: [{ name: "amount", value: "100" }],
    signer: "User Wallet",
    stateChanges: [
      { key: "vault.balance", before: "500", after: "600" },
      { key: "user.balance", before: "1000", after: "900" },
    ],
    txHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
  },
  {
    id: "3",
    function: "transfer",
    module: "0xabc::vault",
    timestamp: "2024-01-14 18:45:33",
    status: "failed",
    gasUsed: "890",
    params: [
      { name: "to", value: "0x123...def" },
      { name: "amount", value: "5000" },
    ],
    signer: "Agent Signer",
    stateChanges: [],
    txHash: "0x9f8e7d6c5b4a3928170f1e2d3c4b5a6978685746352413029184756473829100",
    error: "Insufficient balance",
  },
];

export default function Receipts() {
  const [selectedReceipt, setSelectedReceipt] = useState<typeof receipts[0] | null>(null);

  if (selectedReceipt) {
    return (
      <div className="p-8 animate-fade-in">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2 -ml-2"
          onClick={() => setSelectedReceipt(null)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Receipts
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              {selectedReceipt.function}()
            </h1>
            <Badge variant="outline">
              {selectedReceipt.status === "success" ? (
                <><Check className="w-3 h-3 mr-1" /> Success</>
              ) : (
                <><X className="w-3 h-3 mr-1" /> Failed</>
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-sm">{selectedReceipt.module}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Timestamp
                </span>
                <span className="text-sm font-mono">{selectedReceipt.timestamp}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Fuel className="w-4 h-4" /> Gas Used
                </span>
                <span className="text-sm font-mono">{selectedReceipt.gasUsed} units</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Signer</span>
                <span className="text-sm">{selectedReceipt.signer}</span>
              </div>
              {selectedReceipt.params.map((param, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">{param.name}</span>
                  <span className="text-sm font-mono">{param.value}</span>
                </div>
              ))}
              <div className="pt-2">
                <span className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4" /> Transaction Hash
                </span>
                <code className="text-xs font-mono bg-code-bg px-3 py-2 rounded block break-all">
                  {selectedReceipt.txHash}
                </code>
              </div>
              {selectedReceipt.error && (
                <div className="p-3 rounded bg-destructive/10 border border-destructive/30">
                  <span className="text-sm text-destructive">{selectedReceipt.error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">State Changes</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedReceipt.stateChanges.length > 0 ? (
                <div className="space-y-2">
                  {selectedReceipt.stateChanges.map((change, i) => (
                    <div key={i} className="p-3 rounded-md bg-background font-mono text-sm flex items-center gap-2">
                      <span className="text-muted-foreground">{change.key}:</span>
                      <span className="px-2 py-0.5 rounded bg-diff-remove">{change.before}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="px-2 py-0.5 rounded bg-diff-add">{change.after}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No state changes recorded</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Receipts</h1>
        <p className="text-muted-foreground">Human-readable execution history</p>
      </div>

      <div className="space-y-3">
        {receipts.map((receipt, index) => (
          <Card 
            key={receipt.id} 
            className="border-border hover:border-muted-foreground/50 transition-all cursor-pointer group"
            onClick={() => setSelectedReceipt(receipt)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    receipt.status === "success" ? "bg-success" : "bg-destructive"
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{receipt.function}()</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {receipt.module}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {receipt.timestamp}
                      </span>
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3 h-3" />
                        {receipt.gasUsed} gas
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
