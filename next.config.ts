import type { NextConfig } from "next";
import { getCSPHeaders } from "@/lib/security/csp";
import { securityHeaders } from "@/lib/security/headers";

const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl = "" } = process.env;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        ...securityHeaders.filter((h) => (isDev ? h.key !== "Strict-Transport-Security" : true)),
        getCSPHeaders({ supabaseUrl }),
      ],
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
