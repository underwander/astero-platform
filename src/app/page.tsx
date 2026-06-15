import type { Metadata } from "next";
import AsteroLanding from "@/components/landing/AsteroLanding";

export const metadata: Metadata = {
  title: "Astero | Trading platform and client cabinet",
  description:
    "Astero Trader Room is a modern trading workspace with a client cabinet, market quotes, analytics and support.",
};

export default function LandingPage() {
  return <AsteroLanding />;
}
