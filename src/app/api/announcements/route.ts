import { prisma } from "@/lib/prisma";
import { ensureAnnouncementsTable } from "@/lib/announcements";

export async function GET() {
  await ensureAnnouncementsTable();

  const rows = await prisma.$queryRaw`
    SELECT "id", "title", "text", "imageName", "imageMimeType", "imageBase64", "fontSize", "textColor", "fontFamily", "updatedAt"
    FROM "Announcement"
    WHERE "isPublished" = true
    ORDER BY "updatedAt" DESC
    LIMIT 6
  `;

  return Response.json(rows, { headers: { "Cache-Control": "no-store" } });
}
