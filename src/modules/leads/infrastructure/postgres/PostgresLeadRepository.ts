import type { Pool } from "pg";
import type { LeadRepository } from "../../application/ports/LeadRepository";
import type { DeliveryChannelName, Lead, LeadStatus, PendingLeadDelivery } from "../../domain/lead";

type DeliveryRow = {
  delivery_id: string;
  channel: DeliveryChannelName;
  attempts: number;
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  telegram: string | null;
  country: string;
  message: string;
  lead_status: LeadStatus;
  source: "website";
  consent_given_at: Date;
  created_at: Date;
  user_agent: string | null;
  referrer: string | null;
};

export class PostgresLeadRepository implements LeadRepository {
  constructor(private readonly pool: Pool) {}

  async create(lead: Lead, deliveryChannels: readonly DeliveryChannelName[]) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO leads (
          id, first_name, last_name, email, phone, telegram, country, message,
          status, source, consent_given_at, user_agent, referrer, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
        [
          lead.id,
          lead.firstName,
          lead.lastName,
          lead.email,
          lead.phone,
          lead.telegram,
          lead.country,
          lead.message,
          lead.status,
          lead.source,
          lead.consentGivenAt,
          lead.userAgent,
          lead.referrer,
          lead.createdAt,
        ],
      );

      for (const channel of deliveryChannels) {
        await client.query(
          `INSERT INTO lead_delivery_outbox (id, lead_id, channel, status, attempts, next_attempt_at, created_at, updated_at)
           VALUES ($1, $2, $3, 'pending', 0, NOW(), NOW(), NOW())
           ON CONFLICT (lead_id, channel) DO NOTHING`,
          [crypto.randomUUID(), lead.id, channel],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async claimPendingDeliveries(limit: number): Promise<PendingLeadDelivery[]> {
    const result = await this.pool.query<DeliveryRow>(
      `WITH candidates AS (
         SELECT id
         FROM lead_delivery_outbox
         WHERE attempts < 8
           AND next_attempt_at <= NOW()
           AND (status IN ('pending', 'failed') OR (status = 'processing' AND updated_at < NOW() - INTERVAL '10 minutes'))
         ORDER BY created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $1
       ), claimed AS (
         UPDATE lead_delivery_outbox AS delivery
         SET status = 'processing', attempts = delivery.attempts + 1, updated_at = NOW()
         FROM candidates
         WHERE delivery.id = candidates.id
         RETURNING delivery.*
       )
       SELECT
         claimed.id AS delivery_id, claimed.channel, claimed.attempts,
         leads.id, leads.first_name, leads.last_name, leads.email, leads.phone,
         leads.telegram, leads.country, leads.message, leads.status AS lead_status,
         leads.source, leads.consent_given_at, leads.created_at, leads.user_agent, leads.referrer
       FROM claimed
       INNER JOIN leads ON leads.id = claimed.lead_id`,
      [limit],
    );

    return result.rows.map((row) => ({
      id: row.delivery_id,
      channel: row.channel,
      attempts: row.attempts,
      lead: {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        telegram: row.telegram,
        country: row.country,
        message: row.message,
        status: row.lead_status,
        source: row.source,
        consentGivenAt: new Date(row.consent_given_at),
        createdAt: new Date(row.created_at),
        userAgent: row.user_agent,
        referrer: row.referrer,
      },
    }));
  }

  async markDeliverySent(deliveryId: string) {
    await this.pool.query(
      `UPDATE lead_delivery_outbox
       SET status = 'sent', delivered_at = NOW(), last_error = NULL, updated_at = NOW()
       WHERE id = $1`,
      [deliveryId],
    );
  }

  async markDeliveryFailed(deliveryId: string, error: string, retryAfterSeconds: number) {
    await this.pool.query(
      `UPDATE lead_delivery_outbox
       SET status = 'failed', last_error = $2,
           next_attempt_at = NOW() + ($3 * INTERVAL '1 second'), updated_at = NOW()
       WHERE id = $1`,
      [deliveryId, error, retryAfterSeconds],
    );
  }
}
