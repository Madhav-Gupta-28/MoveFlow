/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Movement Testnet configuration
const MOVEMENT_TESTNET_URL = 'https://testnet.movementnetwork.xyz/v1';

// Initialize Aptos client for Movement testnet
const config = new AptosConfig({
    network: Network.CUSTOM,
    fullnode: MOVEMENT_TESTNET_URL,
});
const aptos = new Aptos(config);

interface SimulationRequest {
    module: string;
    function: string;
    parameters: Record<string, string>;
    typeArguments?: string[];
    signer: 'user' | 'agent';
    publicKey?: string;
    signerAddress?: string;
}

// State diff item for before/after comparison
interface StateDiffItem {
    resourceType: string;
    address: string;
    changeType: 'write' | 'delete' | 'create';
    fieldDiffs: Array<{
        field: string;
        before: string | null;
        after: string | null;
    }>;
}

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
    decoded: {
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
        // Enhanced state diffs
        stateDiffs: StateDiffItem[];
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: SimulationRequest = await request.json();
        const { module, function: functionName, parameters, typeArguments = [] } = body;

        // Validate input
        if (!module || !functionName) {
            return NextResponse.json(
                { error: 'Module and function are required' },
                { status: 400 }
            );
        }

        // Helper function to pad addresses to 64 characters
        const padAddress = (address: string): string => {
            // Remove 0x prefix if present
            const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
            // Pad to 64 characters with leading zeros
            const paddedAddress = cleanAddress.padStart(64, '0');
            return `0x${paddedAddress}`;
        };

        // Parse module address and name
        // Format: "0xabc::counter" -> address: "0xabc", module: "counter"
        const [moduleAddress, moduleName] = module.split('::');
        if (!moduleAddress || !moduleName) {
            return NextResponse.json(
                { error: 'Invalid module format. Expected format: 0xaddress::module_name' },
                { status: 400 }
            );
        }

        // Pad the module address to proper length
        const paddedModuleAddress = padAddress(moduleAddress);

        console.log('Module address:', {
            original: moduleAddress,
            padded: paddedModuleAddress,
        });

        // Convert parameters to proper types for Move
        const functionArguments = Object.entries(parameters).map(([key, value]) => {
            // Try to parse as number for u64 types
            if (!isNaN(Number(value))) {
                return value;
            }
            // Return as string for address types
            return value;
        });

        // Prepare signer for simulation
        const { Account, Ed25519PublicKey } = await import('@aptos-labs/ts-sdk');

        let senderAddress: string;
        let simulatorPublicKey: any; // PublicKey type

        // Use provided user details if available, otherwise dummy
        if (body.signer === 'user' && body.publicKey && body.signerAddress) {
            senderAddress = body.signerAddress;
            try {
                // Construct PublicKey object from hex string
                simulatorPublicKey = new Ed25519PublicKey(body.publicKey);
            } catch (e) {
                console.warn('Invalid public key provided, falling back to dummy', e);
                const dummy = Account.generate();
                senderAddress = dummy.accountAddress.toString();
                simulatorPublicKey = dummy.publicKey;
            }
        } else {
            const dummyAccount = Account.generate();
            senderAddress = dummyAccount.accountAddress.toString();
            simulatorPublicKey = dummyAccount.publicKey;
        }

        // Construct the transaction payload
        const transaction = await aptos.transaction.build.simple({
            sender: senderAddress,
            data: {
                function: `${paddedModuleAddress}::${moduleName}::${functionName}`,
                typeArguments: typeArguments,
                functionArguments,
            },
        });

        console.log('Simulating transaction:', {
            sender: senderAddress,
            function: `${paddedModuleAddress}::${moduleName}::${functionName}`,
            args: functionArguments,
            typeArguments: typeArguments,
        });

        // Simulate the transaction
        const simulationResponse = await aptos.transaction.simulate.simple({
            signerPublicKey: simulatorPublicKey,
            transaction,
        });

        console.log('Simulation response:', simulationResponse);

        const rawResult = simulationResponse[0];

        // Helper to format gas
        const formatGas = (gasUsed: string): string => {
            const gasNum = parseInt(gasUsed, 10);
            if (gasNum >= 1000000) {
                return `${(gasNum / 1000000).toFixed(2)}M`;
            } else if (gasNum >= 1000) {
                return `${(gasNum / 1000).toFixed(2)}K`;
            }
            return gasNum.toString();
        };

        // Parse abort reason from VM status
        const parseAbortReason = (vmStatus: string): string | null => {
            if (!vmStatus || vmStatus === 'Executed successfully') {
                return null;
            }
            // Common abort patterns
            if (vmStatus.includes('ABORTED')) {
                const match = vmStatus.match(/ABORTED.*code\s*[:=]?\s*(\d+)/i);
                if (match) {
                    return `Transaction aborted with code ${match[1]}`;
                }
            }
            if (vmStatus.includes('OUT_OF_GAS')) {
                return 'Transaction ran out of gas';
            }
            if (vmStatus.includes('EXECUTION_FAILURE')) {
                return 'Transaction execution failed';
            }
            return vmStatus;
        };

        // Parse events from simulation
        const parseEvents = (events: any[]): Array<{ type: string; data: any; sequenceNumber: string }> => {
            if (!events || !Array.isArray(events)) return [];
            return events.map((event: any) => ({
                type: event.type || 'unknown',
                data: event.data || {},
                sequenceNumber: event.sequence_number || '0',
            }));
        };

        // Parse state changes
        const parseStateChanges = (changes: any[]): Array<{ type: string; address: string; resource: string }> => {
            if (!changes || !Array.isArray(changes)) return [];
            return changes.slice(0, 10).map((change: any) => ({
                type: change.type || 'unknown',
                address: change.address || '',
                resource: change.data?.type || change.state_key_hash || 'unknown',
            }));
        };

        // Parse detailed state diffs from simulation changes (Async with fetching)
        const enrichStateDiffs = async (changes: any[]): Promise<StateDiffItem[]> => {
            if (!changes || !Array.isArray(changes)) return [];

            const diffs: StateDiffItem[] = [];
            const processedKeys = new Set<string>();

            // Limit to 10 changes
            for (const change of changes.slice(0, 10)) {
                if (!change.data || change.type === 'write_module') continue;

                const resourceType = change.data?.type || 'unknown';
                const address = change.address || '';
                const uniqueKey = `${address}::${resourceType}`;

                if (processedKeys.has(uniqueKey)) continue;
                processedKeys.add(uniqueKey);

                let beforeData: any = null;
                let changeType: 'write' | 'delete' | 'create' = 'write';

                if (change.type === 'delete_resource') {
                    changeType = 'delete';
                    try {
                        const resource = await aptos.getAccountResource({
                            accountAddress: address,
                            resourceType: resourceType,
                        });
                        beforeData = resource;
                    } catch (e) {
                        // Ignore error (resource might be gone or unreadable)
                    }
                } else if (change.type === 'write_resource') {
                    try {
                        const resource = await aptos.getAccountResource({
                            accountAddress: address,
                            resourceType: resourceType,
                        });
                        beforeData = resource;
                        changeType = 'write';
                    } catch (e) {
                        changeType = 'create';
                        beforeData = null;
                    }
                }

                const fieldDiffs: Array<{ field: string; before: string | null; after: string | null }> = [];
                const afterData = (change.data?.data || change.data) || {};

                const formatValue = (val: any): string => {
                    if (val === null || val === undefined) return 'null';
                    if (typeof val === 'object') {
                        if ('value' in val) return String(val.value);
                        if ('vec' in val) return `[${Array.isArray(val.vec) ? val.vec.length : 0} items]`;
                        return JSON.stringify(val);
                    }
                    return String(val);
                };

                if (changeType === 'delete') {
                    if (beforeData) {
                        for (const [key, value] of Object.entries(beforeData)) {
                            if (key === 'type' || key === 'handle') continue;
                            fieldDiffs.push({
                                field: key,
                                before: formatValue(value),
                                after: 'deleted',
                            });
                        }
                    } else {
                        fieldDiffs.push({ field: 'resource', before: 'exists', after: 'deleted' });
                    }
                } else {
                    if (afterData && typeof afterData === 'object') {
                        for (const [key, value] of Object.entries(afterData)) {
                            if (key === 'type' || key === 'handle') continue;
                            const afterValStr = formatValue(value);
                            let beforeValStr: string | null = null;

                            if (changeType === 'write' && beforeData && key in beforeData) {
                                beforeValStr = formatValue(beforeData[key]);
                                if (beforeValStr === afterValStr && key !== 'value' && key !== 'coin') continue;
                            }

                            fieldDiffs.push({
                                field: key,
                                before: beforeValStr,
                                after: afterValStr,
                            });
                        }
                    }
                }

                if (fieldDiffs.length > 0) {
                    diffs.push({
                        resourceType,
                        address,
                        changeType,
                        fieldDiffs: fieldDiffs.slice(0, 5),
                    });
                }
            }
            return diffs;
        };

        // Execute the fetching
        const stateDiffs = await enrichStateDiffs(rawResult?.changes);

        // Build decoded result
        const result: SimulationResult = {
            success: rawResult?.success || false,
            gasUsed: rawResult?.gas_used || '0',
            vmStatus: rawResult?.vm_status,
            changes: rawResult?.changes as any,
            decoded: {
                status: rawResult?.success ? 'success' : 'abort',
                abortReason: parseAbortReason(rawResult?.vm_status || ''),
                estimatedGas: {
                    units: rawResult?.gas_used || '0',
                    formatted: formatGas(rawResult?.gas_used || '0'),
                },
                events: parseEvents(rawResult?.events),
                stateChanges: parseStateChanges(rawResult?.changes),
                stateDiffs: stateDiffs,
            },
        };

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Simulation error:', error);

        // Helper function to translate blockchain errors to human-readable format
        const translateError = (errorMessage: string): string => {
            // Account not found
            if (errorMessage.includes('account_not_found') || errorMessage.includes('Account not found')) {
                return 'The signer account does not exist on the blockchain. Please fund the account first.';
            }
            // Module not found
            if (errorMessage.includes('module_not_found') || errorMessage.includes('Module not found')) {
                const moduleMatch = errorMessage.match(/Module name\((\w+)\)/);
                const moduleName = moduleMatch ? moduleMatch[1] : 'specified';
                return `The module '${moduleName}' does not exist at this address. Check the module address and name.`;
            }
            // Function not found
            if (errorMessage.includes('function_not_found') || errorMessage.includes('Function not found')) {
                return 'The specified function does not exist in this module.';
            }
            // Invalid argument
            if (errorMessage.includes('INVALID_ARGUMENT') || errorMessage.includes('invalid argument')) {
                return 'One or more function arguments are invalid. Check parameter types and values.';
            }
            // Out of gas
            if (errorMessage.includes('OUT_OF_GAS')) {
                return 'Transaction would run out of gas. Try increasing gas limit.';
            }
            // Sequence number error
            if (errorMessage.includes('SEQUENCE_NUMBER')) {
                return 'Account sequence number mismatch. The account state may have changed.';
            }
            // Resource not found
            if (errorMessage.includes('resource_not_found') || errorMessage.includes('Resource not found')) {
                return 'A required resource does not exist at the specified address.';
            }
            // Type mismatch
            if (errorMessage.includes('TYPE_MISMATCH')) {
                return 'Type mismatch in function arguments. Check that argument types match the function signature.';
            }
            // Abort codes
            const abortMatch = errorMessage.match(/ABORTED.*code[:\s]*(\d+)/i);
            if (abortMatch) {
                return `Transaction aborted by the smart contract with error code ${abortMatch[1]}.`;
            }
            // Network errors
            if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('network')) {
                return 'Could not connect to Movement Testnet. Check your internet connection.';
            }
            // Default: return a cleaned version
            return errorMessage.replace(/Request to \[Fullnode\]:.*failed with:\s*/, '').trim();
        };

        // Extract error code from the message
        const extractErrorCode = (errorMessage: string): string | null => {
            const codeMatch = errorMessage.match(/"error_code"\s*:\s*"([^"]+)"/);
            if (codeMatch) return codeMatch[1];
            const abortMatch = errorMessage.match(/ABORTED.*code[:\s]*(\d+)/i);
            if (abortMatch) return `ABORT_${abortMatch[1]}`;
            return null;
        };

        const errorMessage = error.message || 'Failed to simulate transaction';
        const humanReadableError = translateError(errorMessage);
        const errorCode = extractErrorCode(errorMessage);

        // Return a properly decoded error result
        return NextResponse.json({
            success: false,
            error: humanReadableError,
            rawError: errorMessage,
            errorCode: errorCode,
            decoded: {
                status: 'error' as const,
                abortReason: humanReadableError,
                estimatedGas: {
                    units: '0',
                    formatted: '0',
                },
                events: [],
                stateChanges: [],
                stateDiffs: [],
            },
        });
    }
}
