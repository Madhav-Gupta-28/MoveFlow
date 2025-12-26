'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, Copy, LogOut, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';
import { WalletModal } from './WalletModal';

// Helper to truncate address
const truncateAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function WalletButton() {
    const { connected, account, disconnect, wallet } = useWallet();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyAddress = async () => {
        if (account?.address) {
            await navigator.clipboard.writeText(account.address.toString());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    if (!connected || !account) {
        return (
            <>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    className="gap-2"
                >
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                </Button>
                <WalletModal open={isModalOpen} onOpenChange={setIsModalOpen} />
            </>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    {wallet?.icon && (
                        <img
                            src={wallet.icon}
                            alt={wallet.name}
                            className="w-4 h-4 rounded"
                        />
                    )}
                    {truncateAddress(account.address.toString())}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                    {wallet?.icon && (
                        <img
                            src={wallet.icon}
                            alt={wallet.name}
                            className="w-5 h-5 rounded"
                        />
                    )}
                    <span>{wallet?.name || 'Wallet'}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
                    {copied ? (
                        <Check className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied ? 'Copied!' : 'Copy Address'}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a
                        href={`https://explorer.movementnetwork.xyz/account/${account.address}?network=bardock+testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Explorer
                    </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleDisconnect}
                    className="cursor-pointer text-destructive focus:text-destructive"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
