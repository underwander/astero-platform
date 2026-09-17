"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type EmojiItem = { emoji: string; name: string; category: string };

const emojiItems: EmojiItem[] = [
  ...["😀 улыбка", "😊 радость", "😂 смех", "🥰 любовь", "😍 восторг", "😎 круто", "🤔 думаю", "😇 отлично", "🥳 праздник", "😢 грусть", "😡 злость", "🤯 удивление", "🙏 спасибо", "👍 нравится", "👍🏻 нравится светлый", "👍🏽 нравится средний", "👍🏿 нравится тёмный", "👎 не нравится", "👏 аплодисменты", "🙌 успех", "🤝 договорились", "💪 сила"].map((value) => { const [emoji, ...name] = value.split(" "); return { emoji, name: name.join(" "), category: "Люди" }; }),
  ...["❤️ сердце", "💚 зелёное сердце", "💙 синее сердце", "💛 жёлтое сердце", "💯 сто", "✨ блеск", "🔥 огонь", "⭐ звезда", "🎉 праздник", "🎯 цель", "✅ готово", "❌ ошибка", "⚠️ внимание", "💡 идея", "📌 важно", "🚀 запуск"].map((value) => { const [emoji, ...name] = value.split(" "); return { emoji, name: name.join(" "), category: "Символы" }; }),
  ...["📞 звонок", "📧 письмо", "💬 сообщение", "📝 заметка", "📅 календарь", "⏰ напоминание", "⌛ ожидание", "📎 вложение", "📁 папка", "📊 график", "💼 работа", "💰 деньги", "💳 оплата", "🧾 счёт", "🔒 закрыто", "🔑 ключ"].map((value) => { const [emoji, ...name] = value.split(" "); return { emoji, name: name.join(" "), category: "Работа" }; }),
  ...["🏠 дом", "🚗 машина", "✈️ самолёт", "🌍 мир", "☀️ солнце", "🌧️ дождь", "☕ кофе", "🍕 пицца", "🎁 подарок", "🏆 награда", "👨‍💻 разработчик", "👩‍💻 разработчица", "🏳️‍🌈 радуга", "🇺🇦 Украина"].map((value) => { const [emoji, ...name] = value.split(" "); return { emoji, name: name.join(" "), category: "Разное" }; }),
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  ariaLabel?: string;
  "aria-label"?: string;
  autoFocus?: boolean;
  maxLength?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

export default function EmojiTextField({ value, onChange, multiline = false, className = "", placeholder, required, disabled, rows, ariaLabel, "aria-label": ariaLabelAttribute, autoFocus, maxLength, onKeyDown }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const selectionRef = useRef({ start: value.length, end: value.length });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");
  const categories = ["Все", "Люди", "Символы", "Работа", "Разное"];

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", keyboard); };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru");
    return emojiItems.filter((item) => (category === "Все" || item.category === category) && (!query || `${item.name} ${item.emoji}`.toLocaleLowerCase("ru").includes(query)));
  }, [category, search]);

  function rememberSelection() {
    const field = fieldRef.current;
    if (!field) return;
    selectionRef.current = { start: field.selectionStart ?? value.length, end: field.selectionEnd ?? value.length };
  }

  function insert(emoji: string) {
    const { start, end } = selectionRef.current;
    const next = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
    const cursor = start + emoji.length;
    onChange(next);
    requestAnimationFrame(() => {
      fieldRef.current?.focus();
      fieldRef.current?.setSelectionRange(cursor, cursor);
      selectionRef.current = { start: cursor, end: cursor };
    });
  }

  const shared = {
    value,
    placeholder,
    required,
    disabled,
    autoFocus,
    maxLength,
    "aria-label": ariaLabelAttribute || ariaLabel,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { onChange(event.target.value); selectionRef.current = { start: event.target.selectionStart ?? event.target.value.length, end: event.target.selectionEnd ?? event.target.value.length }; },
    onSelect: rememberSelection,
    onKeyUp: rememberSelection,
    onClick: rememberSelection,
    onKeyDown,
    className: `${className} pr-11`,
  };

  return <div ref={rootRef} className="relative w-full">
    {multiline
      ? <textarea ref={fieldRef as React.RefObject<HTMLTextAreaElement>} rows={rows} {...shared} />
      : <input ref={fieldRef as React.RefObject<HTMLInputElement>} type="text" {...shared} />}
    <button type="button" disabled={disabled} aria-label="Выбрать эмодзи" aria-expanded={open} title="Вставить эмодзи" onMouseDown={(event) => { event.preventDefault(); rememberSelection(); }} onClick={() => setOpen((value) => !value)} className={`absolute right-2 z-10 grid size-7 place-items-center rounded-md text-base transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${multiline ? "bottom-2" : "top-1/2 -translate-y-1/2"}`}>😊</button>
    {open && <div role="dialog" aria-label="Выбор эмодзи" className="absolute right-0 top-full z-[130] mt-2 w-[min(340px,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl">
      <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск эмодзи..." aria-label="Поиск эмодзи" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" />
      <div className="mt-2 flex gap-1 overflow-x-auto pb-1">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${category === item ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}</div>
      <div className="mt-2 grid max-h-52 grid-cols-7 gap-1 overflow-y-auto" role="listbox">{filtered.map((item, index) => <button key={`${item.emoji}-${index}`} type="button" role="option" aria-selected={false} aria-label={item.name} title={item.name} onMouseDown={(event) => event.preventDefault()} onClick={() => insert(item.emoji)} className="grid size-10 place-items-center rounded-lg text-xl hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">{item.emoji}</button>)}</div>
      {filtered.length === 0 && <p className="py-5 text-center text-sm text-slate-400">Ничего не найдено</p>}
    </div>}
  </div>;
}
