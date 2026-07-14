import type { Metadata } from "next";
import AsteroLanding from "@/components/landing/AsteroLanding";

export const metadata: Metadata = {
  title: "Astero | Premium FinTech trading workspace",
  description:
    "Astero Trader Room is a premium FinTech workspace with a client cabinet, trading terminal, market quotes, analytics, support and CRM-managed landing content.",
  keywords: ["Astero", "trading platform", "client cabinet", "FinTech", "market analytics", "trader room"],
  openGraph: {
    title: "Astero Trader Room",
    description:
      "A premium trading workspace with client cabinet, quotes, analytics, support and modern CRM-controlled content.",
    type: "website",
  },
};

export default function LandingPage() {
  return <AsteroLanding />;
}
