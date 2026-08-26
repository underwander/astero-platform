import { JsonLd } from "@/components/legal/JsonLd";
import { homeSchema } from "@/lib/seo";
import { AdvantagesSection } from "@/sections/AdvantagesSection";
import { ConsultationSection } from "@/sections/ConsultationSection";
import { FaqSection } from "@/sections/FaqSection";
import { HeroSection } from "@/sections/HeroSection";
import { ProcessSection } from "@/sections/ProcessSection";
import { ServicesSection } from "@/sections/ServicesSection";

export default function HomePage() {
  return (
    <>
      {homeSchema ? <JsonLd data={homeSchema} /> : null}
      <main id="main-content">
        <HeroSection />
        <ServicesSection />
        <ProcessSection />
        <AdvantagesSection />
        <FaqSection />
        <ConsultationSection />
      </main>
    </>
  );
}
