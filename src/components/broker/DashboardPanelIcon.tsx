import type { ReactNode } from "react";

export default function DashboardPanelIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-400 text-slate-950 shadow-sm [&_svg]:size-5 [&_svg]:stroke-[1.8]"
    >
      {children}
    </span>
  );
}
