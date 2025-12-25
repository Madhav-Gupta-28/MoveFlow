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
    signer: 'user' | 'agent';
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
}

export async function POST(request: NextRequest) {
    try {
        const body: SimulationRequest = await request.json();
        const { module, function: functionName, parameters } = body;

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

        // Create a dummy account for simulation
        // This is just for simulation purposes and won't be used for actual signing
        const { Account } = await import('@aptos-labs/ts-sdk');
        const dummyAccount = Account.generate();

        // Construct the transaction payload
        const transaction = await aptos.transaction.build.simple({
            sender: dummyAccount.accountAddress,
            data: {
                function: `${paddedModuleAddress}::${moduleName}::${functionName}`,
                typeArguments: [],
                functionArguments,
            },
        });

        console.log('Simulating transaction:', {
            sender: dummyAccount.accountAddress.toString(),
            function: `${paddedModuleAddress}::${moduleName}::${functionName}`,
            args: functionArguments,
        });

        // Simulate the transaction
        // Note: This is a dry-run and won't be submitted to the blockchain
        const simulationResponse = await aptos.transaction.simulate.simple({
            signerPublicKey: dummyAccount.publicKey,
            transaction,
        });

        console.log('Simulation response:', simulationResponse);

        // Parse simulation results
        const result: SimulationResult = {
            success: simulationResponse[0]?.success || false,
            gasUsed: simulationResponse[0]?.gas_used || '0',
            vmStatus: simulationResponse[0]?.vm_status,
            changes: simulationResponse[0]?.changes as any, // Type varies based on change type
        };

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Simulation error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to simulate transaction',
                details: error.toString(),
            },
            { status: 500 }
        );
    }
}
