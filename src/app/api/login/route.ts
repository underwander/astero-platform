import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ensureCrmSchema, getRequestIp } from "@/lib/crm-schema";
import { createSessionToken, sessionCookieHeader } from "@/lib/session";
import { getLoginRateLimit, isIpBlocked, logSecurityEvent } from "@/lib/security";
import type { LoginRateLimit } from "@/lib/login-rate-limit";

const INVALID_PASSWORD_HASH = "$2b$10$u72CjnAp.lkcfLjxvll93egju3VZ2mTM0L7ZzzQY4kLgdNMYM40fq";

function rateLimitResponse(rateLimit: LoginRateLimit) {
  return Response.json(
    {
      error: "Too many attempts. Try again later",
      blocked: true,
      retryAfter: rateLimit.retryAfterSeconds,
      blockedUntil: rateLimit.blockedUntilMs
        ? new Date(rateLimit.blockedUntilMs).toISOString()
        : null,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(rateLimit.retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    await ensureCrmSchema();
    const { email, password } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password) {
      return Response.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    if (await isIpBlocked(req)) {
      await logSecurityEvent(req, {
        type: "LOGIN_BLOCKED",
        risk: "HIGH",
        description: `Blocked login attempt for ${normalizedEmail}: IP is blacklisted`,
      });
      return Response.json({ error: "Access temporarily restricted" }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    const rateLimit = await getLoginRateLimit(req, normalizedEmail, user?.id);

    if (rateLimit.limited) {
      await logSecurityEvent(req, {
        type: "LOGIN_BLOCKED",
        risk: "HIGH",
        description: `Blocked login attempt for ${normalizedEmail}: ${rateLimit.reason?.toLowerCase()} cooldown`,
        userId: user?.id,
      });
      return rateLimitResponse(rateLimit);
    }

    if (!user) {
      await bcrypt.compare(String(password), INVALID_PASSWORD_HASH);
      await logSecurityEvent(req, {
        type: "LOGIN_FAILED",
        risk: "MEDIUM",
        description: `Login failed for ${normalizedEmail}: user not found`,
      });
      const updatedRateLimit = await getLoginRateLimit(req, normalizedEmail);
      if (updatedRateLimit.limited) return rateLimitResponse(updatedRateLimit);
      return Response.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await logSecurityEvent(req, {
        type: "LOGIN_FAILED",
        risk: "MEDIUM",
        description: `Login failed for ${normalizedEmail}: wrong password`,
        userId: user.id,
      });
      const updatedRateLimit = await getLoginRateLimit(req, normalizedEmail, user.id);
      if (updatedRateLimit.limited) return rateLimitResponse(updatedRateLimit);
      return Response.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.isBlocked) {
      await logSecurityEvent(req, {
        type: "LOGIN_BLOCKED",
        risk: "HIGH",
        description: `Blocked account login attempt for ${normalizedEmail}`,
        userId: user.id,
      });
      return Response.json(
        { error: "Your account is blocked" },
        { status: 403 }
      );
    }

    const loggedInAt = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plainPassword: String(password),
        lastLoginAt: loggedInAt,
        lastSeenAt: loggedInAt,
        lastIp: getRequestIp(req),
      },
    });

    await logSecurityEvent(req, {
      type: "LOGIN_SUCCESS",
      risk: "LOW",
      description: `Successful login for ${user.email}`,
      userId: user.id,
    });

    const token = await createSessionToken(user);
    const response = Response.json({
      id: user.id,
      email: user.email,
      balance: user.balance,
      role: user.role,
      isBlocked: user.isBlocked,
    });

    response.headers.append("Set-Cookie", sessionCookieHeader(token));
    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
