import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { getSecurityOverview, logSecurityEvent } from "@/lib/security";
import { ensureCrmSchema, getRequestIp } from "@/lib/crm-schema";

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
    const requestedPage = Number(searchParams.get("page"));
    const requestedPageSize = Number(searchParams.get("pageSize"));
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const pageSize = [25, 50, 100].includes(requestedPageSize) ? requestedPageSize : 25;
    const data = await getSecurityOverview(searchParams.get("search") || "", page, pageSize, {
      outcome: searchParams.get("outcome") || "ALL",
      risk: searchParams.get("risk") || "ALL",
    });

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

    const { ip, mode, reason, note, durationHours, entityType, value } = await req.json();
    const hours = Number(durationHours);
    const expiresAt = Number.isFinite(hours) && hours > 0 ? new Date(Date.now() + Math.min(hours, 24 * 365) * 60 * 60 * 1000) : null;

    if (entityType === "EMAIL" || entityType === "DOMAIN") {
      const normalizedValue = String(value || "").trim().toLowerCase().replace(/^@/, "");
      const valid = entityType === "EMAIL" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue) : /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalizedValue);
      if (!valid) return Response.json({ error: entityType === "EMAIL" ? "Некорректный email" : "Некорректный домен" }, { status: 400 });
      const rule = await prisma.identityAccessRule.upsert({
        where: { kind_value: { kind: entityType, value: normalizedValue } },
        update: { reason: String(reason || "").trim() || null, note: String(note || "").trim().slice(0, 1000) || null, expiresAt, createdBy: session.email },
        create: { kind: entityType, value: normalizedValue, reason: String(reason || "").trim() || null, note: String(note || "").trim().slice(0, 1000) || null, expiresAt, createdBy: session.email },
      });
      await logSecurityEvent(req, { type: "IDENTITY_RULE_UPDATED", risk: "MEDIUM", description: `${session.email} blocked ${entityType.toLowerCase()} ${normalizedValue}`, userId: session.sub, outcome: "INFO", classification: "ADMIN", signals: [expiresAt ? "TEMPORARY_RULE" : "PERMANENT_RULE"] });
      return Response.json(rule);
    }
    const normalizedIp = typeof ip === "string" ? ip.trim() : "";
    const normalizedMode = mode === "WHITELIST" ? "WHITELIST" : "BLACKLIST";

    if (!normalizedIp) {
      return Response.json({ error: "IP is required" }, { status: 400 });
    }
    const cidrPrefix = normalizedIp.includes("/") ? Number(normalizedIp.split("/")[1]) : null;
    if (cidrPrefix !== null && (!Number.isInteger(cidrPrefix) || cidrPrefix < 16 || cidrPrefix > 32)) {
      return Response.json({ error: "Допустим только IPv4 CIDR от /16 до /32" }, { status: 400 });
    }
    const currentIp = getRequestIp(req);
    if (normalizedMode === "BLACKLIST" && currentIp && normalizedIp === currentIp) {
      return Response.json({ error: "Нельзя заблокировать IP текущей административной сессии" }, { status: 409 });
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
        note: typeof note === "string" ? note.trim().slice(0, 1000) || null : null,
        expiresAt,
        createdBy: session.email,
      },
      create: {
        ip: normalizedIp,
        mode: normalizedMode,
        reason: typeof reason === "string" ? reason.trim() || null : null,
        note: typeof note === "string" ? note.trim().slice(0, 1000) || null : null,
        expiresAt,
        createdBy: session.email,
      },
    });

    await logSecurityEvent(req, {
      type: "IP_RULE_UPDATED",
      risk: normalizedMode === "BLACKLIST" ? "MEDIUM" : "LOW",
      description: `${session.email} added ${normalizedIp} to ${normalizedMode}`,
      userId: session.sub,
      outcome: "INFO",
      classification: "ADMIN",
      signals: [expiresAt ? "TEMPORARY_RULE" : "PERMANENT_RULE"],
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

    const { id, ruleType } = await req.json();
    if (!id || typeof id !== "string") {
      return Response.json({ error: "Rule id is required" }, { status: 400 });
    }

    if (ruleType === "IDENTITY") {
      const deleted = await prisma.identityAccessRule.delete({ where: { id } });
      await logSecurityEvent(req, { type: "IDENTITY_RULE_DELETED", risk: "LOW", description: `${session.email} removed ${deleted.kind.toLowerCase()} block for ${deleted.value}`, userId: session.sub, outcome: "INFO", classification: "ADMIN" });
      return Response.json({ ok: true });
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
