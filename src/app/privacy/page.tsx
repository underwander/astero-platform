import { LegalPage } from "@/components/legal/LegalPage";
import { legalDocuments } from "@/content";
import { legalMetadata } from "@/lib/seo";

export const metadata = legalMetadata(legalDocuments.privacy.title, legalDocuments.privacy.description, "/privacy");
export default function Page() {
  return <LegalPage document={legalDocuments.privacy} path="/privacy" />;
}
