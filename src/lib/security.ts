import { prisma } from "@/lib/prisma";
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
  }
) {
  await ensureCrmSchema();

  const userAgent = req.headers.get("user-agent");
  const parsed = parseUserAgent(userAgent);
  const url = new URL(req.url);

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
    },
  });
}

export async function isIpBlocked(req: Request) {
  await ensureCrmSchema();

  const ip = getRequestIp(req);
  if (!ip) return false;

  const whitelistRules = await prisma.ipAccessRule.findMany({
    where: {
      mode: "WHITELIST",
    },
  });

  if (whitelistRules.some((rule) => matchesIpRule(ip, rule.ip))) return false;

  const blacklistRules = await prisma.ipAccessRule.findMany({
    where: {
      mode: "BLACKLIST",
    },
  });

  return blacklistRules.some((rule) => matchesIpRule(ip, rule.ip));
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

export async function getSecurityOverview(search = "", page = 1, pageSize = 25) {
  await ensureCrmSchema();

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const where = search.trim()
    ? {
        OR: [
          { ip: { contains: search.trim(), mode: "insensitive" as const } },
          { description: { contains: search.trim(), mode: "insensitive" as const } },
          { type: { contains: search.trim(), mode: "insensitive" as const } },
          { user: { email: { contains: search.trim(), mode: "insensitive" as const } } },
        ],
      }
    : undefined;

  const [events, totalEvents, attempts24h, blockedIps, activeUsers, criticalEvents, ipRules, countryStats] = await Promise.all([
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
  ]);

  return {
    summary: {
      attempts24h,
      blockedIps,
      activeUsers,
      criticalCount: criticalEvents.length,
    },
    events,
    pagination: { page, pageSize, totalItems: totalEvents, totalPages: Math.max(1, Math.ceil(totalEvents / pageSize)) },
    criticalEvents,
    ipRules,
    countryStats,
  };
}
