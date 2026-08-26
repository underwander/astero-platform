import { LegalPage } from "@/components/legal/LegalPage";
import { legalDocuments } from "@/content";
import { legalMetadata } from "@/lib/seo";

export const metadata = legalMetadata(legalDocuments.cookies.title, legalDocuments.cookies.description, "/cookies");
export default function Page() {
  return <LegalPage document={legalDocuments.cookies} path="/cookies" />;
}
