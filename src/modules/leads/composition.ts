import { LeadService } from "./application/LeadService";
import { createDeliveryChannels } from "./infrastructure/integrations/createDeliveryChannels";
import { getLeadDatabasePool } from "./infrastructure/postgres/pool";
import { PostgresLeadRepository } from "./infrastructure/postgres/PostgresLeadRepository";
import { PostgresRequestRateLimiter } from "./infrastructure/postgres/PostgresRequestRateLimiter";

export function createLeadService() {
  const repository = new PostgresLeadRepository(getLeadDatabasePool());
  return new LeadService(repository, createDeliveryChannels());
}

export function createLeadRateLimiter() {
  return new PostgresRequestRateLimiter(getLeadDatabasePool());
}
