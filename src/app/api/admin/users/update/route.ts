import { ensureCrmSchema } from "@/lib/crm-schema";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function clean(value: unknown) {
  if (typeof value !== "string") return null;
  const next = value.trim();
  return next ? next : null;
}

export async function PATCH(req: Request) {
  try {
    await ensureCrmSchema();

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
    if (typeof managerId === "string") data.managerId = managerId.trim() || null;

    if (typeof password === "string" && password.trim()) {
      if (password.trim().length < 6) {
        return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      data.password = await bcrypt.hash(password.trim(), 10);
      data.plainPassword = password.trim();
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
