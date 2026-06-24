import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ensureCrmSchema, getRequestIp } from "@/lib/crm-schema";

export async function POST(req: Request) {
  try {
    await ensureCrmSchema();
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return Response.json(
        { error: "Wrong password" },
        { status: 401 }
      );
    }

    if (user.isBlocked) {
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

    return Response.json({
      id: user.id,
      email: user.email,
      balance: user.balance,
      role: user.role,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
