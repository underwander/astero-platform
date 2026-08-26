import nodemailer, { type Transporter } from "nodemailer";
import type { LeadDeliveryChannel } from "../../application/ports/LeadDeliveryChannel";
import type { Lead } from "../../domain/lead";

type EmailChannelOptions = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
  to: string;
};

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>'"]/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character,
  );

export class EmailChannel implements LeadDeliveryChannel {
  readonly name = "email" as const;
  private readonly transporter: Transporter;

  constructor(private readonly options: EmailChannelOptions) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
      ...(options.user ? { auth: { user: options.user, pass: options.password } } : {}),
    });
  }

  async deliver(lead: Lead) {
    const subject = `Новое обращение: ${lead.firstName} ${lead.lastName}`;
    const plainText = [
      `ID: ${lead.id}`,
      `Клиент: ${lead.firstName} ${lead.lastName}`,
      `Email: ${lead.email}`,
      `Телефон: ${lead.phone}`,
      `Telegram: ${lead.telegram || "не указан"}`,
      `Страна: ${lead.country}`,
      "",
      lead.message,
    ].join("\n");

    await this.transporter.sendMail({
      from: this.options.from,
      to: this.options.to,
      subject,
      text: plainText,
      html: `<h2>${escapeHtml(subject)}</h2>
        <p><strong>ID:</strong> ${escapeHtml(lead.id)}</p>
        <p><strong>Email:</strong> ${escapeHtml(lead.email)}<br>
        <strong>Телефон:</strong> ${escapeHtml(lead.phone)}<br>
        <strong>Telegram:</strong> ${escapeHtml(lead.telegram || "не указан")}<br>
        <strong>Страна:</strong> ${escapeHtml(lead.country)}</p>
        <p>${escapeHtml(lead.message).replace(/\n/g, "<br>")}</p>`,
    });
  }
}
