import { ensureCrmSchema } from "@/lib/crm-schema";
import { prisma } from "@/lib/prisma";
import { getRequestSession } from "@/lib/api-auth";
import { canAccessCrmClient, hasCrmPermission } from "@/lib/crm-permissions";

function clean(value: unknown) {
  if (typeof value !== "string") return null;
  const next = value.trim();
  return next ? next : null;
}

export async function PATCH(req: Request) {
  try {
    await ensureCrmSchema();
    const session = await getRequestSession();
    if (!session || !hasCrmPermission(session, "EDIT_ASSIGNED_CLIENT")) {
      return Response.json({ error: "Session expired" }, { status: 401 });
    }

    const {
      userId,
      email,
      firstName,
      lastName,
      phone,
      country,
      city,
      address,
      kycStatus,
      managerId,
      password,
    } = await req.json();

    if (!userId || typeof userId !== "string") {
      return Response.json({ error: "UserId required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, managerId: true } });
    if (!existing || !canAccessCrmClient(session, existing)) {
      return Response.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const data: Record<string, unknown> = {
      firstName: clean(firstName),
      lastName: clean(lastName),
      phone: clean(phone),
      country: clean(country),
      city: clean(city),
      address: clean(address),
    };

    if (typeof email === "string" && email.trim()) data.email = email.trim().toLowerCase();
    if (typeof kycStatus === "string" && kycStatus.trim()) data.kycStatus = kycStatus.trim();
    if (typeof managerId === "string") data.managerId = session.role === "ADMIN" ? managerId.trim() || null : session.sub;

    if (typeof password === "string" && password.trim()) {
      return Response.json({ error: "Используйте защищённую операцию сброса пароля" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        city: true,
        address: true,
        role: true,
        kycStatus: true,
        managerId: true,
      },
    });

    return Response.json(user);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "User update error" }, { status: 500 });
  }
}
