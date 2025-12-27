'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Play, Zap, Check, AlertCircle, Code } from 'lucide-react';
import Link from 'next/link';
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
        stateDiffs?: Array<{
            resourceType: string;
            address: string;
            changeType: 'write' | 'delete' | 'create';
            fieldDiffs: Array<{
                field: string;
                before: string | null;
                after: string | null;
            }>;
        }>;
    };
}

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

export default function CreateTransaction() {
    // Wallet connection state
    const { connected, account, signAndSubmitTransaction } = useWallet();

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
    const [selectedStateDiff, setSelectedStateDiff] = useState<any | null>(null);

    // Execution state
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any | null>(null);
    const [executionError, setExecutionError] = useState<string | null>(null);

    const functions = transactionDraft.module ? functionsByModule[transactionDraft.module] || [] : [];
    const selectedFunctionData = functions.find((f) => f.name === transactionDraft.function);

    // Helper to truncate address
    const truncateAddress = (address: string): string => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Load flow from localStorage if flagged
    useEffect(() => {
        const flowToLoad = localStorage.getItem('flowToLoad');
        if (flowToLoad) {
            const flow = JSON.parse(flowToLoad);
            setTransactionDraft({
                module: flow.module,
                function: flow.function,
                parameters: flow.parameters,
                signer: flow.signerType,
            });
            // Clear the flag
            localStorage.removeItem('flowToLoad');
        }
    }, []);

    // Save flow state
    const [saveFlowDialogOpen, setSaveFlowDialogOpen] = useState(false);
    const [flowName, setFlowName] = useState('');
    const [saveFlowSuccess, setSaveFlowSuccess] = useState(false);

    // Save current transaction as a flow
    const saveFlow = () => {
        if (!transactionDraft.module || !transactionDraft.function) {
            alert('Please select a module and function before saving.');
            return;
        }
        setSaveFlowDialogOpen(true);
    };

    const confirmSaveFlow = () => {
        if (!flowName.trim()) return;

        const newFlow = {
            id: `flow_${Date.now()}`,
            name: flowName,
            module: transactionDraft.module,
            function: transactionDraft.function,
            parameters: transactionDraft.parameters,
            signerType: transactionDraft.signer,
            createdAt: Date.now(),
        };

        const existingFlows = JSON.parse(localStorage.getItem('savedFlows') || '[]');
        localStorage.setItem('savedFlows', JSON.stringify([newFlow, ...existingFlows]));

        setSaveFlowDialogOpen(false);
        setSaveFlowSuccess(true);
        setFlowName('');

        // Hide success message after 3 seconds
        setTimeout(() => setSaveFlowSuccess(false), 3000);
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
            const requestBody = {
                ...transactionDraft,
                publicKey: (connected && account?.publicKey) ? account.publicKey.toString() : undefined,
                signerAddress: (connected && account?.address) ? account.address.toString() : undefined
            };

            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
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

    // Execute transaction on Movement Testnet
    const handleExecute = async () => {
        if (!connected || !account) {
            setExecutionError('Please connect your wallet first');
            return;
        }

        if (!transactionDraft.module || !transactionDraft.function) {
            setExecutionError('Please select a module and function');
            return;
        }

        setIsExecuting(true);
        setExecutionError(null);
        setExecutionResult(null);

        try {
            // Build the same transaction payload as simulation
            const [moduleAddress, moduleName] = transactionDraft.module.split('::');
            const functionName = transactionDraft.function;

            // Convert parameters to proper types
            const functionArguments = Object.values(transactionDraft.parameters);

            // Sign and submit transaction
            const response = await signAndSubmitTransaction({
                data: {
                    function: `${moduleAddress}::${moduleName}::${functionName}`,
                    typeArguments: [],
                    functionArguments: functionArguments,
                }
            });

            console.log('Transaction submitted:', response);
            setExecutionResult(response);

            // Wait for transaction confirmation and fetch details
            const { Aptos, AptosConfig, Network } = await import('@aptos-labs/ts-sdk');
            const config = new AptosConfig({ network: Network.CUSTOM, fullnode: 'https://aptos.testnet.porto.movementlabs.xyz/v1' });
            const aptos = new Aptos(config);

            // Wait for transaction
            await aptos.waitForTransaction({ transactionHash: response.hash });

            //Fetch transaction details
            const txnDetails = await aptos.getTransactionByHash({ transactionHash: response.hash });

            // Create receipt
            const receipt: TransactionReceipt = {
                id: response.hash,
                timestamp: Date.now(),
                module: transactionDraft.module,
                function: transactionDraft.function,
                parameters: transactionDraft.parameters,
                signer: account.address.toString(),
                transactionHash: response.hash,
                gasUsed: (txnDetails as any).gas_used || '0',
                status: 'success',
                stateChanges: simulationResult?.decoded?.stateDiffs || [],
            };

            // Store in localStorage
            const existingReceipts = JSON.parse(localStorage.getItem('transactionReceipts') || '[]');
            localStorage.setItem('transactionReceipts', JSON.stringify([receipt, ...existingReceipts]));

            console.log('Receipt created:', receipt);
        } catch (error: any) {
            console.error('Execution error:', error);
            setExecutionError(error.message || 'Failed to execute transaction');
        } finally {
            setIsExecuting(false);
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

                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full gap-2"
                        onClick={saveFlow}
                        disabled={!transactionDraft.module || !transactionDraft.function}
                    >
                        <Code className="w-4 h-4" />
                        Save as Flow
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

                            {/* State Changes - Moved here for better visibility */}
                            {decodedSimulationResult.stateDiffs && decodedSimulationResult.stateDiffs.length > 0 && (
                                <Card className="border-border">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base font-medium">State Changes</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {decodedSimulationResult.stateDiffs.map((diff, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedStateDiff(diff)}
                                                className="p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/50 cursor-pointer transition-all space-y-2"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium text-sm truncate flex-1">
                                                        {diff.resourceType.split('::').pop()}
                                                    </div>
                                                    {diff.changeType === 'create' && (
                                                        <Badge className="bg-green-500/10 text-green-500 text-xs shrink-0">New</Badge>
                                                    )}
                                                    {diff.changeType === 'delete' && (
                                                        <Badge className="bg-red-500/10 text-red-500 text-xs shrink-0">Deleted</Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {diff.fieldDiffs.length} field{diff.fieldDiffs.length > 1 ? 's' : ''} changed
                                                </div>
                                            </div>
                                        ))}
                                        <div className="text-xs text-muted-foreground text-center pt-1">
                                            Click to view details
                                        </div>
                                    </CardContent>
                                </Card>
                            )}



                            {/* Execute Section */}
                            <Card className="border-border">
                                <CardContent className="p-6 space-y-4">
                                    <Button
                                        variant="default"
                                        size="lg"
                                        className="w-full gap-2"
                                        onClick={handleExecute}
                                        disabled={!connected || isExecuting || !transactionDraft.module || !transactionDraft.function}
                                    >
                                        {isExecuting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Executing...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-4 h-4" />
                                                Execute on Movement Testnet
                                            </>
                                        )}
                                    </Button>

                                    {executionError && (
                                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                            {executionError}
                                        </div>
                                    )}

                                    {executionResult && (
                                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-3">
                                            <div className="flex items-center gap-2 text-green-500">
                                                <Check className="w-5 h-5" />
                                                <span className="font-medium">Transaction Confirmed!</span>
                                            </div>
                                            <div className="text-sm space-y-1">
                                                <div className="font-mono text-xs break-all text-muted-foreground">
                                                    {executionResult.hash}
                                                </div>
                                            </div>
                                            <Link href="/receipts">
                                                <Button size="sm" className="w-full" variant="outline">
                                                    View Receipt →
                                                </Button>
                                            </Link>
                                        </div>
                                    )}

                                    <p className="text-xs text-center text-muted-foreground">
                                        Execution will generate a permanent on-chain receipt
                                    </p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>

            {/* State Diff Detail Modal */}
            <Dialog open={selectedStateDiff !== null} onOpenChange={(open) => !open && setSelectedStateDiff(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>State Change Details</DialogTitle>
                        <DialogDescription>
                            {selectedStateDiff && (
                                <span className="font-mono text-sm">
                                    {selectedStateDiff.resourceType}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedStateDiff && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b">
                                <span className="text-sm text-muted-foreground">Address:</span>
                                <span className="font-mono text-sm">{selectedStateDiff.address}</span>
                            </div>

                            <div className="space-y-3">
                                <div className="font-medium text-sm">Field Changes:</div>
                                {selectedStateDiff.fieldDiffs.map((field: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-lg bg-muted/30 border space-y-2">
                                        <div className="font-medium text-sm">{field.field}</div>
                                        <div className="space-y-1">
                                            {field.before !== null && (
                                                <div className="flex items-start gap-2">
                                                    <span className="text-xs text-muted-foreground min-w-[60px]">Before:</span>
                                                    <code className="flex-1 p-2 rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs overflow-x-auto">
                                                        {field.before}
                                                    </code>
                                                </div>
                                            )}
                                            <div className="flex items-start gap-2">
                                                <span className="text-xs text-muted-foreground min-w-[60px]">After:</span>
                                                <code className="flex-1 p-2 rounded bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs overflow-x-auto">
                                                    {field.after}
                                                </code>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Save Flow Dialog */}
            <Dialog open={saveFlowDialogOpen} onOpenChange={setSaveFlowDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save as Flow</DialogTitle>
                        <DialogDescription>
                            Save this transaction as a reusable template
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="flowName">Flow Name</Label>
                            <Input
                                id="flowName"
                                placeholder="e.g., Daily Counter Increment"
                                value={flowName}
                                onChange={(e) => setFlowName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && flowName.trim()) {
                                        confirmSaveFlow();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSaveFlowDialogOpen(false);
                                    setFlowName('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmSaveFlow}
                                disabled={!flowName.trim()}
                            >
                                Save Flow
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Notification */}
            {saveFlowSuccess && (
                <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
                    <Card className="border-green-500/50 bg-green-500/10">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Check className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="font-medium text-green-500">Flow Saved!</p>
                                <p className="text-sm text-muted-foreground">
                                    Your transaction template has been saved
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
