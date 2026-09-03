import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { ensureCrmSchema, getRequestIp } from "@/lib/crm-schema";
import {
  ACCOUNT_FAILURE_WINDOW_MS,
  calculateLoginRateLimit,
  IP_FAILURE_WINDOW_MS,
  type LoginRateLimit,
} from "@/lib/login-rate-limit";

export type SecurityRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

function ipv4ToNumber(ip: string) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return null;

  return parts.reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
}

function matchesIpRule(ip: string, rule: string) {
  if (ip === rule) return true;
  if (!rule.includes("/")) return false;

  const [rangeIp, prefixText] = rule.split("/");
  const rangeNumber = ipv4ToNumber(rangeIp);
  const ipNumber = ipv4ToNumber(ip);
  const prefix = Number(prefixText);

  if (rangeNumber === null || ipNumber === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipNumber & mask) === (rangeNumber & mask);
}

function parseUserAgent(userAgent: string | null) {
  const value = userAgent || "";
  const lower = value.toLowerCase();

  const browser =
    lower.includes("edg/")
      ? "Edge"
      : lower.includes("chrome/")
        ? "Chrome"
        : lower.includes("safari/") && !lower.includes("chrome/")
          ? "Safari"
          : lower.includes("firefox/")
            ? "Firefox"
            : "Unknown";

  const os =
    lower.includes("windows")
      ? "Windows"
      : lower.includes("android")
        ? "Android"
        : lower.includes("iphone") || lower.includes("ipad")
          ? "iOS"
          : lower.includes("mac os")
            ? "macOS"
            : lower.includes("linux")
              ? "Linux"
              : "Unknown";

  const device =
    lower.includes("mobile") || lower.includes("iphone") || lower.includes("android")
      ? "Mobile"
      : lower.includes("ipad") || lower.includes("tablet")
        ? "Tablet"
        : "Desktop";

  return { browser, os, device };
}

export async function logSecurityEvent(
  req: Request,
  event: {
    type: string;
    risk?: SecurityRisk;
    description: string;
    userId?: string | null;
    ip?: string | null;
    email?: string | null;
    outcome?: "SUCCESS" | "FAILED" | "BLOCKED" | "INFO";
    failureReason?: string | null;
    classification?: string | null;
    signals?: string[];
  }
) {
  try {
    await ensureCrmSchema();
    const userAgent = req.headers.get("user-agent");
    const parsed = parseUserAgent(userAgent);
    const url = new URL(req.url);
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

    await prisma.securityEvent.create({
      data: {
        type: event.type,
        risk: event.risk || "LOW",
        description: event.description.slice(0, 1000),
        ip: event.ip ?? getRequestIp(req),
        country: req.headers.get("cf-ipcountry") || null,
        city: req.headers.get("x-vercel-ip-city") || req.headers.get("cf-ipcity") || null,
        userAgent,
        browser: parsed.browser,
        os: parsed.os,
        device: parsed.device,
        path: url.pathname,
        userId: event.userId || null,
        email: event.email?.slice(0, 320) || null,
        outcome: event.outcome || "INFO",
        failureReason: event.failureReason || null,
        classification: event.classification || (event.userId ? "KNOWN_ACCOUNT" : "UNKNOWN_VISITOR"),
        requestId,
        signals: event.signals?.length ? JSON.stringify(event.signals) : null,
      },
    });
  } catch (error) {
    // Security telemetry must not turn a valid login into an authentication outage.
    console.error("Security telemetry write failed", error);
  }
}

