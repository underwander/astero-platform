import { defaultLandingContent, getLandingContentRows } from "@/lib/landing-content";

export async function GET() {
  try {
    const entries = await getLandingContentRows(false);
    return Response.json(entries, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(defaultLandingContent, { headers: { "Cache-Control": "no-store" } });
  }
}
