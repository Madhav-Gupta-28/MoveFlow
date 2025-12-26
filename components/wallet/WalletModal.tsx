'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface WalletModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
    const { wallets, connect } = useWallet();
    const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async (walletName: string) => {
        setConnectingWallet(walletName);
        setError(null);

        try {
            await connect(walletName);
            onOpenChange(false);
        } catch (err: any) {
            console.error('Failed to connect:', err);
            setError(err.message || 'Failed to connect wallet');
        } finally {
            setConnectingWallet(null);
        }
    };

    // Filter to show only installed or recommended wallets
    const availableWallets = wallets || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Connect Wallet</DialogTitle>
                    <DialogDescription>
                        Connect your wallet to interact with Movement Testnet
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {availableWallets.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <p className="mb-4">No wallets detected</p>
                            <Button variant="outline" asChild>
                                <a
                                    href="https://petra.app/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Install Petra Wallet
                                </a>
                            </Button>
                        </div>
                    ) : (
                        availableWallets.map((wallet) => (
                            <Button
                                key={wallet.name}
                                variant="outline"
                                className="w-full justify-between h-14 px-4"
                                onClick={() => handleConnect(wallet.name)}
                                disabled={connectingWallet !== null}
                            >
                                <div className="flex items-center gap-3">
                                    {wallet.icon && (
                                        <img
                                            src={wallet.icon}
                                            alt={wallet.name}
                                            className="w-8 h-8 rounded-lg"
                                        />
                                    )}
                                    <div className="text-left">
                                        <div className="font-medium">{wallet.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {wallet.readyState === 'Installed'
                                                ? 'Installed'
                                                : 'Not installed'}
                                        </div>
                                    </div>
                                </div>
                                {connectingWallet === wallet.name && (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                            </Button>
                        ))
                    )}
                </div>

                <div className="text-xs text-muted-foreground text-center">
                    By connecting, you agree to the Terms of Service
                </div>
            </DialogContent>
        </Dialog>
    );
}
