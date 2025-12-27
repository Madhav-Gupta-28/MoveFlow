'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Code, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="p-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight mb-2">Saved Flows</h1>
                <p className="text-muted-foreground">Reusable transaction templates</p>
            </div>

            {savedFlows.length === 0 ? (
                <Card className="border-border border-dashed">
                    <CardContent className="p-12 text-center">
                        <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No saved flows yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create a transaction and save it as a reusable flow
                        </p>
                        <Link href="/create">
                            <Button variant="outline">Create Transaction</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {savedFlows.map((flow, index) => (
                        <Card
                            key={flow.id}
                            className="border-border hover:border-muted-foreground/50 transition-all"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3 flex-1">
                                        <div>
                                            <h3 className="font-semibold text-lg">{flow.name}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                Created {formatDate(flow.createdAt)}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {flow.module}
                                            </Badge>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {flow.function}()
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {flow.signerType === 'user' ? 'User Signer' : 'Agent Signer'}
                                            </Badge>
                                        </div>

                                        {Object.keys(flow.parameters).length > 0 && (
                                            <div className="flex flex-wrap gap-3 text-sm">
                                                {Object.entries(flow.parameters).map(([key, value]) => (
                                                    <span key={key} className="text-muted-foreground">
                                                        <span className="text-foreground font-medium">{key}</span>: {String(value)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => loadFlow(flow)}
                                    >
                                        <Play className="w-3 h-3" />
                                        Load Flow
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
