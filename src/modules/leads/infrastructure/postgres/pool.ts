import { Pool } from "pg";
import { serverConfig } from "@/config/server";

const globalForLeadDatabase = globalThis as unknown as { leadDatabasePool?: Pool };

function sslConfiguration() {
  const mode = serverConfig.database.sslMode;
  if (mode === "disable") return false;
  return { rejectUnauthorized: mode === "verify-full" };
}

export function getLeadDatabasePool() {
  const connectionString = serverConfig.database.url;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");

  if (!globalForLeadDatabase.leadDatabasePool) {
    globalForLeadDatabase.leadDatabasePool = new Pool({
      connectionString,
      ssl: sslConfiguration(),
      max: serverConfig.database.poolMax,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      application_name: "financial-disputes-landing",
    });
  }

  return globalForLeadDatabase.leadDatabasePool;
}
