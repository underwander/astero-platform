import type { LeadDeliveryChannel } from "../../application/ports/LeadDeliveryChannel";
import { serverConfig } from "@/config/server";
import { CrmWebhookChannel } from "./CrmWebhookChannel";
import { EmailChannel } from "./EmailChannel";
import { TelegramBotChannel } from "./TelegramBotChannel";

export function createDeliveryChannels(): LeadDeliveryChannel[] {
  const channels: LeadDeliveryChannel[] = [];

  const { crm, telegram, email } = serverConfig.integrations;
  if (crm.url) channels.push(new CrmWebhookChannel(crm.url, crm.token || undefined));

  if (telegram.botToken && telegram.chatId) {
    channels.push(new TelegramBotChannel(telegram.botToken, telegram.chatId));
  }

  if (email.host && email.from && email.to) {
    channels.push(
      new EmailChannel({
        host: email.host,
        port: email.port,
        secure: email.secure,
        user: email.user || undefined,
        password: email.password,
        from: email.from,
        to: email.to,
      }),
    );
  }

  return channels;
}
