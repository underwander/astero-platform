"use client";

import AdminOnly from "@/components/auth/AdminOnly";
import AsteroLogo from "@/components/brand/AsteroLogo";
import AsteroCrm from "@/components/admin/AsteroCrm";
import Link from "next/link";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

export default function CrmPage() {
  return (
    <AdminOnly>
      <div className="min-h-screen bg-[#06130d] text-white">
        <header className="sticky top-0 z-40 border-b border-emerald-400/10 bg-[#06130d]/95 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-3 py-3 md:px-5">
            <AsteroLogo />

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Link
                href="/"
                className="rounded-xl border border-emerald-400/15 px-3 py-2 text-xs font-bold text-emerald-100 transition hover:bg-white/10"
              >
                Кабинет
              </Link>
              <Link
                href="/logout"
                className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400"
              >
                Выйти
              </Link>
            </div>
          </div>
        </header>

        <AsteroCrm />
      </div>
    </AdminOnly>
  );
}
