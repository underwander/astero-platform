"use client";

import AdminOnly from "@/components/auth/AdminOnly";
import AsteroLogo from "@/components/brand/AsteroLogo";
import AsteroCrm from "@/components/admin/AsteroCrm";
import Link from "next/link";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

export default function CrmPage() {
  return (
    <AdminOnly>
      <div className="crm-shell min-h-screen">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between gap-3 px-3 md:px-5">
            <AsteroLogo tone="light" className="[&>div:first-child]:size-9 [&_svg]:size-7" />

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Link
                href="/"
                className="crm-focus rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Кабинет
              </Link>
              <Link
                href="/logout"
                className="crm-focus rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
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
