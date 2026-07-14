import { prisma } from "@/lib/prisma";
import { isAuthResponse, resolveScopedUserId } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scoped = await resolveScopedUserId(searchParams.get("userId"), { allowStaffAccess: true });

    if (isAuthResponse(scoped)) return scoped;

    const user = await prisma.user.findUnique({
      where: { id: scoped.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        city: true,
        address: true,
        balance: true,
        role: true,
        kycStatus: true,
      },
    });

    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json(user);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