export async function isIpBlocked(req: Request) {
  try {
    await ensureCrmSchema();
    const ip = getRequestIp(req);
    if (!ip) return false;
    const whitelistRules = await prisma.ipAccessRule.findMany({ where: { mode: "WHITELIST", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
    if (whitelistRules.some((rule) => matchesIpRule(ip, rule.ip))) return false;
    const blacklistRules = await prisma.ipAccessRule.findMany({ where: { mode: "BLACKLIST", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
    return blacklistRules.some((rule) => matchesIpRule(ip, rule.ip));
  } catch (error) {
    console.error("IP rule evaluation failed", error);
    return false;
  }
}

export async function getLoginRateLimit(
  req: Request,
  email: string,
  userId?: string
): Promise<LoginRateLimit> {
  await ensureCrmSchema();

  const ip = getRequestIp(req);
  const nowMs = Date.now();
  const accountWindowStart = new Date(nowMs - ACCOUNT_FAILURE_WINDOW_MS);
  const ipWindowStart = new Date(nowMs - IP_FAILURE_WINDOW_MS);
  const lastSuccess = userId
    ? await prisma.securityEvent.findFirst({
        where: { type: "LOGIN_SUCCESS", userId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      })
    : null;
  const accountSince =
    lastSuccess && lastSuccess.createdAt > accountWindowStart
      ? lastSuccess.createdAt
      : accountWindowStart;

  const [accountFailures, ipFailures] = await Promise.all([
    prisma.securityEvent.findMany({
      where: {
        type: "LOGIN_FAILED",
        createdAt: { gte: accountSince },
        ...(userId
          ? { userId }
          : { userId: null, description: { contains: email, mode: "insensitive" } }),
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    ip
      ? prisma.securityEvent.findMany({
          where: { type: "LOGIN_FAILED", ip, createdAt: { gte: ipWindowStart } },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  return calculateLoginRateLimit({
    nowMs,
    accountFailureTimes: accountFailures.map((event) => event.createdAt),
    ipFailureTimes: ipFailures.map((event) => event.createdAt),
  });
}

export async function isEmailBlocked(email: string) {
  try {
    await ensureCrmSchema();
    const normalizedEmail = email.trim().toLowerCase();
    const domain = normalizedEmail.split("@")[1] || "";
    if (!normalizedEmail || !domain) return false;
    const match = await prisma.identityAccessRule.findFirst({
      where: { OR: [{ kind: "EMAIL", value: normalizedEmail }, { kind: "DOMAIN", value: domain }], AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }] },
      select: { kind: true },
    });
    return match?.kind || false;
  } catch (error) {
    console.error("Identity rule evaluation failed", error);
    return false;
  }
}

export async function getSecurityOverview(
  search = "",
  page = 1,
  pageSize = 25,
  filters: { outcome?: string; risk?: string } = {}
) {
  await ensureCrmSchema();

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const where: Prisma.SecurityEventWhereInput = {
    ...(search.trim() ? {
      OR: [
          { ip: { contains: search.trim(), mode: "insensitive" as const } },
          { email: { contains: search.trim(), mode: "insensitive" as const } },
          { description: { contains: search.trim(), mode: "insensitive" as const } },
          { type: { contains: search.trim(), mode: "insensitive" as const } },
          { user: { email: { contains: search.trim(), mode: "insensitive" as const } } },
      ],
    } : {}),
    ...(filters.outcome && filters.outcome !== "ALL" ? { outcome: filters.outcome } : {}),
    ...(filters.risk && filters.risk !== "ALL" ? { risk: filters.risk } : {}),
  };

  const [events, totalEvents, attempts24h, blockedIps, activeUsers, criticalEvents, ipRules, countryStats, outcomeStats, uniqueIpRows, unknownAttempts, identityRules] = await Promise.all([
    prisma.securityEvent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.securityEvent.count({ where }),
    prisma.securityEvent.count({
      where: {
        type: { in: ["LOGIN_SUCCESS", "LOGIN_FAILED", "LOGIN_BLOCKED"] },
        createdAt: { gte: since24h },
      },
    }),
    prisma.ipAccessRule.count({ where: { mode: "BLACKLIST" } }),
    prisma.user.count({ where: { lastSeenAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } }),
    prisma.securityEvent.findMany({
      where: {
        risk: { in: ["HIGH", "CRITICAL"] },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.ipAccessRule.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.securityEvent.groupBy({
      by: ["country"],
      where: {
        createdAt: { gte: since24h },
        country: { not: null },
      },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    }),
    prisma.securityEvent.groupBy({
      by: ["outcome"],
      where: { createdAt: { gte: since24h } },
      _count: { _all: true },
    }),
    prisma.securityEvent.groupBy({
      by: ["ip"],
      where: { createdAt: { gte: since24h }, ip: { not: null } },
    }),
    prisma.securityEvent.count({
      where: { createdAt: { gte: since24h }, classification: "UNKNOWN_ACCOUNT_ATTEMPT" },
    }),
    prisma.identityAccessRule.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const outcomeCount = (outcome: string) => outcomeStats.find((item) => item.outcome === outcome)?._count._all || 0;

  return {
    summary: {
      attempts24h,
      blockedIps,
      activeUsers,
      criticalCount: criticalEvents.length,
      successfulLogins: outcomeCount("SUCCESS"),
      failedLogins: outcomeCount("FAILED"),
      blockedAttempts: outcomeCount("BLOCKED"),
      uniqueIps: uniqueIpRows.length,
      unknownAttempts,
    },
    events,
    pagination: { page, pageSize, totalItems: totalEvents, totalPages: Math.max(1, Math.ceil(totalEvents / pageSize)) },
    criticalEvents,
    ipRules,
    identityRules,
    countryStats,
  };
}
