import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "api.dicebear.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "media.tenor.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "lfmzsbufgpqjrjxufomd.supabase.co",
                pathname: "/storage/**",
            },
        ],
    },
};

export default nextConfig;
