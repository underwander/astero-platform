"use client";

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))}
      className="text-left hover:text-white"
    >
      Настройки cookies
    </button>
  );
}
