"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZES = [25, 50, 100] as const;

function readPageSize(storageKey: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const parsed = Number(window.sessionStorage.getItem(storageKey));
  return PAGE_SIZES.includes(parsed as (typeof PAGE_SIZES)[number]) ? parsed : fallback;
}

function readPage(storageKey: string) {
  if (typeof window === "undefined") return 1;
  const parsed = Number(window.sessionStorage.getItem(`${storageKey}.page`));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function useCrmPagination(total: number, storageKey: string, resetKey = "") {
  const [page, setPageState] = useState(() => readPage(storageKey));
  const [pageSize, setPageSizeState] = useState(() => readPageSize(storageKey, 25));
  const mountedRef = useRef(false);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  function setPage(value: number | ((current: number) => number)) {
    setPageState((current) => {
      const next = typeof value === "function" ? value(current) : value;
      window.sessionStorage.setItem(`${storageKey}.page`, String(next));
      return next;
    });
  }

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setPage(1);
  }, [resetKey]);
  useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);

  function setPageSize(value: number) {
    setPageSizeState(value);
    setPage(1);
    window.sessionStorage.setItem(storageKey, String(value));
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);

  return { page, setPage, pageSize, setPageSize, pageCount, start, end };
}

export default function CrmPagination({
  page,
  pageCount,
  pageSize,
  total,
  start,
  end,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  start: number;
  end: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const pages = useMemo(() => {
    const values = new Set([1, pageCount, page - 2, page - 1, page, page + 1, page + 2]);
    return Array.from(values).filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
  }, [page, pageCount]);

  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span aria-live="polite">Показано {total === 0 ? 0 : start + 1}–{end} из {total}</span>
        <label className="flex items-center gap-2">
          Строк на странице
          <select
            aria-label="Количество строк на странице"
            className="h-7 rounded-md border border-slate-200 bg-white px-2 font-medium text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>

      {pageCount > 1 && (
        <nav className="flex flex-wrap items-center gap-1" aria-label="Пагинация">
          <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)} className="h-7 rounded-md border border-slate-200 bg-white px-2 font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Назад</button>
          {pages.map((value, index) => (
            <span key={value} className="contents">
              {index > 0 && value - pages[index - 1] > 1 && <span className="px-1" aria-hidden="true">…</span>}
              <button
                type="button"
                aria-current={value === page ? "page" : undefined}
                onClick={() => onPageChange(value)}
                className={`h-7 min-w-7 rounded-md px-2 font-semibold ${value === page ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`}
              >
                {value}
              </button>
            </span>
          ))}
          <button type="button" disabled={page === pageCount} onClick={() => onPageChange(page + 1)} className="h-7 rounded-md border border-slate-200 bg-white px-2 font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Вперёд</button>
        </nav>
      )}
    </div>
  );
}
