import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ensureAnnouncementsTable } from "@/lib/announcements";

type AnnouncementRow = {
  id: string;
  title: string;
  text: string;
  imageName: string | null;
  imageMimeType: string | null;
  imageBase64: string | null;
  fontSize: number;
  textColor: string;
  fontFamily: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET() {
  await ensureAnnouncementsTable();

  const rows = await prisma.$queryRaw<AnnouncementRow[]>`
    SELECT "id", "title", "text", "imageName", "imageMimeType", "imageBase64", "fontSize", "textColor", "fontFamily", "isPublished", "createdAt", "updatedAt"
    FROM "Announcement"
    ORDER BY "updatedAt" DESC
  `;

  return Response.json(rows, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  await ensureAnnouncementsTable();

  const body = await req.json();
  const id = body.id ? String(body.id) : randomUUID();
  const title = String(body.title || "").slice(0, 140);
  const text = String(body.text || "").slice(0, 4000);
  const image = body.image || null;
  const imageName = image?.name ? String(image.name).slice(0, 180) : null;
  const imageMimeType = image?.mimeType ? String(image.mimeType).slice(0, 120) : null;
  const imageBase64 = image?.base64 ? String(image.base64) : null;
  const fontSize = Math.min(42, Math.max(12, Number(body.fontSize || 16)));
  const textColor = /^#[0-9a-f]{6}$/i.test(String(body.textColor || "")) ? String(body.textColor) : "#0f172a";
  const fontFamily = ["Inter", "Arial", "Georgia", "Times New Roman", "Courier New"].includes(String(body.fontFamily))
    ? String(body.fontFamily)
    : "Inter";
  const isPublished = typeof body.isPublished === "boolean" ? body.isPublished : true;

  if (!title.trim() && !text.trim() && !imageBase64) {
    return Response.json({ error: "Announcement content required" }, { status: 400 });
  }

  if (imageBase64 && (!imageMimeType || imageBase64.length > 6_500_000)) {
    return Response.json({ error: "Images up to 5MB are supported" }, { status: 400 });
  }

  const rows = await prisma.$queryRaw<AnnouncementRow[]>`
    INSERT INTO "Announcement" ("id", "title", "text", "imageName", "imageMimeType", "imageBase64", "fontSize", "textColor", "fontFamily", "isPublished", "updatedAt")
    VALUES (${id}, ${title}, ${text}, ${imageName}, ${imageMimeType}, ${imageBase64}, ${fontSize}, ${textColor}, ${fontFamily}, ${isPublished}, NOW())
    ON CONFLICT ("id") DO UPDATE SET
      "title" = EXCLUDED."title",
      "text" = EXCLUDED."text",
      "imageName" = COALESCE(EXCLUDED."imageName", "Announcement"."imageName"),
      "imageMimeType" = COALESCE(EXCLUDED."imageMimeType", "Announcement"."imageMimeType"),
      "imageBase64" = COALESCE(EXCLUDED."imageBase64", "Announcement"."imageBase64"),
      "fontSize" = EXCLUDED."fontSize",
      "textColor" = EXCLUDED."textColor",
      "fontFamily" = EXCLUDED."fontFamily",
      "isPublished" = EXCLUDED."isPublished",
      "updatedAt" = NOW()
    RETURNING "id", "title", "text", "imageName", "imageMimeType", "imageBase64", "fontSize", "textColor", "fontFamily", "isPublished", "createdAt", "updatedAt"
  `;

  return Response.json(rows[0], { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(req: Request) {
  await ensureAnnouncementsTable();

  const body = await req.json().catch(() => null);
  const id = body?.id ? String(body.id) : "";

  if (!id) {
    return Response.json({ error: "Announcement id required" }, { status: 400 });
  }

  await prisma.$executeRaw`
    DELETE FROM "Announcement"
    WHERE "id" = ${id}
  `;

  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
