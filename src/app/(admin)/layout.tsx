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
  const isLoginPage = pathname === "/login";
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
          router.replace("/login");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAuthenticated(false);
        router.replace("/login");
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
      <div className="flex min-h-dvh items-center justify-center bg-charcoal-900">
        <div className="text-text-secondary" role="status" aria-live="polite">
          Carregando...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex min-h-dvh bg-charcoal-900">
      <a
        href="#admin-content"
        className="absolute left-4 top-4 z-10 -translate-y-16 rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-text-inverse focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-focus"
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
