import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Providers } from '@/components/providers';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains-mono'
});

export const metadata: Metadata = {
    title: 'MoveFlow - Visual Transaction Builder for Movement',
    description: 'Visual transaction builder and simulator for the Movement blockchain. Build, simulate, and execute Move transactions with ease.',
    keywords: 'Movement, blockchain, Move, transaction builder, simulator, crypto, Web3, developer tools',
    authors: [{ name: 'MoveFlow Team' }],
    icons: {
        icon: '/logo_icon.png',
        apple: '/logo_icon.png',
    },
    openGraph: {
        title: 'MoveFlow - Visual Transaction Builder for Movement',
        description: 'Visual transaction builder and simulator for the Movement blockchain. Build, simulate, and execute Move transactions with ease.',
        type: 'website',
        siteName: 'MoveFlow',
    },
    twitter: {
        card: 'summary',
        title: 'MoveFlow - Visual Transaction Builder for Movement',
        description: 'Visual transaction builder and simulator for the Movement blockchain.',
    },
};

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
                <Providers>
                    <div className="min-h-screen bg-background flex flex-col">
                        <Topbar />
                        <div className="flex flex-1">
                            <Sidebar />
                            <main className="flex-1 overflow-auto">
                                {children}
                            </main>
                        </div>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
