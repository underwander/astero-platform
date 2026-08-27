import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { expiredSessionCookieHeader, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function POST() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (session?.sub) {
    await prisma.user
      .update({
        where: { id: session.sub },
        data: { lastSeenAt: null },
      })
      .catch(() => null);
  }

  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", expiredSessionCookieHeader());
  response.headers.set("Cache-Control", "no-store");

  return response;
}
