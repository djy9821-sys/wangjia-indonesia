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
};

/*
  WhatsApp Business Cloud API (Meta). Sends either
    - a free-form text (allowed within 24h after the customer messaged us), or
    - an approved template when `data.template` is given:
        { template: { name, language: "id", components: [...] } }
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

    const body = data.template
      ? { messaging_product: "whatsapp", to, type: "template", template: data.template }
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
