import type { NextConfig } from "next";
import { getCSPHeaders } from "@/lib/security/csp";
import { securityHeaders } from "@/lib/security/headers";

const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl = "" } = process.env;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [...securityHeaders, getCSPHeaders({ supabaseUrl })],
    },
  ],

  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
          },
        ]
      : [],
  },

  reactCompiler: true,
  poweredByHeader: false,

  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },

  output: "standalone",
};

export default nextConfig;
