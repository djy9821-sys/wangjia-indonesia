import { authenticate, validateAndTransformBody } from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { z } from "@medusajs/framework/zod";

export const StoreRegisterPushToken = z
  .object({
    token: z.string().min(20).max(4096),
    platform: z.enum(["ios", "android", "web"]).optional(),
    app_version: z.string().max(40).nullish(),
    locale: z.string().max(10).nullish(),
  })
  .strict();

export const storePushTokensMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/notifications",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: "ALL",
    matcher: "/store/push-tokens*",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["POST"],
    matcher: "/store/push-tokens",
    middlewares: [validateAndTransformBody(StoreRegisterPushToken)],
  },
];
