import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ensureCrmSchema } from "@/lib/crm-schema";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function POST(req: Request) {
  try {
    await ensureCrmSchema();
    const cookieStore = await cookies();
    const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

    if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
      return Response.json({ error: "Session expired" }, { status: 401 });
    }

    const { email, password, firstName, lastName, phone, country, city, address, balance, role, managerId } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const selectedRole = role === "MANAGER" ? "MANAGER" : "CLIENT";
    if (selectedRole === "MANAGER" && session.role !== "ADMIN") {
      return Response.json({ error: "Only admin can create managers" }, { status: 403 });
    }

    const rawPassword = selectedRole === "CLIENT" ? String(password || "Ww123456") : String(password || "");

    if (!rawPassword) {
      return Response.json({ error: "Password is required" }, { status: 400 });
    }

    if (selectedRole === "CLIENT" && (!firstName || !lastName || !phone || !country)) {
      return Response.json({ error: "First name, last name, phone and country are required for client" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return Response.json({ error: "User already exists" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const initialBalance = balance === undefined || balance === null || balance === "" ? 0 : Number(balance);

    if (Number.isNaN(initialBalance) || initialBalance < 0) {
      return Response.json({ error: "Invalid balance" }, { status: 400 });
    }

    let clientNumber: string | null = null;
    if (selectedRole === "CLIENT") {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const candidate = String(100000 + Math.floor(Math.random() * 1000));
        const exists = await prisma.user.findUnique({ where: { clientNumber: candidate } });
        if (!exists) {
          clientNumber = candidate;
          break;
        }
      }
    }

    const user = await prisma.user.create({
      data: {
        clientNumber,
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        country: country || null,
        city: city || null,
        address: address || null,
        balance: selectedRole === "CLIENT" ? initialBalance : 0,
        role: selectedRole,
        managerId: selectedRole === "CLIENT" ? (session.role === "MANAGER" ? session.sub : managerId || null) : null,
        tradingEnabled: selectedRole !== "CLIENT",
      },
    });

    if (selectedRole === "CLIENT") {
      await prisma.balanceHistory.create({
        data: {
          userId: user.id,
          type: "ACCOUNT_CREATED",
          amount: initialBalance,
          balance: user.balance,
          description: "Client created from CRM",
        },
      });
    }

    return Response.json({ id: user.id, email: user.email, role: user.role, balance: user.balance });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
