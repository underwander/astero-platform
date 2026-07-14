import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, type SessionPayload, verifySessionToken } from "@/lib/session";

const STAFF_ROLES = new Set(["ADMIN", "MANAGER"]);

export async function getRequestSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function resolveScopedUserId(
  requestedUserId?: string | null,
  options: { allowStaffAccess?: boolean } = {}
): Promise<{ session: SessionPayload; userId: string } | Response> {
  const session = await getRequestSession();

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isStaff = STAFF_ROLES.has(session.role);

  if (isStaff && options.allowStaffAccess && requestedUserId) {
    return { session, userId: requestedUserId };
  }

  if (requestedUserId && requestedUserId !== session.sub && !isStaff) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return { session, userId: isStaff && requestedUserId ? requestedUserId : session.sub };
}

export function isAuthResponse(value: unknown): value is Response {
  return value instanceof Response;
}
