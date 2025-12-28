'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText, Calendar, Zap, Hash, User, CheckCircle2,
    XCircle, ChevronRight, Trash2, Copy, Plus, ExternalLink, Expand
} from 'lucide-react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

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
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    useEffect(() => {
        // Load receipts from localStorage with error handling
        try {
            const stored = localStorage.getItem('transactionReceipts');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Validate that parsed data is an array and has valid structure
                if (Array.isArray(parsed)) {
                    // Filter out any invalid receipts (missing required fields)
                    const validReceipts = parsed.filter((r: any) =>
                        r &&
                        typeof r.id === 'string' &&
                        typeof r.timestamp === 'number' &&
                        typeof r.module === 'string' &&
                        typeof r.function === 'string' &&
                        typeof r.transactionHash === 'string'
                    );
                    setReceipts(validReceipts);
                    // Auto-select first receipt if available
                    if (validReceipts.length > 0 && !selectedReceipt) {
                        setSelectedReceipt(validReceipts[0]);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading receipts from localStorage:', error);
            // Clear corrupted data
            localStorage.removeItem('transactionReceipts');
        }
    }, []);

    const deleteReceipt = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const updated = receipts.filter(r => r.id !== id);
        setReceipts(updated);
        localStorage.setItem('transactionReceipts', JSON.stringify(updated));
        if (selectedReceipt?.id === id) {
            setSelectedReceipt(updated.length > 0 ? updated[0] : null);
        }
    };

    const clearAllReceipts = () => {
        setReceipts([]);
        setSelectedReceipt(null);
        localStorage.removeItem('transactionReceipts');
    };

    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFullDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const truncateHash = (hash: string) => {
        if (!hash) return 'N/A';
        return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
    };

    const getExplorerUrl = (hash: string) => {
        return `https://explorer.movementlabs.xyz/txn/${hash}?network=testnet`;
    };

    return (
        <>
            <div className="relative min-h-full overflow-hidden">
                {/* Background gradient orb */}
                <div className="hidden w-[400px] h-[400px] -top-32 -left-32 fixed" />

                <div className="relative p-8 animate-fade-in">
                    {/* Header */}
                    <div className="mb-8 flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">Transaction Receipts</h1>
                            <p className="text-muted-foreground max-w-md">
                                Human-readable history of all your executed transactions on Movement Testnet.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {receipts.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearAllReceipts}
                                    className="gap-2 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear All
                                </Button>
                            )}
                            <Link href="/create">
                                <Button size="sm" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    New Transaction
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    {receipts.length > 0 && (
                        <div className="flex items-center gap-6 mb-6 py-3 px-4 rounded-lg bg-card/50 border border-border">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold gradient-text">{receipts.length}</span>
                                <span className="text-sm text-muted-foreground">Total Receipts</span>
                            </div>
                            <div className="w-px h-6 bg-border" />
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-slate-8000" />
                                <span className="text-sm">{receipts.filter(r => r.status === 'success').length} Successful</span>
                            </div>
                            {receipts.filter(r => r.status === 'failed').length > 0 && (
                                <>
                                    <div className="w-px h-6 bg-border" />
                                    <div className="flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-sm">{receipts.filter(r => r.status === 'failed').length} Failed</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {receipts.length === 0 ? (
                        <div className="max-w-2xl mx-auto">
                            <Card className="border-dashed border-2">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-8000/20 to-cyan-500/20 flex items-center justify-center mb-6">
                                        <FileText className="w-10 h-10 text-teal-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3">No receipts yet</h3>
                                    <p className="text-muted-foreground mb-8 text-center max-w-sm">
                                        Execute your first transaction to see a human-readable receipt here.
                                        All receipts are stored locally in your browser.
                                    </p>
                                    <Link href="/create">
                                        <Button className="gap-2 bg-teal-500 hover:bg-teal-600 text-white">
                                            <Plus className="w-4 h-4" />
                                            Create Your First Transaction
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Understanding Receipts */}
                            <div className="mt-8 p-6 rounded-xl border border-teal-500/20 bg-slate-800/50">
                                <h4 className="font-semibold mb-4 text-teal-950">📋 What Are Transaction Receipts?</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Every executed transaction generates a receipt with important information to help you track and verify your operations.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="p-3 rounded-lg bg-slate-800/80 border border-border">
                                        <p className="font-medium mb-1">⛽ Gas Cost</p>
                                        <p className="text-xs text-muted-foreground">How much computation the transaction consumed</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/80 border border-border">
                                        <p className="font-medium mb-1">🔄 State Changes</p>
                                        <p className="text-xs text-muted-foreground">What data was created, modified, or deleted</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/80 border border-border">
                                        <p className="font-medium mb-1">📝 Parameters</p>
                                        <p className="text-xs text-muted-foreground">The exact values you passed to the function</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/80 border border-border">
                                        <p className="font-medium mb-1">🔗 Transaction Hash</p>
                                        <p className="text-xs text-muted-foreground">Unique ID to verify on chain explorers</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl">
                            {/* Receipts List */}
                            <div className="space-y-3">
                                {receipts.map((receipt, index) => (
                                    <Card
                                        key={receipt.id}
                                        className="transition-all hover:border-slate-8000/50 animate-fade-in group"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-medium">
                                                            {receipt.module.split('::').pop()}::{receipt.function}
                                                        </h3>
                                                        <Badge
                                                            className={`text-xs shrink-0 ${receipt.status === 'success'
                                                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
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
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {formatDate(receipt.timestamp)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Zap className="w-3.5 h-3.5" />
                                                            {receipt.gasUsed} gas
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Hash className="w-3 h-3" />
                                                        <span className="font-mono">
                                                            {receipt.transactionHash ? truncateHash(receipt.transactionHash) : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedReceipt(receipt);
                                                            setDetailsModalOpen(true);
                                                        }}
                                                        className="gap-2"
                                                    >
                                                        <Expand className="w-4 h-4" />
                                                        View Details
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => deleteReceipt(receipt.id, e)}
                                                        className="text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Receipt Details Modal */}
            <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-8000" />
                            Full Receipt Details
                        </DialogTitle>
                        <DialogDescription>
                            Complete transaction details with all values visible
                        </DialogDescription>
                    </DialogHeader>
                    {selectedReceipt && (
                        <div className="max-h-[65vh] overflow-y-auto space-y-6 pr-2">
                            {/* Basic Info */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-8000" />
                                    Transaction Info
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30">
                                        <span className="text-muted-foreground">Module</span>
                                        <span className="font-mono break-all">{selectedReceipt.module}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30">
                                        <span className="text-muted-foreground">Function</span>
                                        <span className="font-mono">{selectedReceipt.function}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30">
                                        <span className="text-muted-foreground">Signer</span>
                                        <span className="font-mono break-all">{selectedReceipt.signer}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30">
                                        <span className="text-muted-foreground">Transaction Hash</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono break-all flex-1">{selectedReceipt.transactionHash}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 shrink-0"
                                                onClick={() => copyToClipboard(selectedReceipt.transactionHash, 'modal-hash')}
                                            >
                                                <Copy className={`w-3.5 h-3.5 ${copiedField === 'modal-hash' ? 'text-slate-8000' : ''}`} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30">
                                            <span className="text-muted-foreground">Status</span>
                                            <Badge className={selectedReceipt.status === 'success'
                                                ? 'bg-slate-8000/10 text-slate-8000 w-fit'
                                                : 'bg-red-500/10 text-red-500 w-fit'
                                            }>
                                                {selectedReceipt.status}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30">
                                            <span className="text-muted-foreground">Gas Used</span>
                                            <span>{selectedReceipt.gasUsed} units</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Parameters */}
                            {Object.keys(selectedReceipt.parameters).length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                        Parameters
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries(selectedReceipt.parameters).map(([key, value]) => (
                                            <div key={key} className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30">
                                                <span className="text-sm text-muted-foreground">{key}</span>
                                                <span className="text-sm font-mono break-all">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* State Changes */}
                            {selectedReceipt.stateChanges && selectedReceipt.stateChanges.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-8000" />
                                        State Changes
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedReceipt.stateChanges.map((change, idx) => (
                                            <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2 overflow-hidden">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-sm font-medium break-all flex-1 min-w-0">{change.resourceType}</span>
                                                    <Badge className={`text-xs shrink-0 ${change.changeType === 'create' ? 'bg-slate-8000/10 text-slate-8000'
                                                        : change.changeType === 'delete' ? 'bg-red-500/10 text-red-500'
                                                            : 'bg-slate-8000/10 text-slate-8000'
                                                        }`}>
                                                        {change.changeType}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs space-y-2 overflow-hidden">
                                                    {change.fieldDiffs.map((diff, fIdx) => (
                                                        <div key={fIdx} className="space-y-1 p-2 rounded bg-background/50 overflow-hidden">
                                                            <span className="text-muted-foreground font-medium">{diff.field}:</span>
                                                            {diff.before && (
                                                                <div className="text-red-400 line-through break-all text-xs overflow-x-auto max-w-full">
                                                                    <code className="block whitespace-pre-wrap">{diff.before}</code>
                                                                </div>
                                                            )}
                                                            <div className="text-slate-8000 break-all text-xs overflow-x-auto max-w-full">
                                                                <code className="block whitespace-pre-wrap">{diff.after}</code>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex justify-end pt-2 border-t border-border">
                        <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Helper component for detail rows
function DetailRow({
    label,
    value,
    fullValue,
    mono,
    copyable,
    onCopy,
    copied
}: {
    label: string;
    value: string;
    fullValue?: string;
    mono?: boolean;
    copyable?: boolean;
    onCopy?: () => void;
    copied?: boolean;
}) {
    return (
        <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`text-sm ${mono ? 'font-mono' : ''}`} title={fullValue}>
                    {value}
                </span>
                {copyable && onCopy && (
                    <button onClick={onCopy} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Copy className={`w-3.5 h-3.5 ${copied ? 'text-slate-8000' : ''}`} />
                    </button>
                )}
            </div>
        </div>
    );
}
