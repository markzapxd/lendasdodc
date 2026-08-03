/**
 * Content Security Policy builder for Lendas do DC.
 *
 * CSP directives:
 * - default-src: Only allow same-origin
 * - script-src: Only allow same-origin and inline (for Next.js)
 * - style-src: Allow same-origin and inline (for Tailwind)
 * - img-src: Allow same-origin and Supabase storage
 * - font-src: Allow same-origin and Google Fonts
 * - connect-src: Allow same-origin and Supabase API
 * - frame-ancestors: Deny all
 * - base-uri: Deny
 * - form-action: Same-origin only
 */
export interface CSPConfig {
  /** Supabase project URL */
  readonly supabaseUrl: string;
  /** Whether to enable report-only mode */
  readonly reportOnly?: boolean;
  /** Report URI for CSP violations */
  readonly reportUri?: string;
}

export function buildCSP(config: CSPConfig): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' ${config.supabaseUrl} data: blob:`,
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' ${config.supabaseUrl}`,
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  if (config.reportUri) {
    directives.push(`report-uri ${config.reportUri}`);
  }

  return directives.join("; ");
}

/**
 * Get CSP header configuration.
 */
export function getCSPHeaders(config: CSPConfig) {
  return {
    key: config.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
    value: buildCSP(config),
  };
}
