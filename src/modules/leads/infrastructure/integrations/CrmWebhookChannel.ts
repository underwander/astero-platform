import type { LeadDeliveryChannel } from "../../application/ports/LeadDeliveryChannel";
import type { Lead } from "../../domain/lead";

export class CrmWebhookChannel implements LeadDeliveryChannel {
  readonly name = "crm" as const;

  constructor(
    private readonly url: string,
    private readonly token?: string,
  ) {}

  async deliver(lead: Lead) {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({
        event: "lead.created",
        version: 1,
        lead: {
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          telegram: lead.telegram,
          country: lead.country,
          message: lead.message,
          source: lead.source,
          consentGivenAt: lead.consentGivenAt.toISOString(),
          createdAt: lead.createdAt.toISOString(),
        },
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`CRM webhook returned ${response.status}`);
  }
}
