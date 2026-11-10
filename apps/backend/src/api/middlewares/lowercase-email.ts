import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework";

/*
  The email login compares addresses letter by letter, so "Budi@Gmail.com" and
  "budi@gmail.com" would be two accounts: a capital typed at sign-up locks the
  customer out at the next sign-in, and the password reset finds nobody.
  Addresses are trimmed and lower-cased on the way in, the same for sign-up,
  sign-in and password reset.
*/
export const lowercaseEmail =
  (field: "email" | "identifier" = "email") =>
  (req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) => {
    // The raw body and, where the route's validation already ran, its result.
    for (const body of [req.body, req.validatedBody] as (Record<string, unknown> | undefined)[]) {
      const value = body?.[field];
      if (body && typeof value === "string") {
        body[field] = value.trim().toLowerCase();
      }
    }
    return next();
  };
