import type { Pool } from "pg";
import type { RequestRateLimiter } from "../../application/ports/RequestRateLimiter";

export class PostgresRequestRateLimiter implements RequestRateLimiter {
  constructor(private readonly pool: Pool) {}

  async consume(keyHash: string, limit: number, windowSeconds: number) {
    await this.pool.query(
      `DELETE FROM lead_rate_limits
       WHERE key_hash IN (
         SELECT key_hash FROM lead_rate_limits
         WHERE expires_at < NOW() - INTERVAL '1 day'
         LIMIT 100
       )`,
    );

    const result = await this.pool.query<{ request_count: number }>(
      `WITH consumed AS (
         INSERT INTO lead_rate_limits (key_hash, request_count, window_started_at, expires_at)
         VALUES ($1, 1, NOW(), NOW() + ($2 * INTERVAL '1 second'))
         ON CONFLICT (key_hash) DO UPDATE SET
           request_count = CASE
             WHEN lead_rate_limits.expires_at <= NOW() THEN 1
             ELSE lead_rate_limits.request_count + 1
           END,
           window_started_at = CASE
             WHEN lead_rate_limits.expires_at <= NOW() THEN NOW()
             ELSE lead_rate_limits.window_started_at
           END,
           expires_at = CASE
             WHEN lead_rate_limits.expires_at <= NOW() THEN NOW() + ($2 * INTERVAL '1 second')
             ELSE lead_rate_limits.expires_at
           END
         RETURNING request_count
       )
       SELECT request_count FROM consumed`,
      [keyHash, windowSeconds],
    );

    return (result.rows[0]?.request_count || limit + 1) <= limit;
  }
}
