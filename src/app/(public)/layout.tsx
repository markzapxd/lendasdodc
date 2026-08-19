import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { ThemeProvider } from "@/components/theme/ThemeContext";

const ogImageUrl = "/imagens/%20averiguando-resenha-echidna-ezgif.com-video-to-gif-converter.gif";

export const metadata: Metadata = {
  title: "averiguando os resenhudos",
  description: "vai toma no cu randolas sem pig",
  openGraph: {
    title: "averiguando os resenhudos",
    description: "vai toma no cu randolas sem pig",
    images: [
      {
        url: ogImageUrl,
        alt: "averiguando os resenhudos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "averiguando os resenhudos",
    description: "vai toma no cu randolas sem pig",
    images: [ogImageUrl],
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <div className="min-h-screen text-white">
        <PublicHeader />
        <main id="conteudo">{children}</main>
      </div>
    </ThemeProvider>
  );
}
