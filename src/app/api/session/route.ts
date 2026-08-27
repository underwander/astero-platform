import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  expiredSessionCookieHeader,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    const response = Response.json({ error: "Session expired" }, { status: 401 });
    response.headers.append("Set-Cookie", expiredSessionCookieHeader());
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, role: true, isBlocked: true, balance: true },
  });

  if (!user || user.isBlocked) {
    const response = Response.json({ error: "Session expired" }, { status: 401 });
    response.headers.append("Set-Cookie", expiredSessionCookieHeader());
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  return Response.json(user, { headers: { "Cache-Control": "no-store" } });
}
