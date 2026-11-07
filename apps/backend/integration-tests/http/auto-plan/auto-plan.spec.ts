import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders, createAdminUser, createStoreUser } from "../../utils/admin";
import { cartSeeder, productSeeder, regionSeeder, salesChannelSeeder } from "../../utils/seeder";
import { generatePublishableKey, generateStoreHeaders } from "../../utils/store";

jest.setTimeout(600 * 1000);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

medusaIntegrationTestRunner({
  // @ts-expect-error inApp is honoured at runtime but missing from the runner's types
  inApp: true,
  env: { ADMIN_DEFAULT_ROLE: "owner", RATE_LIMIT_DISABLED: "true", AUTO_PLAN_MAX_TOTAL: "1000" },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders, region, salesChannel, product;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      const publishableKey = await generatePublishableKey(container);
      storeHeaders = generateStoreHeaders({ publishableKey });
      const res = await createStoreUser({ api, storeHeaders });
      storeHeaders.headers["Authorization"] = `Bearer ${res.token}`;
      region = await regionSeeder({ api, adminHeaders, data: {} });
      salesChannel = await salesChannelSeeder({ api, adminHeaders, data: {} });
      product = await productSeeder({ api, adminHeaders, data: { sales_channels: [{ id: salesChannel.id }] } });
      await api.post(`/admin/api-keys/${publishableKey.id}/sales-channels`, { add: [salesChannel.id] }, adminHeaders);
    });

    it("creates a full-payment plan automatically for a small order accepted from a quote", async () => {
      const cart = await cartSeeder({
        api,
        storeHeaders,
        data: { region_id: region.id, sales_channel_id: salesChannel.id, items: [{ quantity: 1, variant_id: product.variants[0].id }] },
      });
      const { data: { quote } } = await api.post("/store/quotes", { cart_id: cart.id }, storeHeaders);
      const orderId = quote.draft_order_id as string;

      // draft orders never get a plan
      await sleep(500);
      const before = await api.get(`/store/orders/${orderId}/payment-plan`, storeHeaders);
      expect(before.data.payment_plan).toBeNull();

      await api.post(`/admin/quotes/${quote.id}/send`, {}, adminHeaders);
      await api.post(`/store/quotes/${quote.id}/accept`, {}, storeHeaders);

      let plan: any = null;
      for (let i = 0; i < 20 && !plan; i++) {
        await sleep(300);
        plan = (await api.get(`/store/orders/${orderId}/payment-plan`, storeHeaders)).data.payment_plan;
      }
      expect(plan).toEqual(expect.objectContaining({ order_id: orderId, status: "active", release_policy: "full_paid" }));
      expect(plan.installments).toHaveLength(1);
      expect(Number(plan.installments[0].amount)).toEqual(100);
      expect(plan.installments[0].label).toEqual("Pembayaran penuh");

      // accepting again or re-firing must not create a second plan
      const dup = await api
        .post(`/admin/orders/${orderId}/payment-plan`, { installments: [{ label: "x", amount: 100 }] }, adminHeaders)
        .catch((e) => e.response);
      expect(dup.status).toEqual(400);
    });
  },
});
