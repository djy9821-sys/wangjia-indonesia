import { MedusaError, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { PUSH_DEVICE_MODULE } from "../../../modules/push-device";
import PushDeviceModuleService from "../../../modules/push-device/service";
import {
  CUSTOMER_CHECK_TTL_SECONDS,
  deletedCustomerCacheKey,
} from "../../../api/middlewares/reject-deleted-customer";

/*
  Self-service account deletion (required by App Store / Play policies).
  Orders and invoices are business/tax records and stay; the person behind
  them is anonymised: contact data wiped, addresses and device tokens removed,
  login identity deleted so the account can never sign in again. The email is
  freed so the person may register afresh later.
*/
export const anonymizeCustomerStep = createStep(
  "anonymize-customer",
  async (input: { customer_id: string; auth_identity_id?: string | null }, { container }) => {
    const customers = container.resolve(Modules.CUSTOMER);
    const auth = container.resolve(Modules.AUTH);
    const devices = container.resolve<PushDeviceModuleService>(PUSH_DEVICE_MODULE);

    const customer = await customers.retrieveCustomer(input.customer_id).catch(() => null);
    if (!customer) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Customer not found");
    }

    const addresses = await customers.listCustomerAddresses({ customer_id: customer.id });
    if (addresses.length) {
      await customers.deleteCustomerAddresses(addresses.map((a) => a.id));
    }
    const tokens = await devices.listPushDeviceTokens({ customer_id: customer.id });
    if (tokens.length) {
      await devices.deletePushDeviceTokens(tokens.map((t) => t.id));
    }

    await customers.updateCustomers(customer.id, {
      email: `deleted+${customer.id.replace(/^cus_/, "").toLowerCase()}@deleted.invalid`,
      first_name: "Akun",
      last_name: "Dihapus",
      phone: null,
      company_name: null,
      metadata: { ...(customer.metadata ?? {}), deleted_at: new Date().toISOString(), deleted_email_hash: hash(customer.email) },
    });

    // Every identity that points at this customer (email/password, OTP, social).
    const identities = await auth.listAuthIdentities({ app_metadata: { customer_id: customer.id } }).catch(() => []);
    const ids = new Set(identities.map((i) => i.id));
    if (input.auth_identity_id) ids.add(input.auth_identity_id);
    if (ids.size) {
      await auth.deleteAuthIdentities([...ids]);
    }

    // Outstanding JWTs of this customer are refused from now on.
    const cache = container.resolve(Modules.CACHE);
    await cache.set(deletedCustomerCacheKey(customer.id), true, CUSTOMER_CHECK_TTL_SECONDS);

    return new StepResponse({ id: customer.id });
  }
);

/* Non-reversible fingerprint so support can still match a complaint to a deleted account. */
const hash = (s: string | null | undefined) => {
  if (!s) return null;
  let h = 0;
  for (const c of s.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h.toString(16);
};
