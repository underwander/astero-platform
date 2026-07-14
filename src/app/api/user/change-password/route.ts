import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isAuthResponse, resolveScopedUserId } from "@/lib/api-auth";

export async function PATCH(req: Request) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();
    const scoped = await resolveScopedUserId(userId);

    if (isAuthResponse(scoped)) return scoped;

    if (!currentPassword || !newPassword || String(newPassword).length < 6) {
      return Response.json({ error: "Current password and new password with at least 6 characters required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: scoped.userId } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return Response.json({ error: "Current password is incorrect" }, { status: 401 });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: scoped.userId },
      data: {
        password: hashedPassword,
        plainPassword: String(newPassword),
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
