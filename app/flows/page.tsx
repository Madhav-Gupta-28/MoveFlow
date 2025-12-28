'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Code, Clock, Trash2, Lightbulb, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface SavedFlow {
    id: string;
    name: string;
    module: string;
    function: string;
    parameters: Record<string, any>;
    signerType: 'user' | 'agent';
    createdAt: number;
}

export default function SavedFlows() {
    const router = useRouter();
    const [savedFlows, setSavedFlows] = useState<SavedFlow[]>([]);

    useEffect(() => {
        // Load saved flows from localStorage
        const stored = localStorage.getItem('savedFlows');
        if (stored) {
            setSavedFlows(JSON.parse(stored));
        }
    }, []);

    const loadFlow = (flow: SavedFlow) => {
        // Store the flow to be loaded
        localStorage.setItem('flowToLoad', JSON.stringify(flow));
        // Navigate to create page
        router.push('/create');
    };

    const deleteFlow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedFlows.filter(f => f.id !== id);
        setSavedFlows(updated);
        localStorage.setItem('savedFlows', JSON.stringify(updated));
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const truncateModule = (module: string) => {
        const parts = module.split('::');
        if (parts.length >= 2) {
            return `${parts[0].slice(0, 6)}...::${parts[1]}`;
        }
        return module;
    };

    return (
        <div className="relative min-h-full overflow-hidden">
            {/* Background gradient orb */}
            <div className="hidden w-[400px] h-[400px] -top-32 -right-32 fixed" />

            <div className="relative p-8 animate-fade-in">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Flows</h1>
                        <p className="text-muted-foreground max-w-md">
                            Reusable transaction templates. Save your frequently used configurations and load them with one click.
                        </p>
                    </div>
                    <Link href="/create">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            New Transaction
                        </Button>
                    </Link>
                </div>

                {savedFlows.length === 0 ? (
                    <div className="max-w-2xl mx-auto">
                        {/* Empty State */}
                        <Card className="border-dashed border-2">
                            <CardContent className="p-16 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6">
                                    <Code className="w-10 h-10 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">No saved flows yet</h3>
                                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                                    Create a transaction and save it as a reusable flow to speed up your workflow.
                                </p>
                                <Link href="/create">
                                    <Button className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Create Your First Transaction
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Tips Section */}
                        <div className="mt-8 p-6 rounded-xl border border-border bg-card/30">
                            <div className="flex items-start gap-3">
                                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium mb-2">Pro Tips</h4>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                        <li>• Save flows for transactions you execute frequently</li>
                                        <li>• Use descriptive names like "Daily USDC Transfer" or "Stake 100 APT"</li>
                                        <li>• Loading a flow pre-fills the form but doesn't auto-execute</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Flow Cards */}
                        <div className="space-y-4 mb-8">
                            {savedFlows.map((flow, index) => (
                                <Card
                                    key={flow.id}
                                    className="group border-border hover:border-muted-foreground/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.05)] animate-fade-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-4 flex-1 min-w-0">
                                                {/* Flow Name & Date */}
                                                <div>
                                                    <h3 className="font-semibold text-lg truncate">{flow.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                        <Clock className="w-3 h-3" />
                                                        Created {formatDate(flow.createdAt)}
                                                    </div>
                                                </div>

                                                {/* Badges */}
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                        {truncateModule(flow.module)}
                                                    </Badge>
                                                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-mono text-xs">
                                                        {flow.function}()
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {flow.signerType === 'user' ? '👤 User Signer' : '🤖 Agent Signer'}
                                                    </Badge>
                                                </div>

                                                {/* Parameters */}
                                                {Object.keys(flow.parameters).length > 0 && (
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                                        {Object.entries(flow.parameters).map(([key, value]) => (
                                                            <span key={key} className="text-muted-foreground">
                                                                <span className="text-foreground font-medium">{key}:</span>{' '}
                                                                <span className="font-mono">{String(value).slice(0, 20)}{String(value).length > 20 ? '...' : ''}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => deleteFlow(flow.id, e)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => loadFlow(flow)}
                                                >
                                                    <Play className="w-3 h-3" />
                                                    Load Flow
                                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Tips Section */}
                        <div className="p-5 rounded-xl border border-border bg-card/30">
                            <div className="flex items-start gap-3">
                                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium mb-1">How Flows Work</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Loading a flow pre-fills the transaction builder with saved values.
                                        You still need to simulate and execute manually – flows are templates, not automation.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
