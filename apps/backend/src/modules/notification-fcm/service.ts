import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
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
  /** Path to the Firebase service-account JSON, or the JSON itself (base64 allowed). */
  service_account?: string;
};

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

/*
  Firebase Cloud Messaging (HTTP v1) without the Firebase Admin SDK:
  sign a service-account JWT, swap it for an OAuth token, POST the message.
  `notification.to` is the device token; `data` = { title, body, data? }.
  Dry-runs to the log when no service account is configured.
*/
export default class FcmNotificationService extends AbstractNotificationProviderService {
  static identifier = "fcm";
  protected logger_: Logger;
  protected account_: ServiceAccount | null = null;
  protected accessToken_: { token: string; exp: number } | null = null;

  constructor({ logger }: { logger: Logger }, options: Options) {
    super();
    this.logger_ = logger;
    this.account_ = FcmNotificationService.loadAccount(options.service_account);
  }

  static validateOptions(_options: Record<string, unknown>) {}

  static loadAccount(raw?: string): ServiceAccount | null {
    if (!raw) return null;
    try {
      let text = raw.trim();
      if (!text.startsWith("{")) {
        try {
          text = readFileSync(text, "utf8");
        } catch {
          text = Buffer.from(text, "base64").toString("utf8");
        }
      }
      const json = JSON.parse(text);
      if (!json.project_id || !json.client_email || !json.private_key) return null;
      return json;
    } catch {
      return null;
    }
  }

  get configured() {
    return Boolean(this.account_);
  }

  protected async accessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.accessToken_ && this.accessToken_.exp - 60 > now) return this.accessToken_.token;
    const acct = this.account_!;
    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
      iss: acct.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })}`;
    const signature = createSign("RSA-SHA256").update(unsigned).sign(acct.private_key, "base64url");
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${signature}`,
      }),
    });
    const json = (await res.json()) as any;
    if (!res.ok) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `FCM auth failed: ${json.error_description ?? json.error}`);
    }
    this.accessToken_ = { token: json.access_token, exp: now + Number(json.expires_in ?? 3600) };
    return json.access_token;
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const data = (notification.data ?? {}) as Record<string, any>;
    const title = String(data.title ?? "WANGJIA");
    const body = String(data.body ?? notification.content?.text ?? "");
    const extra: Record<string, string> = {};
    for (const [k, v] of Object.entries((data.data as Record<string, unknown>) ?? {})) {
      if (v !== undefined && v !== null) extra[k] = String(v);
    }

    if (!this.configured) {
      this.logger_.info(`[push:dry-run] -> ${notification.to.slice(0, 12)}… | ${title} | ${body} | ${JSON.stringify(extra)}`);
      return { id: `dry-run-${Date.now()}` };
    }

    const token = await this.accessToken();
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${this.account_!.project_id}/messages:send`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token: notification.to,
            notification: { title, body },
            data: extra,
            android: { priority: "high", notification: { channel_id: "wangjia_orders", sound: "default" } },
            apns: { payload: { aps: { sound: "default", badge: 1 } } },
          },
        }),
      }
    );
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      const code = json?.error?.details?.find((d: any) => d.errorCode)?.errorCode ?? json?.error?.status;
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `FCM send failed: ${code ?? res.status} ${json?.error?.message ?? ""}`.trim()
      );
    }
    return { id: json.name ?? `fcm-${Date.now()}` };
  }
}
