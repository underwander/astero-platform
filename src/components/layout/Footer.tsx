import { Scale } from "lucide-react";
import { siteConfig } from "@/config/site";
import { footerContent } from "@/content";
import { CookieSettingsButton } from "./CookieSettingsButton";

export function Footer() {
  return (
    <footer className="bg-ink-950 border-t border-white/10 px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1344px] flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="border-gold-500/35 text-gold-300 grid size-9 place-items-center rounded-xl border">
            <Scale aria-hidden="true" size={18} />
          </span>
          <div>
            <strong className="font-display text-sm">{siteConfig.shortName}</strong>
            <p className="mt-1 text-xs text-white/60">
              © {new Date().getFullYear()} {siteConfig.operatorName || "Информационный ресурс"}
            </p>
            {siteConfig.legal.registrationDetails ? (
              <p className="mt-1 text-xs text-white/55">{siteConfig.legal.registrationDetails}</p>
            ) : null}
          </div>
        </div>
        <div className="lg:text-right">
          <nav
            aria-label="Правовая информация"
            className="flex max-w-xl flex-wrap gap-x-5 gap-y-3 text-xs text-white/60"
          >
            {footerContent.links.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </a>
            ))}
            <CookieSettingsButton />
            {siteConfig.legal.contactEmail ? (
              <a href={`mailto:${siteConfig.legal.contactEmail}`} className="hover:text-white">
                {siteConfig.legal.contactEmail}
              </a>
            ) : null}
          </nav>
          <p className="mt-3 text-xs leading-5 text-white/55">{footerContent.note}</p>
        </div>
      </div>
    </footer>
  );
}
