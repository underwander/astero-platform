import type { LeadDeliveryChannel } from "../../application/ports/LeadDeliveryChannel";
import type { Lead } from "../../domain/lead";

export class TelegramBotChannel implements LeadDeliveryChannel {
  readonly name = "telegram" as const;

  constructor(
    private readonly botToken: string,
    private readonly chatId: string,
  ) {}

  async deliver(lead: Lead) {
    const text = [
      "Новое обращение по финансовому спору",
      `ID: ${lead.id}`,
      `Клиент: ${lead.firstName} ${lead.lastName}`,
      `Email: ${lead.email}`,
      `Телефон: ${lead.phone}`,
      `Telegram: ${lead.telegram || "не указан"}`,
      `Страна: ${lead.country}`,
      "",
      lead.message,
    ]
      .join("\n")
      .slice(0, 4_000);

    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: this.chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Telegram Bot API returned ${response.status}`);
  }
}
