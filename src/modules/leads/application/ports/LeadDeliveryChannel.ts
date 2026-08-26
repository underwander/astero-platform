import type { DeliveryChannelName, Lead } from "../../domain/lead";

export interface LeadDeliveryChannel {
  readonly name: DeliveryChannelName;
  deliver(lead: Lead): Promise<void>;
}
