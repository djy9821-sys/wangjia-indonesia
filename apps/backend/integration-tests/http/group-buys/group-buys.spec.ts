import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { adminHeaders, createAdminUser, createStoreUser } from "../../utils/admin";
import { productSeeder, regionSeeder, salesChannelSeeder } from "../../utils/seeder";
import { generatePublishableKey, generateStoreHeaders } from "../../utils/store";
import { GROUP_BUY_MODULE } from "../../../src/modules/group-buy";
import { closeExpiredGroupBuysWorkflow } from "../../../src/workflows/group-buy/workflows/close-expired-group-buys";
import { recordGroupBuyOrderWorkflow } from "../../../src/workflows/group-buy/workflows/record-group-buy-order";

jest.setTimeout(600 * 1000);

const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

medusaIntegrationTestRunner({
  // @ts-expect-error inApp is honoured at runtime but missing from the runner's types
  inApp: true,
  env: { ADMIN_DEFAULT_ROLE: "owner", RATE_LIMIT_DISABLED: "true" },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders: any;
    let publicHeaders: any;
    let product: any;
    let region: any;
    let salesChannel: any;
    let customer: any;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      const publishableKey = await generatePublishableKey(container);
      publicHeaders = generateStoreHeaders({ publishableKey });
      storeHeaders = generateStoreHeaders({ publishableKey });
      const res = await createStoreUser({ api, storeHeaders });
      customer = res.customer;
      storeHeaders.headers["Authorization"] = `Bearer ${res.token}`;
      region = await regionSeeder({ api, adminHeaders, data: {} });
      salesChannel = await salesChannelSeeder({ api, adminHeaders, data: {} });
      product = await productSeeder({ api, adminHeaders, data: { sales_channels: [{ id: salesChannel.id }] } });
      await api.post(`/admin/api-keys/${publishableKey.id}/sales-channels`, { add: [salesChannel.id] }, adminHeaders);
    });

    const createGroupBuy = (overrides: Record<string, unknown> = {}) =>
      api.post(
        "/admin/group-buys",
        {
          title: "Patungan uji",
          variant_id: product.variants[0].id,
          group_price: 80,
          min_quantity: 3,
          ends_at: inDays(7),
          ...overrides,
        },
        adminHeaders
      );

    it("creates a group buy with a price snapshot and lists it publicly", async () => {
      const created = await createGroupBuy();
      expect(created.status).toEqual(201);
      expect(created.data.group_buy).toMatchObject({
        status: "open",
        group_price: 80,
        regular_price: 100,
        min_quantity: 3,
        joined_quantity: 0,
        product_id: product.id,
      });

      const rejected = await createGroupBuy({ group_price: 120 }).catch((e) => e.response);
      expect(rejected.status).toEqual(400);

      const list = await api.get("/store/group-buys", publicHeaders);
      expect(list.data.group_buys).toHaveLength(1);
      expect(list.data.group_buys[0].id).toEqual(created.data.group_buy.id);
    });

    it("joins by putting the variant in the cart at the group price", async () => {
      const { data } = await createGroupBuy();
      const id = data.group_buy.id;

      const anon = await api.post(`/store/group-buys/${id}/join`, { quantity: 2 }, publicHeaders).catch((e) => e.response);
      expect(anon.status).toEqual(401);

      const joined = await api.post(`/store/group-buys/${id}/join`, { quantity: 2, region_id: region.id }, storeHeaders);
      expect(joined.status).toEqual(200);
      const cart = await api.get(`/store/carts/${joined.data.cart_id}`, storeHeaders);
      expect(cart.data.cart.items).toHaveLength(1);
      expect(cart.data.cart.items[0]).toMatchObject({
        variant_id: product.variants[0].id,
        quantity: 2,
        unit_price: 80,
        metadata: { group_buy_id: id },
      });

      // Joining again with the same cart adds to it.
      const again = await api.post(`/store/group-buys/${id}/join`, { quantity: 1, cart_id: joined.data.cart_id }, storeHeaders);
      expect(again.status).toEqual(200);
      const cart2 = await api.get(`/store/carts/${joined.data.cart_id}`, storeHeaders);
      expect(cart2.data.cart.items[0].quantity).toEqual(3);
    });

    it("succeeds once placed orders reach the minimum, and fails on expiry otherwise", async () => {
      const container = getContainer();
      const { data } = await createGroupBuy({ min_quantity: 3 });
      const id = data.group_buy.id;

      await recordGroupBuyOrderWorkflow(container).run({
        input: { group_buy_id: id, order_id: "order_test_1", customer_id: customer.id, quantity: 2 },
      });
      let detail = await api.get(`/admin/group-buys/${id}`, adminHeaders);
      expect(detail.data.group_buy).toMatchObject({ status: "open", joined_quantity: 2, participants: 1 });

      await recordGroupBuyOrderWorkflow(container).run({
        input: { group_buy_id: id, order_id: "order_test_2", customer_id: null, quantity: 1 },
      });
      detail = await api.get(`/admin/group-buys/${id}`, adminHeaders);
      expect(detail.data.group_buy).toMatchObject({ status: "success", joined_quantity: 3, participants: 2 });
      expect(detail.data.orders).toHaveLength(2);

      // A closed group can no longer be joined.
      const closed = await api.post(`/store/group-buys/${id}/join`, { quantity: 1, region_id: region.id }, storeHeaders).catch((e) => e.response);
      expect(closed.status).toEqual(400);

      // An open group past its deadline without enough units fails.
      const service = container.resolve(GROUP_BUY_MODULE) as any;
      const other = await createGroupBuy({ title: "Patungan kadaluarsa", min_quantity: 10 });
      await service.updateGroupBuys({ id: other.data.group_buy.id, ends_at: new Date(Date.now() - 60000) });
      const { result } = await closeExpiredGroupBuysWorkflow(container).run({ input: {} });
      expect(result.failed).toEqual([other.data.group_buy.id]);
      const failed = await api.get(`/admin/group-buys/${other.data.group_buy.id}`, adminHeaders);
      expect(failed.data.group_buy.status).toEqual("failed");
    });

    it("lets staff cancel an open group buy", async () => {
      const { data } = await createGroupBuy();
      const cancelled = await api.post(`/admin/group-buys/${data.group_buy.id}`, { status: "cancelled" }, adminHeaders);
      expect(cancelled.data.group_buy.status).toEqual("cancelled");
      const list = await api.get("/store/group-buys", publicHeaders);
      expect(list.data.group_buys).toHaveLength(0);
    });
  },
});
