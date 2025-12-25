'use client';

import { Play, Code, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const savedFlows = [
    {
        id: '1',
        name: 'Daily Counter Increment',
        module: '0xabc::counter',
        function: 'increment',
        params: [],
        createdAt: '2024-01-15',
    },
    {
        id: '2',
        name: 'Vault Deposit 100',
        module: '0xabc::vault',
        function: 'deposit',
        params: [{ name: 'amount', value: '100' }],
        createdAt: '2024-01-14',
    },
    {
        id: '3',
        name: 'Token Transfer',
        module: '0xdef::token',
        function: 'mint',
        params: [
            { name: 'to', value: '0x123...abc' },
            { name: 'amount', value: '1000' },
        ],
        createdAt: '2024-01-13',
    },
];

export default function SavedFlows() {
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
                        <Button variant="outline">Create Transaction</Button>
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
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-lg">{flow.name}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                Created {flow.createdAt}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="font-mono">
                                                {flow.module}
                                            </Badge>
                                            <Badge variant="outline" className="font-mono">
                                                {flow.function}()
                                            </Badge>
                                        </div>

                                        {flow.params.length > 0 && (
                                            <div className="flex flex-wrap gap-2 text-sm">
                                                {flow.params.map((param, i) => (
                                                    <span key={i} className="text-muted-foreground">
                                                        <span className="text-foreground">{param.name}</span>: {param.value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Button variant="default" size="sm" className="gap-2">
                                        <Play className="w-3 h-3" />
                                        Run Flow
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
