'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText, Calendar, Zap, Hash, User, CheckCircle2,
    XCircle, ChevronRight, Trash2
} from 'lucide-react';
import Link from 'next/link';

interface TransactionReceipt {
    id: string;
    timestamp: number;
    module: string;
    function: string;
    parameters: Record<string, any>;
    signer: string;
    transactionHash: string;
    gasUsed: string;
    status: 'success' | 'failed';
    stateChanges?: Array<{
        resourceType: string;
        address: string;
        changeType: 'write' | 'delete' | 'create';
        fieldDiffs: Array<{
            field: string;
            before: string | null;
            after: string | null;
        }>;
    }>;
}

export default function ReceiptsPage() {
    const [receipts, setReceipts] = useState<TransactionReceipt[]>([]);
    const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceipt | null>(null);

    useEffect(() => {
        // Load receipts from localStorage
        const stored = localStorage.getItem('transactionReceipts');
        if (stored) {
            setReceipts(JSON.parse(stored));
        }
    }, []);

    const deleteReceipt = (id: string) => {
        const updated = receipts.filter(r => r.id !== id);
        setReceipts(updated);
        localStorage.setItem('transactionReceipts', JSON.stringify(updated));
        if (selectedReceipt?.id === id) {
            setSelectedReceipt(null);
        }
    };

    const clearAllReceipts = () => {
        setReceipts([]);
        setSelectedReceipt(null);
        localStorage.removeItem('transactionReceipts');
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const truncateHash = (hash: string) => {
        return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
    };

    return (
        <div className="p-8 animate-fade-in">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Transaction Receipts</h1>
                    <p className="text-muted-foreground">View your transaction history on Movement Testnet</p>
                </div>
                {receipts.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllReceipts}
                        className="gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                    </Button>
                )}
            </div>

            {receipts.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No receipts yet</h3>
                        <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                            Execute transactions to see your receipts here. All receipts are stored locally in your browser.
                        </p>
                        <Link href="/create">
                            <Button>Create Transaction</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Receipts List */}
                    <div className="space-y-3">
                        {receipts.map((receipt) => (
                            <Card
                                key={receipt.id}
                                className={`cursor-pointer transition-all hover:border-primary/50 ${selectedReceipt?.id === receipt.id ? 'border-primary' : ''
                                    }`}
                                onClick={() => setSelectedReceipt(receipt)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium">
                                                    {receipt.module.split('::').pop()}::
                                                    {receipt.function}
                                                </h3>
                                                <Badge
                                                    className={`text-xs ${receipt.status === 'success'
                                                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        }`}
                                                >
                                                    {receipt.status === 'success' ? (
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    ) : (
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                    )}
                                                    {receipt.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(receipt.timestamp)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Zap className="w-3 h-3" />
                                                    {receipt.gasUsed} gas
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">Hash:</span>
                                        <span className="font-mono">{receipt.transactionHash ? truncateHash(receipt.transactionHash) : 'N/A'}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Receipt Details */}
                    {selectedReceipt && (
                        <div className="space-y-4 sticky top-8 h-fit">
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-medium">Receipt Details</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteReceipt(selectedReceipt.id)}
                                            className="gap-2 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Transaction Info */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-muted-foreground">Module</span>
                                            <span className="text-sm font-mono">{selectedReceipt.module}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-muted-foreground">Function</span>
                                            <span className="text-sm font-mono">{selectedReceipt.function}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                Signer
                                            </span>
                                            <span className="text-sm font-mono">{truncateHash(selectedReceipt.signer)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Zap className="w-3 h-3" />
                                                Gas Used
                                            </span>
                                            <span className="text-sm font-mono">{selectedReceipt.gasUsed}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Timestamp
                                            </span>
                                            <span className="text-sm">{formatDate(selectedReceipt.timestamp)}</span>
                                        </div>
                                    </div>

                                    {/* Parameters */}
                                    {Object.keys(selectedReceipt.parameters).length > 0 && (
                                        <div className="pt-2">
                                            <h4 className="font-medium text-sm mb-3">Parameters</h4>
                                            <div className="space-y-2">
                                                {Object.entries(selectedReceipt.parameters).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between items-center py-2 px-3 rounded bg-muted/30">
                                                        <span className="text-sm text-muted-foreground">{key}</span>
                                                        <span className="text-sm font-mono">{String(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Transaction Hash */}
                                    <div className="pt-2">
                                        <h4 className="font-medium text-sm mb-3 flex items-center gap-1">
                                            <Hash className="w-4 h-4" />
                                            Transaction Hash
                                        </h4>
                                        <div className="p-3 rounded bg-muted/30 break-all">
                                            <span className="text-xs font-mono">{selectedReceipt.transactionHash || 'Hash not available'}</span>
                                        </div>
                                    </div>

                                    {/* State Changes */}
                                    {selectedReceipt.stateChanges && selectedReceipt.stateChanges.length > 0 && (
                                        <div className="pt-2">
                                            <h4 className="font-medium text-sm mb-3">State Changes</h4>
                                            <div className="space-y-2">
                                                {selectedReceipt.stateChanges.map((change, idx) => (
                                                    <div key={idx} className="p-3 rounded-lg bg-muted/30 border space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium">
                                                                {change.resourceType.split('::').pop()}
                                                            </span>
                                                            <Badge className={`text-xs ${change.changeType === 'create'
                                                                ? 'bg-green-500/10 text-green-500'
                                                                : change.changeType === 'delete'
                                                                    ? 'bg-red-500/10 text-red-500'
                                                                    : 'bg-blue-500/10 text-blue-500'
                                                                }`}>
                                                                {change.changeType}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-xs space-y-1">
                                                            {change.fieldDiffs.map((diff, fIdx) => (
                                                                <div key={fIdx} className="flex items-center gap-2">
                                                                    <span className="text-muted-foreground">{diff.field}:</span>
                                                                    {diff.before && (
                                                                        <span className="text-red-500">{diff.before}</span>
                                                                    )}
                                                                    {diff.before && <span className="text-muted-foreground">→</span>}
                                                                    <span className="text-green-500">{diff.after}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
