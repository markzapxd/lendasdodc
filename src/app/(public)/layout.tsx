import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/PublicHeader";

export const metadata: Metadata = {
  title: "LARP - Descubra pessoas",
  description: "Converse, interaja e crie histórias incríveis.",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#08040d] text-white">
      <PublicHeader />
      <main id="conteudo">{children}</main>
    </div>
  );
}
