import { LegalPage } from "@/components/legal/LegalPage";
import { legalDocuments } from "@/content";
import { legalMetadata } from "@/lib/seo";

export const metadata = legalMetadata(
  legalDocuments.disclaimer.title,
  legalDocuments.disclaimer.description,
  "/disclaimer",
);
export default function Page() {
  return <LegalPage document={legalDocuments.disclaimer} path="/disclaimer" />;
}
