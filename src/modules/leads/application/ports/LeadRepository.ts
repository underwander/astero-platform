import type { DeliveryChannelName, Lead, PendingLeadDelivery } from "../../domain/lead";

export interface LeadRepository {
  create(lead: Lead, deliveryChannels: readonly DeliveryChannelName[]): Promise<void>;
  claimPendingDeliveries(limit: number): Promise<PendingLeadDelivery[]>;
  markDeliverySent(deliveryId: string): Promise<void>;
  markDeliveryFailed(deliveryId: string, error: string, retryAfterSeconds: number): Promise<void>;
}
