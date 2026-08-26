import type { LeadDeliveryChannel } from "./ports/LeadDeliveryChannel";
import type { LeadRepository } from "./ports/LeadRepository";
import type { Lead, LeadRequestContext, NewLeadInput, PendingLeadDelivery } from "../domain/lead";

const MAX_DELIVERY_ERROR_LENGTH = 1_000;

export class LeadService {
  private readonly channelsByName: Map<string, LeadDeliveryChannel>;

  constructor(
    private readonly repository: LeadRepository,
    channels: readonly LeadDeliveryChannel[],
  ) {
    this.channelsByName = new Map(channels.map((channel) => [channel.name, channel]));
  }

  async create(input: NewLeadInput, context: LeadRequestContext = {}) {
    const now = new Date();
    const lead: Lead = {
      id: crypto.randomUUID(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      telegram: input.telegram?.trim() || null,
      country: input.country,
      message: input.message.trim(),
      status: "new",
      source: "website",
      consentGivenAt: now,
      createdAt: now,
      userAgent: context.userAgent?.slice(0, 500) || null,
      referrer: context.referrer?.slice(0, 1_000) || null,
    };

    const configuredChannels = [...this.channelsByName.keys()] as Array<LeadDeliveryChannel["name"]>;
    await this.repository.create(lead, configuredChannels);

    return { id: lead.id, createdAt: lead.createdAt, pendingDeliveries: configuredChannels.length };
  }

  async processPending(limit = 20) {
    const deliveries = await this.repository.claimPendingDeliveries(Math.min(Math.max(limit, 1), 100));
    const results = await Promise.allSettled(deliveries.map((delivery) => this.deliver(delivery)));

    return {
      processed: results.length,
      delivered: results.filter((result) => result.status === "fulfilled").length,
      failed: results.filter((result) => result.status === "rejected").length,
    };
  }

  private async deliver(delivery: PendingLeadDelivery) {
    const channel = this.channelsByName.get(delivery.channel);
    try {
      if (!channel) throw new Error(`Channel ${delivery.channel} is not configured`);
      await channel.deliver(delivery.lead);
      await this.repository.markDeliverySent(delivery.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown delivery error";
      const retryAfterSeconds = Math.min(60 * 2 ** Math.max(delivery.attempts - 1, 0), 3_600);
      await this.repository.markDeliveryFailed(
        delivery.id,
        message.slice(0, MAX_DELIVERY_ERROR_LENGTH),
        retryAfterSeconds,
      );
      throw error;
    }
  }
}
