import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getRequestSession } from "@/lib/api-auth";
import {
  defaultLandingContent,
  ensureLandingContentTable,
  getLandingContentRows,
  type LandingContentKind,
} from "@/lib/landing-content";

const allowedKinds = new Set<LandingContentKind>([
  "hero",
  "stats",
  "cards",
  "accounts",
  "banner",
  "news",
  "articles",
  "calendar",
  "calculator",
  "faq",
  "reviews",
  "cta",
  "footer",
  "seo",
]);

function cleanText(value: unknown, limit: number) {
  return String(value || "").slice(0, limit);
}

function cleanJson(value: unknown) {
  const text = String(value || "{}");
  JSON.parse(text);
  return text.slice(0, 20000);
}

async function requireStaff() {
  const session = await getRequestSession();
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireStaff();
  if (!session) {
    return Response.json({ error: "Session expired" }, { status: 401 });
  }

  const entries = await getLandingContentRows(true);
  return Response.json(entries, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request) {
  const session = await requireStaff();
  if (!session) {
    return Response.json({ error: "Session expired" }, { status: 401 });
  }

  await ensureLandingContentTable();

  const body = await req.json().catch(() => null);
  const key = cleanText(body?.key, 80);
  const existingDefault = defaultLandingContent.find((entry) => entry.key === key);
  const kind = allowedKinds.has(body?.kind) ? body.kind : existingDefault?.kind || "cards";
  let dataJson = "{}";

  if (!key) {
    return Response.json({ error: "Landing block key required" }, { status: 400 });
  }

  try {
    dataJson = cleanJson(body?.dataJson);
  } catch {
    return Response.json({ error: "JSON настроек блока заполнен некорректно" }, { status: 400 });
  }

  const titleRu = cleanText(body?.titleRu, 500);
  const titleEn = cleanText(body?.titleEn, 500);
  const bodyRu = cleanText(body?.bodyRu, 6000);
  const bodyEn = cleanText(body?.bodyEn, 6000);
  const isVisible = typeof body?.isVisible === "boolean" ? body.isVisible : true;
  const sortOrder = Math.max(0, Math.min(9999, Number(body?.sortOrder || 0)));

  const id = randomUUID();
  const rows = await prisma.$queryRaw`
    INSERT INTO "LandingContent" ("id", "key", "titleRu", "titleEn", "bodyRu", "bodyEn", "kind", "dataJson", "isVisible", "sortOrder", "updatedAt")
    VALUES (${id}, ${key}, ${titleRu}, ${titleEn}, ${bodyRu}, ${bodyEn}, ${kind}, ${dataJson}, ${isVisible}, ${sortOrder}, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "titleRu" = EXCLUDED."titleRu",
      "titleEn" = EXCLUDED."titleEn",
      "bodyRu" = EXCLUDED."bodyRu",
      "bodyEn" = EXCLUDED."bodyEn",
      "kind" = EXCLUDED."kind",
      "dataJson" = EXCLUDED."dataJson",
      "isVisible" = EXCLUDED."isVisible",
      "sortOrder" = EXCLUDED."sortOrder",
      "updatedAt" = NOW()
    RETURNING "id", "key", "titleRu", "titleEn", "bodyRu", "bodyEn", "kind", "dataJson", "isVisible", "sortOrder", "createdAt", "updatedAt"
  `;

  return Response.json(Array.isArray(rows) ? rows[0] : rows, { headers: { "Cache-Control": "no-store" } });
}
