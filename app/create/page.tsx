'use client';

import { useState, useMemo } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Play, Zap, Check, AlertCircle } from 'lucide-react';
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
    { value: '0x1::coin', label: '0x1::coin (Standard Coin Module)' },
    { value: '0x1::account', label: '0x1::account (Account Module)' },
    { value: '0x1::aptos_account', label: '0x1::aptos_account (Aptos Account)' },
];

const functionsByModule: Record<string, { name: string; params: { name: string; type: string }[] }[]> = {
    '0x1::coin': [
        { name: 'transfer', params: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'u64' }] },
        { name: 'balance', params: [{ name: 'owner', type: 'address' }] },
    ],
    '0x1::account': [
        { name: 'create_account', params: [{ name: 'new_address', type: 'address' }] },
        { name: 'exists_at', params: [{ name: 'addr', type: 'address' }] },
    ],
    '0x1::aptos_account': [
        { name: 'transfer', params: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'u64' }] },
        { name: 'create_account', params: [{ name: 'new_account', type: 'address' }] },
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


// Simulation result type
interface SimulationResult {
    success: boolean;
    gasUsed?: string;
    changes?: Array<{
        address: string;
        stateKeyHash: string;
        data: any;
    }>;
    vmStatus?: string;
    error?: string;
    // Decoded human-readable fields
    decoded?: {
        status: 'success' | 'abort' | 'error';
        abortReason: string | null;
        estimatedGas: {
            units: string;
            formatted: string;
        };
        events: Array<{
            type: string;
            data: any;
            sequenceNumber: string;
        }>;
        stateChanges: Array<{
            type: string;
            address: string;
            resource: string;
        }>;
    };
}

