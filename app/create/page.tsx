'use client';

import { useState, useMemo } from 'react';
import { Play, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const modules = [
    { value: '0xabc::counter', label: '0xabc::counter' },
    { value: '0xabc::vault', label: '0xabc::vault' },
    { value: '0xdef::token', label: '0xdef::token' },
];

const functionsByModule: Record<string, { name: string; params: { name: string; type: string }[] }[]> = {
    '0xabc::counter': [
        { name: 'increment', params: [] },
        { name: 'reset', params: [{ name: 'value', type: 'u64' }] },
        { name: 'get_value', params: [] },
    ],
    '0xabc::vault': [
        { name: 'deposit', params: [{ name: 'amount', type: 'u64' }] },
        { name: 'withdraw', params: [{ name: 'amount', type: 'u64' }, { name: 'recipient', type: 'address' }] },
        { name: 'transfer', params: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'u64' }] },
    ],
    '0xdef::token': [
        { name: 'mint', params: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'u64' }] },
        { name: 'burn', params: [{ name: 'amount', type: 'u64' }] },
    ],
};

// Transaction draft state type
interface TransactionDraft {
    module: string;
    function: string;
    parameters: Record<string, string>;
    signer: 'user' | 'agent';
}

// Transaction preview type
interface TransactionPreview {
    module: string;
    function: string;
    parameters: Array<{ name: string; value: string; type: string }>;
    signerDisplay: string;
}

