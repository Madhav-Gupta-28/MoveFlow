'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Bookmark, Receipt, ArrowRight, Box, Zap, Shield, Cpu, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
    const [stats, setStats] = useState({
        savedFlows: 0,
        receipts: 0,
    });

    useEffect(() => {
        // Load stats from localStorage
        const flows = JSON.parse(localStorage.getItem('savedFlows') || '[]');
        const receipts = JSON.parse(localStorage.getItem('transactionReceipts') || '[]');
        setStats({
            savedFlows: flows.length,
            receipts: receipts.length,
        });
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
            {/* Geometric Grid Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Grid lines */}
                <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-600/30" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Decorative geometric shapes */}
                <div className="absolute top-20 right-10 w-32 h-32 border border-blue-600/20 rotate-45 animate-pulse" />
                <div className="absolute top-40 right-20 w-24 h-24 border border-blue-600/10 rotate-12" />
                <div className="absolute bottom-32 left-10 w-40 h-40 border border-blue-600/20 -rotate-12" />
                <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-blue-600/10 rotate-45" />

                {/* Plus signs decoration */}
                <div className="absolute top-32 left-20 text-blue-600/20 text-4xl font-light">+</div>
                <div className="absolute top-40 left-28 text-blue-600/15 text-2xl font-light">+</div>
                <div className="absolute bottom-40 right-32 text-blue-600/20 text-3xl font-light">+</div>
                <div className="absolute bottom-48 right-20 text-blue-600/15 text-2xl font-light">+</div>
            </div>

            {/* Main Content */}
            <div className="relative">
                {/* Hero Section - Bold Typography */}
                <section className="min-h-[70vh] flex flex-col justify-center px-8 md:px-16 py-20">
                    <div className="max-w-6xl">
                        {/* Small Tag */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-600/30 bg-blue-600/5 text-blue-600 text-sm font-medium mb-8 animate-fade-in">
                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                            VISUAL TRANSACTION BUILDER
                        </div>

                        {/* Main Title - Movement Style */}
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] mb-8 animate-fade-in">
                            <span className="block text-foreground">BUILD</span>
                            <span className="block text-foreground">TRANSACTIONS</span>
                            <span className="block text-blue-600">VISUALLY</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
                            The next-generation transaction builder for the Movement blockchain.
                            No more raw JSON. Just point, click, and execute.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap items-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <Link href="/create">
                                <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-teal-500 hover:bg-teal-600 text-white gap-2 group">
                                    START BUILDING
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link href="/flows">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-2 gap-2 hover:bg-blue-600/10 hover:border-blue-600/50">
                                    VIEW FLOWS
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Floating Stats - Right Side */}
                    <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-8">
                        <div className="text-right animate-fade-in" style={{ animationDelay: '300ms' }}>
                            <p className="text-5xl font-black text-blue-600 font-mono">{stats.receipts}</p>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Transactions</p>
                        </div>
                        <div className="text-right animate-fade-in" style={{ animationDelay: '400ms' }}>
                            <p className="text-5xl font-black text-blue-600 font-mono">{stats.savedFlows}</p>
                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Saved Flows</p>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="px-8 md:px-16 py-20 bg-card/30">
                    <div className="max-w-6xl mx-auto">
                        <p className="text-teal-500 text-sm font-medium uppercase tracking-wider mb-4 text-center">HOW IT WORKS</p>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 text-center">
                            Build Move Transactions in 4 Simple Steps
                        </h2>
                        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
                            MoveFlow abstracts away the complexity of blockchain transactions.
                            No need to write raw JSON payloads or understand complex ABIs.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {/* Step 1 */}
                            <div className="relative">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-4">
                                        1
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Select Module</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Choose from pre-loaded Move modules like <code className="text-xs bg-muted px-1 rounded">aptos_account</code> or add your own custom contracts
                                    </p>
                                </div>
                                {/* Arrow */}
                                <ChevronRight className="hidden md:block absolute top-8 -right-4 w-8 h-8 text-blue-600/30" />
                            </div>

                            {/* Step 2 */}
                            <div className="relative">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-4">
                                        2
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Configure Parameters</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Fill in function arguments with our smart form builder. Type validation ensures correctness
                                    </p>
                                </div>
                                <ChevronRight className="hidden md:block absolute top-8 -right-4 w-8 h-8 text-blue-600/30" />
                            </div>

                            {/* Step 3 */}
                            <div className="relative">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-4">
                                        3
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Simulate First</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Preview exactly what will happen on-chain before committing. See gas costs and state changes
                                    </p>
                                </div>
                                <ChevronRight className="hidden md:block absolute top-8 -right-4 w-8 h-8 text-blue-600/30" />
                            </div>

                            {/* Step 4 */}
                            <div>
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-4">
                                        4
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Execute & Track</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Sign with your wallet and get a human-readable receipt. Track all transactions in one place
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section - Minimal Icons */}
                <section className="px-8 md:px-16 py-20 border-t border-border/50">
                    <div className="max-w-6xl">
                        {/* Section Label */}
                        <p className="text-blue-600 text-sm font-medium uppercase tracking-wider mb-4">WHY MOVEFLOW?</p>

                        {/* Section Title */}
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-16 max-w-3xl">
                            THE SIMPLEST WAY TO INTERACT WITH THE MOVEMENT BLOCKCHAIN
                        </h2>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                            {/* Feature 1 */}
                            <div className="group">
                                <div className="mb-6">
                                    <Box className="w-12 h-12 text-teal-500 stroke-1" />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-wide mb-3">VISUAL BUILDER</h3>
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Build complex Move transactions through an intuitive point-and-click interface.
                                    No need to manually craft JSON payloads or remember function signatures.
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 mt-0.5">→</span>
                                        <span>Pre-loaded common modules (transfers, coin operations)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 mt-0.5">→</span>
                                        <span>Auto-generated forms based on function parameters</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 mt-0.5">→</span>
                                        <span>Type validation prevents common mistakes</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Feature 2 */}
                            <div className="group">
                                <div className="mb-6">
                                    <Zap className="w-12 h-12 text-teal-500 stroke-1" />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-wide mb-3">SIMULATION ENGINE</h3>
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Preview transaction outcomes before spending gas. See exact state changes,
                                    gas consumption, and potential errors in a sandboxed environment.
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 mt-0.5">→</span>
                                        <span>Accurate gas estimation before execution</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 mt-0.5">→</span>
                                        <span>Preview resource state changes and events</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 mt-0.5">→</span>
                                        <span>Catch errors early without wasting funds</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Feature 3 */}
                            <div className="group">
                                <div className="mb-6">
                                    <Shield className="w-12 h-12 text-teal-500 stroke-1" />
                                </div>
                                <h3 className="text-xl font-bold uppercase tracking-wide mb-3">NON-CUSTODIAL</h3>
                                <p className="text-muted-foreground leading-relaxed mb-4">
                                    Your private keys never leave your wallet. MoveFlow only constructs transaction payloads -
                                    you maintain full custody and control.
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 mt-0.5">→</span>
                                        <span>Wallet-based signing (Petra, Pontem, MSafe)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 mt-0.5">→</span>
                                        <span>Zero backend storage of sensitive data</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-teal-500 mt-0.5">→</span>
                                        <span>Local-first receipts stored in your browser</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick Actions Section */}
                <section className="px-8 md:px-16 py-20 border-t border-border/50">
                    <div className="max-w-6xl">
                        <p className="text-blue-600 text-sm font-medium uppercase tracking-wider mb-4">GET STARTED</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-12">QUICK ACTIONS</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Create Transaction */}
                            <Link href="/create" className="group">
                                <div className="h-full p-8 border border-border bg-card/50 hover:border-teal-500/50 hover:bg-blue-600/5 transition-all duration-300">
                                    <div className="w-16 h-16 border border-teal-500/30 flex items-center justify-center mb-6 group-hover:border-teal-500 transition-colors">
                                        <Plus className="w-8 h-8 text-teal-500" />
                                    </div>
                                    <h3 className="text-xl font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                                        Create
                                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </h3>
                                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                                        Build and execute Move transactions with our visual interface. Perfect for token transfers,
                                        coin operations, and smart contract interactions.
                                    </p>
                                    <p className="text-xs text-muted-foreground/70">
                                        → Select module → Configure params → Simulate → Execute
                                    </p>
                                </div>
                            </Link>

                            {/* Saved Flows */}
                            <Link href="/flows" className="group">
                                <div className="h-full p-8 border border-border bg-card/50 hover:border-teal-500/50 hover:bg-blue-600/5 transition-all duration-300">
                                    <div className="w-16 h-16 border border-teal-500/30 flex items-center justify-center mb-6 group-hover:border-teal-500 transition-colors">
                                        <Bookmark className="w-8 h-8 text-teal-500" />
                                    </div>
                                    <h3 className="text-xl font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                                        Flows
                                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </h3>
                                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                                        Save and reuse your frequently used transaction templates.
                                        Streamline repetitive operations like batch transfers and contract calls.
                                    </p>
                                    <p className="text-xs text-muted-foreground/70">
                                        {stats.savedFlows > 0 ? `You have ${stats.savedFlows} saved flow${stats.savedFlows > 1 ? 's' : ''}` : 'No flows saved yet'}
                                    </p>
                                </div>
                            </Link>

                            {/* Receipts */}
                            <Link href="/receipts" className="group">
                                <div className="h-full p-8 border border-border bg-card/50 hover:border-teal-500/50 hover:bg-blue-600/5 transition-all duration-300">
                                    <div className="w-16 h-16 border border-teal-500/30 flex items-center justify-center mb-6 group-hover:border-teal-500 transition-colors">
                                        <Receipt className="w-8 h-8 text-teal-500" />
                                    </div>
                                    <h3 className="text-xl font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                                        Receipts
                                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </h3>
                                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                                        View human-readable history of all executed transactions.
                                        Track gas costs, state changes, and transaction status in one place.
                                    </p>
                                    <p className="text-xs text-muted-foreground/70">
                                        {stats.receipts > 0 ? `${stats.receipts} transaction${stats.receipts > 1 ? 's' : ''} recorded` : 'No transactions yet'}
                                    </p>
                                </div>
                            </Link>

                            {/* Receipts */}
                            <Link href="/receipts" className="group">
                                <div className="h-full p-8 border border-border bg-card/50 hover:border-blue-600/50 hover:bg-blue-600/5 transition-all duration-300">
                                    <div className="w-16 h-16 border border-blue-600/30 flex items-center justify-center mb-6 group-hover:border-blue-600 transition-colors">
                                        <Receipt className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
                                        Receipts
                                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        View human-readable history of all executed transactions
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Bottom Section */}
                <section className="px-8 md:px-16 py-16 border-t border-border/50">
                    <div className="max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Ready to start building?</h3>
                            <p className="text-muted-foreground">Create your first transaction in under a minute.</p>
                        </div>
                        <Link href="/create">
                            <Button size="lg" className="h-12 px-6 font-semibold bg-teal-500 hover:bg-teal-600 text-white gap-2">
                                <Cpu className="w-5 h-5" />
                                Launch Builder
                            </Button>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
