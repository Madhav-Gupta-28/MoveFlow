/* eslint-disable @typescript-eslint/no-explicit-any */
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
    { value: '0x1::aptos_account', label: '0x1::aptos_account (Movement Account)' },
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

    // Mode toggle: 'builtin' or 'custom'
    const [contractMode, setContractMode] = useState<'builtin' | 'custom'>('builtin');

    // Single state object for all transaction builder inputs
    const [transactionDraft, setTransactionDraft] = useState<TransactionDraft>({
        module: '',
        function: '',
        parameters: {},
        signer: 'user',
    });

    // Custom contract state
    const [customContract, setCustomContract] = useState({
        moduleAddress: '',        // e.g., "0x1"
        moduleName: '',           // e.g., "coin"
        functionName: '',         // e.g., "transfer"
        typeArguments: '',        // e.g., "0x1::aptos_coin::AptosCoin"
        parameters: [] as { name: string; type: string; value: string }[],
    });

    // Add/remove custom parameters
    const addCustomParameter = () => {
        setCustomContract(prev => ({
            ...prev,
            parameters: [...prev.parameters, { name: `param${prev.parameters.length}`, type: 'address', value: '' }]
        }));
    };

    const removeCustomParameter = (index: number) => {
        setCustomContract(prev => ({
            ...prev,
            parameters: prev.parameters.filter((_, i) => i !== index)
        }));
    };

    const updateCustomParameter = (index: number, field: 'name' | 'type' | 'value', value: string) => {
        setCustomContract(prev => ({
            ...prev,
            parameters: prev.parameters.map((p, i) => i === index ? { ...p, [field]: value } : p)
        }));
    };

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

            // List of built-in modules
            const builtInModules = ['0x1::coin', '0x1::account', '0x1::aptos_account'];

            // Check if this is a custom contract flow
            const isCustomFlow = flow.isCustom === true || !builtInModules.includes(flow.module);

            if (isCustomFlow) {
                // Switch to custom mode
                setContractMode('custom');

                // If we have stored customContract data, use it directly
                if (flow.customContract) {
                    setCustomContract(flow.customContract);
                } else {
                    // Parse module string like "0xabc::mymodule" into address and name
                    const moduleParts = flow.module.split('::');
                    const moduleAddress = moduleParts[0] || '';
                    const moduleName = moduleParts.slice(1).join('::') || '';

                    // Convert parameters object to array format
                    const parametersArray = Object.entries(flow.parameters || {}).map(([name, value]) => ({
                        name,
                        type: 'string', // Default type since we don't have it stored
                        value: String(value),
                    }));

                    setCustomContract({
                        moduleAddress,
                        moduleName,
                        functionName: flow.function,
                        typeArguments: flow.typeArguments || '',
                        parameters: parametersArray,
                    });
                }
            } else {
                // Load as built-in flow
                setContractMode('builtin');
                setTransactionDraft({
                    module: flow.module,
                    function: flow.function,
                    parameters: flow.parameters,
                    signer: flow.signerType,
                });
            }

            // Clear the flag
            localStorage.removeItem('flowToLoad');
        }
    }, []);

    // Save flow state
    const [saveFlowDialogOpen, setSaveFlowDialogOpen] = useState(false);
    const [flowName, setFlowName] = useState('');
    const [saveFlowSuccess, setSaveFlowSuccess] = useState(false);

    // Events modal state
    const [eventsModalOpen, setEventsModalOpen] = useState(false);

    // Save current transaction as a flow
    const saveFlow = () => {
        if (!transactionDraft.module || !transactionDraft.function) {
            alert('Please select a module and function before saving.');
            return;
        }
        setSaveFlowDialogOpen(true);
    };

    // Save custom contract as a flow
    const saveCustomFlow = () => {
        if (!customContract.moduleAddress || !customContract.moduleName || !customContract.functionName) {
            alert('Please fill in the contract details before saving.');
            return;
        }
        setSaveFlowDialogOpen(true);
    };

    const confirmSaveFlow = () => {
        if (!flowName.trim()) return;

        let newFlow;
        if (contractMode === 'custom') {
            // Save custom contract flow
            newFlow = {
                id: `flow_${Date.now()}`,
                name: flowName,
                module: `${customContract.moduleAddress}::${customContract.moduleName}`,
                function: customContract.functionName,
                parameters: customContract.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {}),
                typeArguments: customContract.typeArguments,
                isCustom: true,
                customContract: customContract, // Store full custom contract for reload
                createdAt: Date.now(),
            };
        } else {
            // Save built-in flow
            newFlow = {
                id: `flow_${Date.now()}`,
                name: flowName,
                module: transactionDraft.module,
                function: transactionDraft.function,
                parameters: transactionDraft.parameters,
                signerType: transactionDraft.signer,
                createdAt: Date.now(),
            };
        }

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

    // Simulate custom transaction
    const handleCustomSimulate = async () => {
        setIsSimulating(true);
        setSimulationError(null);
        setSimulationResult(null);

        try {
            // Parse parameters
            const formattedParams: Record<string, any> = {};
            customContract.parameters.forEach(p => {
                if (p.value) {
                    formattedParams[p.name] = p.type === 'u64' || p.type === 'u128' ? Number(p.value) : p.value;
                }
            });

            // Construct full function identifier
            const fullFunction = `${customContract.moduleAddress}::${customContract.moduleName}::${customContract.functionName}`;

            // Parse type arguments
            const typeArguments = customContract.typeArguments
                ? customContract.typeArguments.split(',').map(t => t.trim()).filter(Boolean)
                : [];

            const requestBody = {
                module: `${customContract.moduleAddress}::${customContract.moduleName}`,
                function: customContract.functionName,
                parameters: formattedParams,
                typeArguments, // Pass type arguments if API supports it
                signer: 'user', // Default to user signer for custom
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
    // Execute transaction on Movement Testnet
    const handleExecute = async () => {
        if (!connected || !account) {
            setExecutionError('Please connect your wallet first');
            return;
        }

        const isCustom = contractMode === 'custom';
        const moduleStr = isCustom ? `${customContract.moduleAddress}::${customContract.moduleName}` : transactionDraft.module;
        const functionStr = isCustom ? customContract.functionName : transactionDraft.function;

        if (!moduleStr || !functionStr) {
            setExecutionError('Please select a module and function');
            return;
        }

        setIsExecuting(true);
        setExecutionError(null);
        setExecutionResult(null);

        try {
            // Build transaction payload
            let functionId = '';
            let typeArgs: string[] = [];
            let args: any[] = [];

            if (isCustom) {
                functionId = `${moduleStr}::${functionStr}`;
                typeArgs = customContract.typeArguments
                    ? customContract.typeArguments.split(',').map(t => t.trim()).filter(Boolean)
                    : [];

                // Parse custom parameters
                args = customContract.parameters.map(p => {
                    if (p.type === 'u64' || p.type === 'u128') return Number(p.value);
                    return p.value;
                });
            } else {
                // Built-in mode
                const [addr, mod] = transactionDraft.module.split('::');
                functionId = `${addr}::${mod}::${transactionDraft.function}`;
                args = Object.values(transactionDraft.parameters);
            }

            // Sign and submit transaction
            const response = await signAndSubmitTransaction({
                data: {
                    function: functionId as any, // Cast to any to satisfy specific string template type
                    typeArguments: typeArgs,
                    functionArguments: args,
                }
            });

            console.log('Transaction submitted:', response);
            setExecutionResult(response);

            // Create receipt immediately (before waiting for confirmation)
            const receipt: TransactionReceipt = {
                id: response.hash,
                timestamp: Date.now(),
                module: moduleStr,
                function: functionStr,
                parameters: isCustom
                    ? customContract.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {})
                    : transactionDraft.parameters,
                signer: account.address.toString(),
                transactionHash: response.hash,
                gasUsed: simulationResult?.gasUsed?.toString() || '0', // Use simulation gas as fallback
                status: 'success',
                stateChanges: simulationResult?.decoded?.stateDiffs || [],
            };

            // Try to get actual gas used (may fail due to CORS)
            try {
                const { Aptos, AptosConfig, Network } = await import('@aptos-labs/ts-sdk');
                const config = new AptosConfig({ network: Network.CUSTOM, fullnode: 'https://aptos.testnet.porto.movementlabs.xyz/v1' });
                const aptos = new Aptos(config);

                // Wait for transaction
                await aptos.waitForTransaction({ transactionHash: response.hash });

                //Fetch transaction details to get actual gas
                const txnDetails = await aptos.getTransactionByHash({ transactionHash: response.hash });
                console.log('Transaction details fetched:', txnDetails);
                receipt.gasUsed = String((txnDetails as any).gas_used || receipt.gasUsed);
            } catch (fetchError) {
                console.warn('Could not fetch transaction details (CORS). Using simulated gas value:', fetchError);
                // Receipt still gets saved with simulated gas value
            }

            // Store in localStorage
            const existingReceipts = JSON.parse(localStorage.getItem('transactionReceipts') || '[]');
            localStorage.setItem('transactionReceipts', JSON.stringify([receipt, ...existingReceipts]));

            console.log('✅ Receipt created and saved:', receipt);
            console.log('Total receipts in storage:', existingReceipts.length + 1);
        } catch (error: any) {
            console.error('Execution error:', error);
            setExecutionError(error.message || 'Failed to execute transaction');
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="relative min-h-full overflow-hidden">
            {/* Background gradient orbs */}
            <div className="hidden w-[500px] h-[500px] -top-48 -right-48 fixed" />
            <div className="hidden w-[300px] h-[300px] bottom-0 -left-32 fixed" />

            <div className="relative p-8 animate-fade-in">
                {/* Header with Step Indicator */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Create Transaction</h1>
                    <p className="text-muted-foreground mb-6">Build, simulate, and execute Move transactions on Movement Testnet</p>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-card/50 border border-border">
                        <StepIndicator
                            step={1}
                            label="Select Module"
                            active={!transactionDraft.module}
                            completed={!!transactionDraft.module}
                        />
                        <div className="flex-1 h-px bg-border" />
                        <StepIndicator
                            step={2}
                            label="Configure"
                            active={!!transactionDraft.module && !transactionDraft.function}
                            completed={!!transactionDraft.function}
                        />
                        <div className="flex-1 h-px bg-border" />
                        <StepIndicator
                            step={3}
                            label="Simulate"
                            active={!!transactionDraft.function && !simulationResult}
                            completed={!!simulationResult}
                        />
                        <div className="flex-1 h-px bg-border" />
                        <StepIndicator
                            step={4}
                            label="Execute"
                            active={!!simulationResult && !executionResult}
                            completed={!!executionResult}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Transaction Builder */}
                    <div className="space-y-6">
                        {/* Mode Toggle */}
                        <div className="flex rounded-lg bg-muted p-1">
                            <button
                                onClick={() => setContractMode('builtin')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${contractMode === 'builtin'
                                    ? 'bg-white text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Built-in Contracts
                            </button>
                            <button
                                onClick={() => setContractMode('custom')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${contractMode === 'custom'
                                    ? 'bg-white text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Custom Contract
                            </button>
                        </div>

                        {contractMode === 'custom' ? (
                            /* Custom Contract Form */
                            <>
                                <Card className="border-border">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-mono flex items-center justify-center">1</span>
                                            Contract Address
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Enter the deployed contract&apos;s module address and name (e.g., 0x1::coin)
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm">Module Address</Label>
                                            <Input
                                                placeholder="0x1 or 0xabc123..."
                                                value={customContract.moduleAddress}
                                                onChange={(e) => setCustomContract(prev => ({ ...prev, moduleAddress: e.target.value }))}
                                                className="font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm">Module Name</Label>
                                            <Input
                                                placeholder="coin, account, my_module..."
                                                value={customContract.moduleName}
                                                onChange={(e) => setCustomContract(prev => ({ ...prev, moduleName: e.target.value }))}
                                                className="font-mono"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-border">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-mono flex items-center justify-center">2</span>
                                            Function
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Enter the function name and optional type arguments
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm">Function Name</Label>
                                            <Input
                                                placeholder="transfer, mint, create_account..."
                                                value={customContract.functionName}
                                                onChange={(e) => setCustomContract(prev => ({ ...prev, functionName: e.target.value }))}
                                                className="font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm">Type Arguments (optional)</Label>
                                            <Input
                                                placeholder="0x1::aptos_coin::AptosCoin"
                                                value={customContract.typeArguments}
                                                onChange={(e) => setCustomContract(prev => ({ ...prev, typeArguments: e.target.value }))}
                                                className="font-mono text-sm"
                                            />
                                            <p className="text-xs text-muted-foreground">Comma-separated for multiple types</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-border">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-mono flex items-center justify-center">3</span>
                                            Parameters
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Add function parameters with their types and values
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {customContract.parameters.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                                                No parameters added yet. Click below to add one.
                                            </p>
                                        ) : (
                                            customContract.parameters.map((param, index) => (
                                                <div key={index} className="flex gap-2 items-end">
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-xs">Name</Label>
                                                        <Input
                                                            placeholder="to"
                                                            value={param.name}
                                                            onChange={(e) => updateCustomParameter(index, 'name', e.target.value)}
                                                            className="text-sm"
                                                        />
                                                    </div>
                                                    <div className="w-32 space-y-1">
                                                        <Label className="text-xs">Type</Label>
                                                        <Select
                                                            value={param.type}
                                                            onValueChange={(v) => updateCustomParameter(index, 'type', v)}
                                                        >
                                                            <SelectTrigger className="text-sm">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="address">address</SelectItem>
                                                                <SelectItem value="u64">u64</SelectItem>
                                                                <SelectItem value="u128">u128</SelectItem>
                                                                <SelectItem value="bool">bool</SelectItem>
                                                                <SelectItem value="string">string</SelectItem>
                                                                <SelectItem value="vector<u8>">vector&lt;u8&gt;</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-xs">Value</Label>
                                                        <Input
                                                            placeholder={param.type === 'address' ? '0x...' : param.type === 'u64' ? '1000000' : '...'}
                                                            value={param.value}
                                                            onChange={(e) => updateCustomParameter(index, 'value', e.target.value)}
                                                            className="font-mono text-sm"
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeCustomParameter(index)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        ✕
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={addCustomParameter}
                                            className="w-full"
                                        >
                                            + Add Parameter
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Action Buttons for Custom Mode */}
                                <Button
                                    variant="default"
                                    size="lg"
                                    className="w-full gap-2"
                                    onClick={handleCustomSimulate}
                                    disabled={!customContract.moduleAddress || !customContract.moduleName || !customContract.functionName || isSimulating}
                                >
                                    <Play className="w-4 h-4" />
                                    {isSimulating ? 'Simulating...' : 'Simulate Transaction'}
                                </Button>

                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full gap-2"
                                    onClick={saveCustomFlow}
                                    disabled={!customContract.moduleAddress || !customContract.moduleName || !customContract.functionName}
                                >
                                    <Code className="w-4 h-4" />
                                    Save as Flow
                                </Button>
                            </>
                        ) : (
                            /* Built-in Contracts Form (existing) */
                            <>
                                <Card className="border-border">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-mono flex items-center justify-center">1</span>
                                            Select Module
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Choose a Move module to interact with. Each module contains functions for specific operations like transfers or account creation.
                                        </p>
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
                                            <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-mono flex items-center justify-center">2</span>
                                            Select Function
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Pick the function you want to call. The signature shows the required parameter types.
                                        </p>
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
                                            <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-mono flex items-center justify-center">3</span>
                                            Parameters
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Enter the values for each parameter. Hover over types for format hints.
                                        </p>
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
                            </>
                        )}
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
                                    <div className="flex justify-between items-center py-2 border-b border-border gap-4">
                                        <span className="text-sm text-muted-foreground shrink-0">Module</span>
                                        <span className="font-mono text-sm truncate text-right" title={transactionPreview.module}>{transactionPreview.module}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border gap-4">
                                        <span className="text-sm text-muted-foreground shrink-0">Function</span>
                                        <span className="font-mono text-sm truncate text-right" title={transactionPreview.function}>{transactionPreview.function}</span>
                                    </div>
                                    {transactionPreview.parameters.map((param) => (
                                        <div key={param.name} className="flex justify-between items-center py-2 border-b border-border gap-4">
                                            <span className="text-sm text-muted-foreground shrink-0">{param.name}</span>
                                            <span className="font-mono text-sm truncate max-w-[200px] text-right" title={param.value}>{param.value}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center py-2 gap-4">
                                        <span className="text-sm text-muted-foreground shrink-0">Signer</span>
                                        <span className="text-sm truncate text-right" title={transactionPreview.signerDisplay}>{transactionPreview.signerDisplay}</span>
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
                                            <span className={`font-mono text-sm ${decodedSimulationResult.status === 'success' ? 'text-slate-8000' : 'text-destructive'}`}>
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
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm">
                                                    {decodedSimulationResult.events.length > 0
                                                        ? `${decodedSimulationResult.events.length} event${decodedSimulationResult.events.length > 1 ? 's' : ''}`
                                                        : 'None'
                                                    }
                                                </span>
                                                {decodedSimulationResult.events.length > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs text-muted-foreground hover:text-[#2563EB]"
                                                        onClick={() => setEventsModalOpen(true)}
                                                    >
                                                        View All
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Event preview - show first 2 */}
                                        {decodedSimulationResult.events.length > 0 && (
                                            <div className="pt-2 border-t border-border space-y-2">
                                                <span className="text-xs text-muted-foreground font-medium">Event Preview (click View All for details):</span>
                                                {decodedSimulationResult.events.slice(0, 2).map((event, idx) => (
                                                    <div key={idx} className="text-xs font-mono bg-background/50 p-2 rounded flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs shrink-0">#{idx + 1}</Badge>
                                                        <span className="text-foreground truncate">{event.type.split('::').slice(-2).join('::')}</span>
                                                    </div>
                                                ))}
                                                {decodedSimulationResult.events.length > 2 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full text-xs"
                                                        onClick={() => setEventsModalOpen(true)}
                                                    >
                                                        View All {decodedSimulationResult.events.length} Events →
                                                    </Button>
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
                                                            <Badge className="bg-slate-8000/10 text-slate-8000 text-xs shrink-0">New</Badge>
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
                                            disabled={!connected || isExecuting || (contractMode === 'custom' ? (!customContract.moduleAddress || !customContract.moduleName || !customContract.functionName) : (!transactionDraft.module || !transactionDraft.function))}
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
                                            <div className="p-4 rounded-lg bg-slate-8000/10 border border-slate-8000/20 space-y-3">
                                                <div className="flex items-center gap-2 text-slate-8000">
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
                                                    <code className="flex-1 p-2 rounded bg-slate-800 dark:bg-blue-950/20 text-teal-500 dark:text-slate-8000 text-xs overflow-x-auto">
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

                {/* Events Modal */}
                <Dialog open={eventsModalOpen} onOpenChange={setEventsModalOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-slate-8000" />
                                Emitted Events
                            </DialogTitle>
                            <DialogDescription>
                                {decodedSimulationResult?.events?.length || 0} events will be emitted when this transaction executes
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
                            {decodedSimulationResult?.events?.map((event, idx) => (
                                <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-card/50">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-slate-8000/20 text-slate-8000">Event #{idx + 1}</Badge>
                                            <span className="text-xs text-muted-foreground">Sequence #{event.sequenceNumber}</span>
                                        </div>
                                    </div>

                                    {/* Event Type */}
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">Event Type</span>
                                        <div className="text-sm font-mono bg-background/50 p-2 rounded break-all">
                                            {event.type}
                                        </div>
                                    </div>

                                    {/* Event Data */}
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">Event Data</span>
                                        <div className="text-sm font-mono bg-background/50 p-3 rounded overflow-x-auto">
                                            <pre className="text-xs whitespace-pre-wrap break-all">
                                                {JSON.stringify(event.data, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-2 border-t border-border">
                            <Button variant="outline" onClick={() => setEventsModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Success Notification */}
                {saveFlowSuccess && (
                    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
                        <Card className="border-slate-8000/50 bg-slate-8000/10">
                            <CardContent className="p-4 flex items-center gap-3">
                                <Check className="w-5 h-5 text-[#2563EB]" />
                                <div>
                                    <p className="font-medium text-foreground">Flow Saved!</p>
                                    <p className="text-sm text-muted-foreground">Your template is ready to use</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

// Step indicator component
function StepIndicator({ step, label, active, completed }: { step: number; label: string; active: boolean; completed: boolean }) {
    return (
        <div className={`flex items-center gap-2 ${active ? 'text-foreground' : completed ? 'text-[#2563EB]' : 'text-muted-foreground'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${completed
                ? 'bg-[#2563EB]/20 text-[#2563EB]'
                : active
                    ? 'bg-[#2563EB]/20 text-[#2563EB] ring-2 ring-[#2563EB]/30'
                    : 'bg-muted/50'
                }`}>
                {completed ? <Check className="w-4 h-4" /> : step}
            </div>
            <span className="text-sm hidden md:inline">{label}</span>
        </div>
    );
}
