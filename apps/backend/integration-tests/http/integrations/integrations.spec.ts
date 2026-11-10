import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders, createAdminUser, createStoreUser } from "../../utils/admin";
import { cartSeeder, productSeeder, regionSeeder, salesChannelSeeder } from "../../utils/seeder";
import { generatePublishableKey, generateStoreHeaders } from "../../utils/store";

jest.setTimeout(600 * 1000);

medusaIntegrationTestRunner({
  // @ts-expect-error inApp is honoured at runtime but missing from the runner types
  inApp: true,
  env: {
    ADMIN_DEFAULT_ROLE: "owner",
    RATE_LIMIT_DISABLED: "true",
    DOCUSEAL_WEBHOOK_SECRET: "test-secret",
    APP_MIN_VERSION: "1.2.0",
    APP_LATEST_VERSION: "1.3.0",
    APP_ANDROID_URL: "https://example.com/app.apk",
  },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders, publicHeaders, region, salesChannel, product;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      const publishableKey = await generatePublishableKey(container);
      publicHeaders = generateStoreHeaders({ publishableKey });
      storeHeaders = generateStoreHeaders({ publishableKey });
      const res = await createStoreUser({ api, storeHeaders });
      storeHeaders.headers["Authorization"] = `Bearer ${res.token}`;
      region = await regionSeeder({ api, adminHeaders, data: {} });
      salesChannel = await salesChannelSeeder({ api, adminHeaders, data: {} });
      product = await productSeeder({ api, adminHeaders, data: { sales_channels: [{ id: salesChannel.id }] } });
      await api.post(`/admin/api-keys/${publishableKey.id}/sales-channels`, { add: [salesChannel.id] }, adminHeaders);
    });

    it("reports database and cache health", async () => {
      const res = await api.get("/health/deep");
      expect(res.status).toEqual(200);
      expect(res.data.status).toEqual("ok");
      expect(res.data.checks.database.ok).toBe(true);
      expect(res.data.checks.cache.ok).toBe(true);
    });

    it("serves the app version policy publicly", async () => {
      const res = await api.get("/store/app-version", publicHeaders);
      expect(res.data).toEqual(
        expect.objectContaining({
          min_version: "1.2.0",
          latest_version: "1.3.0",
          android_url: "https://example.com/app.apk",
          // WhatsApp is not connected here, so the app must not offer a phone code
          phone_codes: false,
        })
      );
    });

    it("treats a customer email the same in any capitals", async () => {
      const password = "kata-sandi-88";
      const registerToken = (
        await api.post("/auth/customer/emailpass/register", { email: " Budi@Tambak.ID ", password })
      ).data.token;
      const created = await api.post(
        "/store/customers",
        { email: "Budi@Tambak.ID", first_name: "Budi" },
        { headers: { ...publicHeaders.headers, Authorization: `Bearer ${registerToken}` } }
      );
      expect(created.data.customer.email).toEqual("budi@tambak.id");

      // sign-in in lower case and in capitals reaches the same customer
      for (const email of ["budi@tambak.id", "BUDI@TAMBAK.ID"]) {
        const token = (await api.post("/auth/customer/emailpass", { email, password })).data.token;
        const me = await api.get("/store/customers/me", {
          headers: { ...publicHeaders.headers, Authorization: `Bearer ${token}` },
        });
        expect(me.data.customer.id).toEqual(created.data.customer.id);
      }

      // and it cannot be signed up a second time in another spelling
      const again = await api
        .post("/auth/customer/emailpass/register", { email: "BUDI@tambak.id", password })
        .catch((e) => e.response);
      expect(again.status).toEqual(401);
    });

    it("records a signed contract on the order from the DocuSeal webhook", async () => {
      const cart = await cartSeeder({
        api,
        storeHeaders,
        data: { region_id: region.id, sales_channel_id: salesChannel.id, items: [{ quantity: 1, variant_id: product.variants[0].id }] },
      });
      const { data: { quote } } = await api.post("/store/quotes", { cart_id: cart.id }, storeHeaders);
      const orderId = quote.draft_order_id as string;

      const payload = {
        event_type: "submission.completed",
        data: {
          id: 42,
          status: "completed",
          metadata: { order_id: orderId },
          documents: [{ name: "Kontrak.pdf", url: "https://sign.example.com/doc.pdf" }],
          audit_log_url: "https://sign.example.com/audit.pdf",
        },
      };

      const unauth = await api.post("/webhooks/docuseal", payload).catch((e) => e.response);
      expect(unauth.status).toEqual(401);

      const ok = await api.post("/webhooks/docuseal", payload, { headers: { "x-docuseal-secret": "test-secret" } });
      expect(ok.data).toEqual({ received: true, applied: true });

      const order = await api.get(`/admin/orders/${orderId}?fields=id,metadata`, adminHeaders);
      expect(order.data.order.metadata).toEqual(
        expect.objectContaining({
          contract_submission_id: "42",
          contract_documents: ["https://sign.example.com/doc.pdf"],
          contract_audit_log: "https://sign.example.com/audit.pdf",
        })
      );
      expect(order.data.order.metadata.contract_signed_at).toBeTruthy();

      // unknown order or incomplete event: acknowledged, nothing applied
      const ignored = await api.post(
        "/webhooks/docuseal",
        { event_type: "form.started", data: { metadata: { order_id: orderId } } },
        { headers: { "x-docuseal-secret": "test-secret" } }
      );
      expect(ignored.data.applied).toBe(false);
    });
  },
});