export default function CreateTransaction() {
    // Wallet connection state
    const { connected, account } = useWallet();

    // Single state object for all transaction builder inputs
    const [transactionDraft, setTransactionDraft] = useState<TransactionDraft>({
        module: '',
        function: '',
        parameters: {},
        signer: 'user',
    });

    // Simulation state
    const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationError, setSimulationError] = useState<string | null>(null);

    const functions = transactionDraft.module ? functionsByModule[transactionDraft.module] || [] : [];
    const selectedFunctionData = functions.find((f) => f.name === transactionDraft.function);

    // Helper to truncate address
    const truncateAddress = (address: string): string => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };


    // Derived transaction preview - computed from transactionDraft
    const transactionPreview = useMemo<TransactionPreview>(() => {
        // Format parameters with their types
        const formattedParameters = selectedFunctionData?.params.map((param) => ({
            name: param.name,
            value: transactionDraft.parameters[param.name] || '—',
            type: param.type,
        })) || [];

        // Determine signer display based on connection and selection
        let signerDisplay = 'Not Connected';
        if (transactionDraft.signer === 'user') {
            if (connected && account?.address) {
                signerDisplay = truncateAddress(account.address.toString());
            } else {
                signerDisplay = 'Connect Wallet';
            }
        } else {
            signerDisplay = 'Agent Signer';
        }

        return {
            module: transactionDraft.module || '—',
            function: transactionDraft.function || '—',
            parameters: formattedParameters,
            signerDisplay,
        };
    }, [transactionDraft, selectedFunctionData, connected, account]);

    // Derived decoded simulation result - transforms raw response to human-readable format
    const decodedSimulationResult = useMemo(() => {
        if (!simulationResult) return null;

        // Use decoded from API if available, otherwise build from raw
        if (simulationResult.decoded) {
            return simulationResult.decoded;
        }

        // Fallback: build decoded from raw fields
        return {
            status: simulationResult.success ? 'success' as const : 'abort' as const,
            abortReason: simulationResult.vmStatus && simulationResult.vmStatus !== 'Executed successfully'
                ? simulationResult.vmStatus
                : null,
            estimatedGas: {
                units: simulationResult.gasUsed || '0',
                formatted: simulationResult.gasUsed || '0',
            },
            events: [] as Array<{ type: string; data: any; sequenceNumber: string }>,
            stateChanges: [] as Array<{ type: string; address: string; resource: string }>,
        };
    }, [simulationResult]);

    // Update module and reset function when module changes
    const handleModuleChange = (module: string) => {
        setTransactionDraft({
            module,
            function: '',
            parameters: {},
            signer: transactionDraft.signer,
        });
        // Reset simulation when changing module
        setSimulationResult(null);
        setSimulationError(null);
    };

    // Update function
    const handleFunctionChange = (functionName: string) => {
        setTransactionDraft((prev) => ({
            ...prev,
            function: functionName,
            parameters: {}, // Reset parameters when function changes
        }));
        // Reset simulation when changing function
        setSimulationResult(null);
        setSimulationError(null);
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

    // Simulate transaction on Movement Testnet
    const handleSimulate = async () => {
        setIsSimulating(true);
        setSimulationError(null);
        setSimulationResult(null);

        try {
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transactionDraft),
            });

            const data = await response.json();

            // If we got decoded data, use it (even for errors)
            if (data.decoded) {
                setSimulationResult(data);
                return;
            }

            // Fallback for old-style errors without decoded data
            if (!response.ok || !data.success) {
                setSimulationError(data.error || 'Simulation failed');
                return;
            }

            setSimulationResult(data);
        } catch (error: any) {
            console.error('Simulation error:', error);
            setSimulationError(error.message || 'Failed to simulate transaction');
        } finally {
            setIsSimulating(false);
        }
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
                        disabled={!transactionDraft.module || !transactionDraft.function || isSimulating}
                    >
                        <Play className="w-4 h-4" />
                        {isSimulating ? 'Simulating...' : 'Simulate Transaction'}
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
                    {simulationError && (
                        <Card className="border-destructive/50 bg-destructive/10 animate-fade-in">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base font-medium flex items-center gap-2 text-destructive">
                                    Simulation Error
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-destructive">{simulationError}</p>
                            </CardContent>
                        </Card>
                    )}

                    {simulationResult && decodedSimulationResult && (
                        <>
                            <Card className={`border-foreground/20 animate-fade-in ${decodedSimulationResult.status === 'success' ? 'bg-secondary/30' : 'bg-destructive/10'}`}>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base font-medium flex items-center gap-2">
                                        Simulation Result
                                        <Badge variant="outline" className="gap-1">
                                            {decodedSimulationResult.status === 'success' ? (
                                                <>
                                                    <Check className="w-3 h-3" />
                                                    Success
                                                </>
                                            ) : (
                                                <>
                                                    ⚠️ Abort
                                                </>
                                            )}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Status */}
                                    <div className="flex justify-between items-center py-2 border-b border-border">
                                        <span className="text-sm text-muted-foreground">Status</span>
                                        <span className={`font-mono text-sm ${decodedSimulationResult.status === 'success' ? 'text-green-500' : 'text-destructive'}`}>
                                            {decodedSimulationResult.status.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Abort Reason */}
                                    {decodedSimulationResult.abortReason && (
                                        <div className="flex justify-between items-center py-2 border-b border-border">
                                            <span className="text-sm text-muted-foreground">Abort Reason</span>
                                            <span className="text-sm text-destructive max-w-[200px] truncate" title={decodedSimulationResult.abortReason}>
                                                {decodedSimulationResult.abortReason}
                                            </span>
                                        </div>
                                    )}

                                    {/* Estimated Gas */}
                                    <div className="flex justify-between items-center py-2 border-b border-border">
                                        <span className="text-sm text-muted-foreground">Estimated Gas</span>
                                        <span className="font-mono text-sm">
                                            {decodedSimulationResult.estimatedGas.formatted} units
                                            {decodedSimulationResult.estimatedGas.formatted !== decodedSimulationResult.estimatedGas.units && (
                                                <span className="text-muted-foreground ml-1">
                                                    ({decodedSimulationResult.estimatedGas.units})
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    {/* Emitted Events */}
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-muted-foreground">Emitted Events</span>
                                        <span className="font-mono text-sm">
                                            {decodedSimulationResult.events.length > 0
                                                ? `${decodedSimulationResult.events.length} event${decodedSimulationResult.events.length > 1 ? 's' : ''}`
                                                : 'None'
                                            }
                                        </span>
                                    </div>

                                    {/* Event details if any */}
                                    {decodedSimulationResult.events.length > 0 && (
                                        <div className="pt-2 border-t border-border space-y-2">
                                            <span className="text-xs text-muted-foreground font-medium">Event Details:</span>
                                            {decodedSimulationResult.events.slice(0, 3).map((event, idx) => (
                                                <div key={idx} className="text-xs font-mono bg-background/50 p-2 rounded">
                                                    <span className="text-muted-foreground">Type: </span>
                                                    <span className="text-foreground">{event.type}</span>
                                                </div>
                                            ))}
                                            {decodedSimulationResult.events.length > 3 && (
                                                <span className="text-xs text-muted-foreground">
                                                    +{decodedSimulationResult.events.length - 3} more events
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Raw error if present */}
                                    {simulationResult.error && (
                                        <div className="pt-2 border-t border-border">
                                            <span className="text-sm text-destructive">{simulationResult.error}</span>
                                        </div>
                                    )}
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
