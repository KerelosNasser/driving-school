import type { NextConfig } from "next";

import {resolve} from "path";

const nextConfig: NextConfig = {
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            "@": resolve(__dirname),
        };
        return config;
    },
};

export default nextConfig;
