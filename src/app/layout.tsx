import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const { REACT_SCAN, REACT_DEV_TOOLS } = process.env;

export const metadata: Metadata = {
  title: "larplandia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="min-h-screen antialiased">
      <head>
        {process.env.NODE_ENV === "development" && REACT_SCAN === "true" && (
          <Script
            src="https://unpkg.com/react-scan/dist/auto.global.js"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

        {process.env.NODE_ENV === "development" && REACT_DEV_TOOLS === "true" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