export default function CreateTransaction() {
    // Single state object for all transaction builder inputs
    const [transactionDraft, setTransactionDraft] = useState<TransactionDraft>({
        module: '',
        function: '',
        parameters: {},
        signer: 'user',
    });
    const [simulated, setSimulated] = useState(false);

    const functions = transactionDraft.module ? functionsByModule[transactionDraft.module] || [] : [];
    const selectedFunctionData = functions.find((f) => f.name === transactionDraft.function);

    // Derived transaction preview - computed from transactionDraft
    const transactionPreview = useMemo<TransactionPreview>(() => {
        // Format parameters with their types
        const formattedParameters = selectedFunctionData?.params.map((param) => ({
            name: param.name,
            value: transactionDraft.parameters[param.name] || '—',
            type: param.type,
        })) || [];

        return {
            module: transactionDraft.module || '—',
            function: transactionDraft.function || '—',
            parameters: formattedParameters,
            signerDisplay: transactionDraft.signer === 'user' ? 'User Wallet' : 'Agent Signer',
        };
    }, [transactionDraft, selectedFunctionData]);

    // Update module and reset function when module changes
    const handleModuleChange = (module: string) => {
        setTransactionDraft({
            module,
            function: '',
            parameters: {},
            signer: transactionDraft.signer,
        });
    };

    // Update function
    const handleFunctionChange = (functionName: string) => {
        setTransactionDraft((prev) => ({
            ...prev,
            function: functionName,
            parameters: {}, // Reset parameters when function changes
        }));
    };

    // Update individual parameter
    const handleParamChange = (paramName: string, value: string) => {
        setTransactionDraft((prev) => ({
            ...prev,
            parameters: {
                ...prev.parameters,
                [paramName]: value,
            },
        }));
    };

    // Update signer
    const handleSignerChange = (signer: 'user' | 'agent') => {
        setTransactionDraft((prev) => ({
            ...prev,
            signer,
        }));
    };

    const handleSimulate = () => {
        setSimulated(true);
    };

    return (
        <div className="p-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight mb-2">Create Transaction</h1>
                <p className="text-muted-foreground">Build and simulate a Move transaction</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Transaction Builder */}
                <div className="space-y-6">
                    <Card className="border-border">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-accent text-xs font-mono flex items-center justify-center">1</span>
                                Select Module
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={transactionDraft.module} onValueChange={handleModuleChange}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Choose a module..." />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {modules.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            <span className="font-mono text-sm">{m.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-accent text-xs font-mono flex items-center justify-center">2</span>
                                Select Function
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={transactionDraft.function}
                                onValueChange={handleFunctionChange}
                                disabled={!transactionDraft.module}
                            >
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder={transactionDraft.module ? 'Choose a function...' : 'Select module first'} />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {functions.map((f) => (
                                        <SelectItem key={f.name} value={f.name}>
                                            <span className="font-mono text-sm">
                                                {f.name}({f.params.map(p => p.type).join(', ')})
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-accent text-xs font-mono flex items-center justify-center">3</span>
                                Parameters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedFunctionData?.params.length ? (
                                selectedFunctionData.params.map((param) => (
                                    <div key={param.name} className="space-y-2">
                                        <Label className="text-sm flex items-center gap-2">
                                            {param.name}
                                            <Badge variant="secondary" className="text-xs">{param.type}</Badge>
                                        </Label>
                                        <Input
                                            placeholder={`Enter ${param.type}...`}
                                            value={transactionDraft.parameters[param.name] || ''}
                                            onChange={(e) => handleParamChange(param.name, e.target.value)}
                                            className="font-mono bg-background"
                                        />
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    {transactionDraft.function ? 'No parameters required' : 'Select a function to see parameters'}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-accent text-xs font-mono flex items-center justify-center">4</span>
                                Signer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup value={transactionDraft.signer} onValueChange={handleSignerChange} className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <RadioGroupItem value="user" id="user" />
                                    <Label htmlFor="user" className="text-sm cursor-pointer">User Wallet</Label>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <RadioGroupItem value="agent" id="agent" />
                                    <Label htmlFor="agent" className="text-sm cursor-pointer">Agent Signer</Label>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>

                    <Button
                        variant="default"
                        size="lg"
                        className="w-full gap-2"
                        onClick={handleSimulate}
                        disabled={!transactionDraft.module || !transactionDraft.function}
                    >
                        <Play className="w-4 h-4" />
                        Simulate Transaction
                    </Button>
                </div>

                {/* Right Column: Preview & Results */}
                <div className="space-y-6">
                    {/* Transaction Preview */}
                    <Card className="border-border bg-card/50">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-medium">Transaction Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-border">
                                    <span className="text-sm text-muted-foreground">Module</span>
                                    <span className="font-mono text-sm">{transactionPreview.module}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border">
                                    <span className="text-sm text-muted-foreground">Function</span>
                                    <span className="font-mono text-sm">{transactionPreview.function}</span>
                                </div>
                                {transactionPreview.parameters.map((param) => (
                                    <div key={param.name} className="flex justify-between items-center py-2 border-b border-border">
                                        <span className="text-sm text-muted-foreground">{param.name}</span>
                                        <span className="font-mono text-sm">{param.value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-muted-foreground">Signer</span>
                                    <span className="text-sm">{transactionPreview.signerDisplay}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Simulation Result */}
                    {simulated && (
                        <>
                            <Card className="border-foreground/20 bg-secondary/30 animate-fade-in">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base font-medium flex items-center gap-2">
                                        Simulation Result
                                        <Badge variant="outline" className="gap-1">
                                            <Check className="w-3 h-3" />
                                            Successful
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-border">
                                        <span className="text-sm text-muted-foreground">Gas Estimate</span>
                                        <span className="font-mono text-sm">1,234 units</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-muted-foreground">Abort Reason</span>
                                        <span className="text-sm text-muted-foreground">None</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* State Diff Viewer */}
                            <Card className="border-border">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base font-medium">State Changes (Preview)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="p-3 rounded-md bg-background font-mono text-sm space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">counter.value:</span>
                                            <span className="px-2 py-0.5 rounded bg-diff-remove text-foreground">4</span>
                                            <span className="text-muted-foreground">→</span>
                                            <span className="px-2 py-0.5 rounded bg-diff-add text-foreground">5</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">balance:</span>
                                            <span className="px-2 py-0.5 rounded bg-diff-remove text-foreground">100</span>
                                            <span className="text-muted-foreground">→</span>
                                            <span className="px-2 py-0.5 rounded bg-diff-add text-foreground">95</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Execute Section */}
                            <Card className="border-border">
                                <CardContent className="p-6">
                                    <Button variant="default" size="lg" className="w-full gap-2 mb-3">
                                        <Zap className="w-4 h-4" />
                                        Execute on Movement Testnet
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground">
                                        Execution will generate a permanent on-chain receipt
                                    </p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
