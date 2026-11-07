import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";

type Options = {
  channels?: string[];
  access_token?: string;
  phone_number_id?: string;
  api_version?: string;
  /* Approved utility template with one body parameter ({{1}} = the message). */
  template_name?: string;
  template_lang?: string;
};

/*
  WhatsApp Business Cloud API (Meta). Sends either
    - a free-form text (allowed within 24h after the customer messaged us), or
    - an approved template when `data.template` is given:
        { template: { name, language: "id", components: [...] } }
  Business-initiated messages (payment confirmed, shipped, reminders) are
  usually outside the 24h window, so when WHATSAPP_TEMPLATE_NAME is set every
  plain text is wrapped into that approved template as its single body
  parameter (see docs/whatsapp-templates.md for the text to submit to Meta).
  Without credentials it logs the message instead of failing, so local
  development and tests keep working.
*/
export default class WhatsAppNotificationService extends AbstractNotificationProviderService {
  static identifier = "whatsapp";
  protected options_: Options;
  protected logger_: Logger;

  constructor({ logger }: { logger: Logger }, options: Options) {
    super();
    this.options_ = options;
    this.logger_ = logger;
  }

  static validateOptions(_options: Record<string, unknown>) {}

  get configured() {
    return Boolean(this.options_.access_token && this.options_.phone_number_id);
  }

  static normalizePhone(raw: string): string {
    let p = raw.replace(/[^\d+]/g, "");
    if (p.startsWith("+")) p = p.slice(1);
    if (p.startsWith("0")) p = "62" + p.slice(1); // local Indonesian format
    return p;
  }

  /* Meta rejects parameters with newlines, tabs or 4+ spaces and caps them at 1024 chars. */
  static templateParam(text: string): string {
    return text.replace(/\s*\n+\s*/g, " | ").replace(/\t/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 1024);
  }

  wrapInTemplate(text: string) {
    const name = this.options_.template_name;
    if (!name || !text) return null;
    return {
      name,
      language: { code: this.options_.template_lang ?? "id" },
      components: [{ type: "body", parameters: [{ type: "text", text: WhatsAppNotificationService.templateParam(text) }] }],
    };
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const to = WhatsAppNotificationService.normalizePhone(notification.to);
    const data = (notification.data ?? {}) as Record<string, any>;
    const text = String(data.text ?? notification.content?.text ?? "");

    if (!this.configured) {
      this.logger_.info(`[whatsapp:dry-run] -> ${to}: ${text.replace(/\n/g, " | ")}`);
      return { id: `dry-run-${Date.now()}` };
    }

    const template = data.template ?? this.wrapInTemplate(text);
    const body = template
      ? { messaging_product: "whatsapp", to, type: "template", template }
      : { messaging_product: "whatsapp", to, type: "text", text: { body: text, preview_url: false } };

    const res = await fetch(
      `https://graph.facebook.com/${this.options_.api_version ?? "v21.0"}/${this.options_.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options_.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `WhatsApp send failed: ${json?.error?.message ?? res.statusText}`
      );
    }
    return { id: json?.messages?.[0]?.id ?? `wa-${Date.now()}` };
  }
}
