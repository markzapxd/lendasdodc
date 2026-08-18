"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/morango";
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      setAuthenticated(false);
      return;
    }

    let isMounted = true;

    fetch("/api/admin/me")
      .then((response) => {
        if (!isMounted) return;
        if (response.ok) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          router.replace("/morango");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAuthenticated(false);
        router.replace("/morango");
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return children;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08040d]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ec195a] border-t-transparent shadow-[0_0_15px_rgba(236,25,90,0.6)]" />
          <span className="text-xs font-mono text-[#a595b8]/70">Verificando sessão...</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#08040d] text-white">
      <a
        href="#admin-content"
        className="absolute left-4 top-4 z-50 -translate-y-16 rounded-xl bg-[#ec195a] px-3.5 py-2 text-xs font-bold text-white transition-transform focus:translate-y-0"
      >
        Pular para o conteúdo principal
      </a>
      <Sidebar />
      <main id="admin-content" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
