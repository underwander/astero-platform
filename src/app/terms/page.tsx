import { LegalPage } from "@/components/legal/LegalPage";
import { legalDocuments } from "@/content";
import { legalMetadata } from "@/lib/seo";

export const metadata = legalMetadata(legalDocuments.terms.title, legalDocuments.terms.description, "/terms");
export default function Page() {
  return <LegalPage document={legalDocuments.terms} path="/terms" />;
}
