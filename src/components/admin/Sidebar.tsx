"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Mensagens", href: "/messages" },
  { name: "Relatórios", href: "/reports" },
  { name: "Auditoria", href: "/audit" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          Lendas do DC
        </p>
        <h2 className="mt-1 text-lg font-bold text-text-primary">Admin</h2>
      </div>

      <nav className="flex-1 space-y-1 p-4" aria-label="Navegação administrativa">
        {navigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`block min-h-11 rounded-md px-3 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                isActive
                  ? "bg-charcoal-700 font-medium text-text-primary"
                  : "text-text-secondary hover:bg-charcoal-700 hover:text-text-primary"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="min-h-11 w-full rounded-md px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-charcoal-700 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
