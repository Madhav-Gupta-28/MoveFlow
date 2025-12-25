import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,

    // Configure image optimization
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },

    // Disable x-powered-by header for security
    poweredByHeader: false,

    // Configure redirects if needed
    async redirects() {
        return [];
    },

    // Configure rewrites if needed
    async rewrites() {
        return [];
    },
};

export default nextConfig;
