import type { SessionPayload } from "@/lib/session";

export type CrmPermission = "RESET_CLIENT_PASSWORD" | "EDIT_ASSIGNED_CLIENT";

export function hasCrmPermission(session: Pick<SessionPayload, "role"> | null, permission: CrmPermission) {
  if (!session) return false;
  if (permission === "RESET_CLIENT_PASSWORD") return session.role === "ADMIN";
  return session.role === "ADMIN" || session.role === "MANAGER";
}

export function canAccessCrmClient(
  session: Pick<SessionPayload, "sub" | "role">,
  client: { role: string; managerId?: string | null },
) {
  if (client.role !== "CLIENT") return false;
  return session.role === "ADMIN" || (session.role === "MANAGER" && client.managerId === session.sub);
}
