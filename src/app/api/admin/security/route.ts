import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { getSecurityOverview, logSecurityEvent } from "@/lib/security";
import { ensureCrmSchema } from "@/lib/crm-schema";

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return session?.role === "ADMIN" ? session : null;
}

export async function GET(req: Request) {
  try {
    const session = await requireAdmin();
    if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const data = await getSecurityOverview(searchParams.get("search") || "");

    return Response.json(data);
  } catch (error) {
    console.error("Security overview error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureCrmSchema();
    const session = await requireAdmin();
    if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { ip, mode, reason } = await req.json();
    const normalizedIp = typeof ip === "string" ? ip.trim() : "";
    const normalizedMode = mode === "WHITELIST" ? "WHITELIST" : "BLACKLIST";

    if (!normalizedIp) {
      return Response.json({ error: "IP is required" }, { status: 400 });
    }

    const rule = await prisma.ipAccessRule.upsert({
      where: {
        ip_mode: {
          ip: normalizedIp,
          mode: normalizedMode,
        },
      },
      update: {
        reason: typeof reason === "string" ? reason.trim() || null : null,
      },
      create: {
        ip: normalizedIp,
        mode: normalizedMode,
        reason: typeof reason === "string" ? reason.trim() || null : null,
      },
    });

    await logSecurityEvent(req, {
      type: "IP_RULE_UPDATED",
      risk: normalizedMode === "BLACKLIST" ? "MEDIUM" : "LOW",
      description: `${session.email} added ${normalizedIp} to ${normalizedMode}`,
      userId: session.sub,
    });

    return Response.json(rule);
  } catch (error) {
    console.error("Security IP rule error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureCrmSchema();
    const session = await requireAdmin();
    if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return Response.json({ error: "Rule id is required" }, { status: 400 });
    }

    const deleted = await prisma.ipAccessRule.delete({ where: { id } });
    await logSecurityEvent(req, {
      type: "IP_RULE_DELETED",
      risk: "LOW",
      description: `${session.email} removed ${deleted.ip} from ${deleted.mode}`,
      userId: session.sub,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Security IP rule delete error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
