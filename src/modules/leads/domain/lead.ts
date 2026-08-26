export type DeliveryChannelName = "crm" | "telegram" | "email";
export type LeadStatus = "new" | "in_progress" | "qualified" | "closed" | "archived";

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegram: string | null;
  country: string;
  message: string;
  status: LeadStatus;
  source: "website";
  consentGivenAt: Date;
  createdAt: Date;
  userAgent: string | null;
  referrer: string | null;
};

export type NewLeadInput = Pick<Lead, "firstName" | "lastName" | "email" | "phone" | "country" | "message"> & {
  telegram?: string;
};

export type LeadRequestContext = {
  userAgent?: string | null;
  referrer?: string | null;
};

export type PendingLeadDelivery = {
  id: string;
  lead: Lead;
  channel: DeliveryChannelName;
  attempts: number;
};
