import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ensureCrmSchema, getRequestIp } from "@/lib/crm-schema";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session";
import { isIpBlocked, isLoginTemporarilyBlocked, logSecurityEvent } from "@/lib/security";

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

    if (await isLoginTemporarilyBlocked(req, normalizedEmail)) {
      await logSecurityEvent(req, {
        type: "LOGIN_BLOCKED",
        risk: "HIGH",
        description: `Blocked login attempt for ${normalizedEmail}: too many failed attempts`,
      });
      return Response.json({ error: "Too many attempts. Try again later" }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await logSecurityEvent(req, {
        type: "LOGIN_FAILED",
        risk: "MEDIUM",
        description: `Login failed for ${normalizedEmail}: user not found`,
      });
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

    response.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${sessionCookieOptions().maxAge}; HttpOnly; SameSite=Lax${
        sessionCookieOptions().secure ? "; Secure" : ""
      }`
    );

    return response;
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
