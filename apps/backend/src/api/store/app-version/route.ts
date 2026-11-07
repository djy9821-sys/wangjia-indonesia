import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

/*
  GET /store/app-version — version policy for the mobile app, independent of
  the app stores (works for side-loaded APKs too). Configure in .env:
    APP_MIN_VERSION     below this the app blocks until updated
    APP_LATEST_VERSION  below this the app shows a dismissible banner
    APP_ANDROID_URL / APP_IOS_URL  where to get the update
*/
export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    min_version: process.env.APP_MIN_VERSION || "0.0.0",
    latest_version: process.env.APP_LATEST_VERSION || "0.0.0",
    android_url: process.env.APP_ANDROID_URL || null,
    ios_url: process.env.APP_IOS_URL || null,
    message: process.env.APP_UPDATE_MESSAGE || null,
  });
};
