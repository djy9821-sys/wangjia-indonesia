import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types";

type Options = { channels?: string[]; api_key?: string; from?: string };

/*
  Email through Resend's HTTP API (no SDK needed). `data` carries
  { subject, text, html? }. Dry-runs to the log when RESEND_API_KEY is unset.
*/
export default class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "resend";
  protected options_: Options;
  protected logger_: Logger;

  constructor({ logger }: { logger: Logger }, options: Options) {
    super();
    this.options_ = options;
    this.logger_ = logger;
  }

  static validateOptions(_options: Record<string, unknown>) {}

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const data = (notification.data ?? {}) as Record<string, any>;
    const subject = String(data.subject ?? notification.content?.subject ?? "Notification");
    const text = String(data.text ?? notification.content?.text ?? "");
    const html = data.html ? String(data.html) : undefined;
    const to = notification.to.split(",").map((s) => s.trim()).filter(Boolean);

    if (!this.options_.api_key) {
      this.logger_.info(`[email:dry-run] -> ${to.join(", ")} | ${subject} | ${text.replace(/\n/g, " | ")}`);
      return { id: `dry-run-${Date.now()}` };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options_.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: notification.from || this.options_.from,
        to,
        subject,
        text,
        html,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Resend send failed: ${json?.message ?? res.statusText}`
      );
    }
    return { id: json?.id ?? `email-${Date.now()}` };
  }
}
