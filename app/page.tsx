import Link from 'next/link';
import { Plus, Bookmark, Receipt, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const actionCards = [
    {
        title: 'Create Transaction',
        description: 'Build and simulate a Move transaction',
        icon: Plus,
        href: '/create',
    },
    {
        title: 'Saved Flows',
        description: 'Reusable transaction templates',
        icon: Bookmark,
        href: '/flows',
    },
    {
        title: 'Receipts',
        description: 'Human-readable execution history',
        icon: Receipt,
        href: '/receipts',
    },
];

export default function Dashboard() {
    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            {/* Hero Section */}
            <div className="mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">
                    MoveFlow
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                    Visual transaction builder and simulator for Movement
                </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {actionCards.map((card, index) => (
                    <Link
                        key={card.href}
                        href={card.href}
                        className="group"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <Card className="h-full border-border bg-card hover:border-muted-foreground/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-secondary transition-colors">
                                    <card.icon className="w-6 h-6 text-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                    {card.title}
                                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
                <div className="p-6 border border-border rounded-lg bg-card/50">
                    <p className="text-3xl font-bold font-mono">0</p>
                    <p className="text-sm text-muted-foreground mt-1">Transactions Today</p>
                </div>
                <div className="p-6 border border-border rounded-lg bg-card/50">
                    <p className="text-3xl font-bold font-mono">0</p>
                    <p className="text-sm text-muted-foreground mt-1">Saved Flows</p>
                </div>
                <div className="p-6 border border-border rounded-lg bg-card/50">
                    <p className="text-3xl font-bold font-mono">100%</p>
                    <p className="text-sm text-muted-foreground mt-1">Success Rate</p>
                </div>
            </div>
        </div>
    );
}
