'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { ReactNode } from 'react';

interface WalletProviderProps {
    children: ReactNode;
}

// Movement Testnet compatible wallets
// Razor Wallet is AIP-62 compliant and auto-detected when installed
// Nightly is explicitly opted-in for better Movement support
const optInWallets: readonly ("Nightly" | "Petra" | "Pontem Wallet")[] = [
    "Nightly",
];

export function WalletProvider({ children }: WalletProviderProps) {
    return (
        <AptosWalletAdapterProvider
            optInWallets={optInWallets}
            autoConnect={true}
            onError={(error) => {
                console.error('Wallet error:', error);
            }}
        >
            {children}
        </AptosWalletAdapterProvider>
    );
}

