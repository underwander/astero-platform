import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ensureCrmSchema } from "@/lib/crm-schema";
import { getRequestSession } from "@/lib/api-auth";
import { hasCrmPermission } from "@/lib/crm-permissions";
import { logSecurityEvent } from "@/lib/security";

export async function PATCH(req: Request) {
  try {
    await ensureCrmSchema();
    const session = await getRequestSession();
    if (!session) return Response.json({ error: "Session expired" }, { status: 401 });
    if (!hasCrmPermission(session, "RESET_CLIENT_PASSWORD")) {
      await logSecurityEvent(req, {
        type: "CLIENT_PASSWORD_RESET_DENIED",
        risk: "MEDIUM",
        description: `${session.email} attempted a client password reset without permission`,
        userId: session.sub,
        outcome: "BLOCKED",
        classification: "ADMIN",
      });
      return Response.json({ error: "Недостаточно прав для сброса пароля" }, { status: 403 });
    }
    const { userId, password } = await req.json();

    if (!userId || !password || String(password).length < 8) {
      return Response.json({ error: "Нужен новый пароль длиной не менее 8 символов" }, { status: 400 });
    }

    const client = await prisma.user.findFirst({ where: { id: String(userId), role: "CLIENT" }, select: { id: true, email: true } });
    if (!client) return Response.json({ error: "Клиент не найден" }, { status: 404 });

    const rawPassword = String(password);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    await prisma.user.update({ where: { id: client.id }, data: { password: hashedPassword, plainPassword: null } });

    await logSecurityEvent(req, {
      type: "CLIENT_PASSWORD_RESET",
      risk: "MEDIUM",
      description: `${session.email} reset the CRM login password for client ${client.email}`,
      userId: session.sub,
      email: client.email,
      outcome: "SUCCESS",
      classification: "ADMIN",
      signals: ["PASSWORD_VALUE_NOT_LOGGED"],
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
