type Props = {
  compact?: boolean;
  className?: string;
  tone?: "dark" | "light";
};

export default function AsteroLogo({ compact = false, className = "", tone = "dark" }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-lime-400 text-slate-950 shadow-lg shadow-emerald-900/25">
        <svg viewBox="0 0 64 64" className="size-9" aria-hidden="true">
          <path
            d="M32 8 54 52H43.5l-4-8.2h-15L20.5 52H10L32 8Zm-3.6 27.2h7.2L32 27.8l-3.6 7.4Z"
            fill="currentColor"
          />
          <path
            d="M17 19c8.7-6.9 21.4-6.9 30.1 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      </div>

      {!compact && (
        <div className="leading-tight">
          <p className={`text-xl font-black tracking-tight ${tone === "light" ? "text-slate-950" : "text-white"}`}>Astero</p>
          <p className={`text-[11px] font-bold uppercase tracking-[0.24em] ${tone === "light" ? "text-emerald-700" : "text-emerald-300"}`}>
            Trader Room
          </p>
        </div>
      )}
    </div>
  );
}
