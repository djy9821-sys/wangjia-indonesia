import { QUOTE_MODULE } from "./src/modules/quote";
import { APPROVAL_MODULE } from "./src/modules/approval";
import { COMPANY_MODULE } from "./src/modules/company";
import { PAYMENT_PLAN_MODULE } from "./src/modules/payment-plan";
import { PUSH_DEVICE_MODULE } from "./src/modules/push-device";
import { WARRANTY_MODULE } from "./src/modules/warranty";
import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils";
import { initSentry } from "./src/utils/sentry";

loadEnv(process.env.NODE_ENV || "development", process.cwd());
initSentry();

const redisUrl = process.env.REDIS_URL;
const s3Configured = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID);

/*
  Production switches, all driven by .env:
  - REDIS_URL          -> Redis event bus, workflow engine, cache and locking
                          (in-memory versions lose state on restart)
  - S3_*               -> S3 / Cloudflare R2 file storage; payment receipts are
                          stored private and served through short-lived signed URLs
  - WHATSAPP_* / RESEND_* -> notification providers (see src/modules/notification-*)
*/
const redisModules: Record<string, any> = redisUrl
  ? {
      [Modules.EVENT_BUS]: {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: { redisUrl },
      },
      [Modules.WORKFLOW_ENGINE]: {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: { redis: { url: redisUrl } },
      },
      [Modules.CACHE]: {
        resolve: "@medusajs/medusa/cache-redis",
        options: { redisUrl },
      },
      [Modules.LOCKING]: {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl },
            },
          ],
        },
      },
    }
  : {};

const fileModule: Record<string, any> = s3Configured
  ? {
      [Modules.FILE]: {
        resolve: "@medusajs/medusa/file",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/file-s3",
              id: "s3",
              options: {
                file_url: process.env.S3_FILE_URL,
                access_key_id: process.env.S3_ACCESS_KEY_ID,
                secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                region: process.env.S3_REGION || "auto",
                bucket: process.env.S3_BUCKET,
                endpoint: process.env.S3_ENDPOINT,
                prefix: process.env.S3_PREFIX || "",
                // Signed download links for private receipts
                download_file_duration: Number(process.env.S3_SIGNED_URL_SECONDS || 900),
                additional_client_config: {
                  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
                },
              },
            },
          ],
        },
      },
    }
  : {};

const modules: Record<string, any> = {
  [COMPANY_MODULE]: {
    resolve: "./modules/company",
  },
  [QUOTE_MODULE]: {
    resolve: "./modules/quote",
  },
  [APPROVAL_MODULE]: {
    resolve: "./modules/approval",
  },
  [PAYMENT_PLAN_MODULE]: {
    resolve: "./modules/payment-plan",
  },
  [PUSH_DEVICE_MODULE]: {
    resolve: "./modules/push-device",
  },
  [WARRANTY_MODULE]: {
    resolve: "./modules/warranty",
  },
  [Modules.NOTIFICATION]: {
    resolve: "@medusajs/medusa/notification",
    options: {
      providers: [
        {
          resolve: "./src/modules/notification-whatsapp",
          id: "whatsapp",
          options: {
            channels: ["whatsapp"],
            access_token: process.env.WHATSAPP_ACCESS_TOKEN,
            phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID,
            api_version: process.env.WHATSAPP_API_VERSION || "v21.0",
          },
        },
        {
          resolve: "./src/modules/notification-fcm",
          id: "fcm",
          options: {
            channels: ["push"],
            service_account: process.env.FIREBASE_SERVICE_ACCOUNT,
          },
        },
        {
          resolve: "./src/modules/notification-resend",
          id: "resend",
          options: {
            channels: ["email"],
            api_key: process.env.RESEND_API_KEY,
            from: process.env.NOTIFY_EMAIL_FROM || "WANGJIA Indonesia <no-reply@example.com>",
          },
        },
      ],
    },
  },
  ...fileModule,
  ...redisModules,
};

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules,
});
