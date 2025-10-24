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
    webpack: (config) => {
        config.module.rules.push({
            test: /\.js$/,
            use: ["source-map-loader"],
            enforce: "pre",
            exclude: /node_modules/,
        });
        return config;
    },
};

export default nextConfig;
