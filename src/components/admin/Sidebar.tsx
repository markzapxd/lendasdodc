"use client";

import {
  Cards,
  ChatCircleDots,
  FileText,
  Gauge,
  Gear,
  ShieldWarning,
  SignOut,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/abacaxi", icon: Gauge },
  { name: "Cards", href: "/melancia", icon: Cards },
  { name: "Mensagens", href: "/maracuja", icon: ChatCircleDots },
  { name: "Relatórios", href: "/pitaya", icon: ShieldWarning },
  { name: "Auditoria", href: "/carambola", icon: FileText },
  { name: "Configurações", href: "/kiwi", icon: Gear },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-[#21122e] bg-[#0b0512] select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b border-[#21122e] p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#210d2e] border border-[#ec195a]/40 text-[#ec195a] font-bold text-sm shadow-[0_0_12px_rgba(236,25,90,0.3)]">
          L
        </div>
        <div>
          <h2 className="text-base font-black text-white leading-tight">LARP Admin</h2>
          <p className="text-[10px] font-mono text-[#a595b8]/60">Painel de Controle</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 p-4" aria-label="Navegação administrativa">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#1f0d2c] text-white border-l-2 border-[#ec195a] shadow-sm"
                  : "text-[#a595b8] hover:bg-[#150a22] hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive ? "text-[#ec195a]" : "text-[#a595b8]/70"}`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="border-t border-[#21122e] p-4">
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#a595b8] transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <SignOut className="h-4 w-4 shrink-0" />
            <span>Sair do Painel</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
