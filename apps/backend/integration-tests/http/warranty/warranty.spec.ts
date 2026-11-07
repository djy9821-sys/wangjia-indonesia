import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import {
  adminHeaders,
  createAdminUser,
  createStoreUser,
} from "../../utils/admin";
import {
  cartSeeder,
  productSeeder,
  regionSeeder,
  salesChannelSeeder,
} from "../../utils/seeder";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../utils/store";

jest.setTimeout(600 * 1000);

medusaIntegrationTestRunner({
  // @ts-expect-error inApp is honoured at runtime but missing from the runner's types
  inApp: true,
  env: { ADMIN_DEFAULT_ROLE: "owner", RATE_LIMIT_DISABLED: "true" },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders, publicHeaders, product, region, salesChannel;

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
      product = await productSeeder({
        api,
        adminHeaders,
        data: { sales_channels: [{ id: salesChannel.id }] },
      });
      await api.post(
        `/admin/api-keys/${publishableKey.id}/sales-channels`,
        { add: [salesChannel.id] },
        adminHeaders
      );
    });

    describe("warranty units", () => {
      it("generates serials, verifies publicly, registers once and voids", async () => {
        const gen = await api.post(
          "/admin/warranty/units",
          {
            product_id: product.id,
            variant_id: product.variants[0].id,
            quantity: 2,
            batch: "T-1",
            warranty_months: 12,
          },
          adminHeaders
        );
        expect(gen.status).toEqual(201);
        expect(gen.data.units).toHaveLength(2);
        const [a, b] = gen.data.units;
        expect(a.serial).toMatch(/^WJ-\d{2}-\d{6}$/);
        expect(a.code).toMatch(/^[A-Z2-9]{12}$/);
        expect(a.qr_url).toContain(`/id/garansi/${a.code}`);
        expect(a.serial).not.toEqual(b.serial);

        // second batch continues the running number
        const gen2 = await api.post(
          "/admin/warranty/units",
          { product_id: product.id, quantity: 1, warranty_months: 24 },
          adminHeaders
        );
        expect(gen2.data.units[0].serial > b.serial).toBe(true);

        // public verification, bare code and QR url form
        const ok = await api.get(`/store/warranty/verify/${a.code}`, publicHeaders);
        expect(ok.data.genuine).toBe(true);
        expect(ok.data.unit).toEqual(
          expect.objectContaining({ serial: a.serial, registered: false, scan_count: 1 })
        );
        const viaUrl = await api.get(
          `/store/warranty/verify/${encodeURIComponent(a.qr_url)}`,
          publicHeaders
        );
        expect(viaUrl.data.unit.scan_count).toEqual(2);

        const bad = await api.get("/store/warranty/verify/ZZZZZZZZZZZZ", publicHeaders);
        expect(bad.data).toEqual({ genuine: false, reason: "unknown" });

        // registration needs a logged-in customer
        const anon = await api
          .post("/store/warranty/register", { code: a.code }, publicHeaders)
          .catch((e) => e.response);
        expect(anon.status).toEqual(401);

        const reg = await api.post(
          "/store/warranty/register",
          { code: a.code, farm_location: "Tambak Indramayu" },
          storeHeaders
        );
        expect(reg.data.first_time).toBe(true);
        expect(reg.data.unit.warranty_expires_at).toBeTruthy();
        const expires = new Date(reg.data.unit.warranty_expires_at).getTime();
        const registered = new Date(reg.data.unit.registered_at).getTime();
        expect(expires - registered).toBeGreaterThan(360 * 24 * 3600 * 1000);

        // same customer again: idempotent, not "first time"
        const again = await api.post("/store/warranty/register", { code: a.code }, storeHeaders);
        expect(again.data.first_time).toBe(false);

        const mine = await api.get("/store/warranty/units", storeHeaders);
        expect(mine.data.units).toHaveLength(1);
        expect(mine.data.units[0]).toEqual(
          expect.objectContaining({ serial: a.serial, status: "registered", farm_location: "Tambak Indramayu" })
        );

        // the owner sees "registered_to_me"
        const asOwner = await api.get(`/store/warranty/verify/${a.code}`, storeHeaders);
        expect(asOwner.data.unit.registered_to_me).toBe(true);

        // another customer cannot take it over
        const other = generateStoreHeaders({ publishableKey: { token: publicHeaders.headers["x-publishable-api-key"] } as any });
        const otherReg = (
          await api.post("/auth/customer/emailpass/register", { email: "other@email.com", password: "password" })
        ).data.token;
        await api.post(
          "/store/customers",
          { email: "other@email.com" },
          { headers: { ...other.headers, Authorization: `Bearer ${otherReg}` } }
        );
        const otherToken = (
          await api.post("/auth/customer/emailpass", { email: "other@email.com", password: "password" })
        ).data.token;
        other.headers["Authorization"] = `Bearer ${otherToken}`;
        const stolen = await api
          .post("/store/warranty/register", { code: a.code }, other)
          .catch((e) => e.response);
        expect(stolen.status).toEqual(400);

        // admin list / search / export
        const list = await api.get("/admin/warranty/units?status=registered", adminHeaders);
        expect(list.data.count).toEqual(1);
        expect(list.data.stats.total).toEqual(3);
        const search = await api.get(`/admin/warranty/units?q=${a.serial}`, adminHeaders);
        expect(search.data.units[0].id).toEqual(a.id);
        const csv = await api.get("/admin/warranty/units/export?batch=T-1", adminHeaders);
        expect(csv.headers["content-type"]).toContain("text/csv");
        expect(csv.data).toContain(a.serial);
        expect(csv.data).toContain(b.code);

        // printable label sheet and the suspicious-scan filter
        const labels = await api.get("/admin/warranty/units/labels?batch=T-1", { ...adminHeaders, responseType: "arraybuffer" });
        expect(labels.headers["content-type"]).toContain("application/pdf");
        expect(Buffer.from(labels.data).subarray(0, 4).toString()).toEqual("%PDF");
        for (let i = 0; i < 6; i++) await api.get(`/store/warranty/verify/${b.code}`, publicHeaders);
        const sus = await api.get("/admin/warranty/units?suspicious=true", adminHeaders);
        expect(sus.data.units.map((u: any) => u.id)).toEqual([b.id]);

        // a registered unit can only be voided, and a voided label fails verification
        const back = await api
          .post(`/admin/warranty/units/${a.id}`, { status: "in_stock" }, adminHeaders)
          .catch((e) => e.response);
        expect(back.status).toEqual(400);
        const voided = await api.post(`/admin/warranty/units/${a.id}`, { status: "void" }, adminHeaders);
        expect(voided.data.unit.status).toEqual("void");
        const afterVoid = await api.get(`/store/warranty/verify/${a.code}`, publicHeaders);
        expect(afterVoid.data).toEqual({ genuine: false, reason: "void" });

        // linking an in-stock unit to an order marks it sold
        const sold = await api.post(`/admin/warranty/units/${b.id}`, { order_id: "order_test" }, adminHeaders);
        expect(sold.data.unit.status).toEqual("sold");
      });

      it("links serials to an order at packing time and lets the buyer register with one tap", async () => {
        // an order owned by the customer, via the quote flow
        const cart = await cartSeeder({
          api,
          storeHeaders,
          data: { region_id: region.id, sales_channel_id: salesChannel.id, items: [{ quantity: 1, variant_id: product.variants[0].id }] },
        });
        const { data: { quote } } = await api.post("/store/quotes", { cart_id: cart.id }, storeHeaders);
        const orderId = quote.draft_order_id as string;

        const gen = await api.post(
          "/admin/warranty/units",
          { product_id: product.id, quantity: 2, warranty_months: 12 },
          adminHeaders
        );
        const [u1, u2] = gen.data.units;

        // warehouse types the serial (case-insensitive) or the QR code
        const linked = await api.post(`/admin/orders/${orderId}/warranty-units`, { serial: u1.serial.toLowerCase() }, adminHeaders);
        expect(linked.data.unit).toEqual(expect.objectContaining({ id: u1.id, order_id: orderId, status: "sold" }));
        await api.post(`/admin/orders/${orderId}/warranty-units`, { serial: u2.code }, adminHeaders);

        // the same unit cannot go into a second order
        const dup = await api
          .post(`/admin/orders/order_other/warranty-units`, { serial: u1.serial }, adminHeaders)
          .catch((e) => e.response);
        expect(dup.status).toEqual(400);

        const adminList = await api.get(`/admin/orders/${orderId}/warranty-units`, adminHeaders);
        expect(adminList.data.units.map((u: any) => u.id).sort()).toEqual([u1.id, u2.id].sort());

        // buyer sees both and registers without scanning
        const mine = await api.get(`/store/orders/${orderId}/warranty-units`, storeHeaders);
        expect(mine.data.units).toHaveLength(2);
        expect(mine.data.units[0].registered).toBe(false);
        const reg = await api.post("/store/warranty/register", { unit_id: u1.id }, storeHeaders);
        expect(reg.data.first_time).toBe(true);
        expect(reg.data.unit.serial).toEqual(u1.serial);

        // a stranger cannot register a unit from someone else's order
        const otherToken = (
          await api.post("/auth/customer/emailpass/register", { email: "stranger@email.com", password: "password" })
        ).data.token;
        const strangerHeaders = { headers: { ...storeHeaders.headers, Authorization: `Bearer ${otherToken}` } };
        await api.post("/store/customers", { email: "stranger@email.com" }, strangerHeaders);
        const strangerLogin = (
          await api.post("/auth/customer/emailpass", { email: "stranger@email.com", password: "password" })
        ).data.token;
        strangerHeaders.headers.Authorization = `Bearer ${strangerLogin}`;
        const stolen = await api
          .post("/store/warranty/register", { unit_id: u2.id }, strangerHeaders)
          .catch((e) => e.response);
        expect(stolen.status).toEqual(404);

        // unlinking the unregistered unit returns it to stock; the registered one stays
        const unlink = await api.delete(`/admin/orders/${orderId}/warranty-units/${u2.id}`, adminHeaders);
        expect(unlink.data.unit.status).toEqual("in_stock");
        const after = await api.get(`/store/orders/${orderId}/warranty-units`, storeHeaders);
        expect(after.data.units).toHaveLength(1);
        expect(after.data.units[0]).toEqual(expect.objectContaining({ id: u1.id, registered: true, registered_to_me: true }));

        // overview counts the registration
        const overview = await api.get("/admin/overview", adminHeaders);
        expect(overview.data.warranty.registered).toBeGreaterThanOrEqual(1);
      });

      it("deletes the customer account: login revoked, token refused, records anonymised", async () => {
        const addr = await api.post(
          "/store/customers/me/addresses",
          { first_name: "B", address_1: "Jl. Tambak 1", city: "Indramayu", country_code: "id" },
          storeHeaders
        );
        expect(addr.status).toEqual(200);

        const del = await api.delete("/store/account", storeHeaders);
        expect(del.data).toEqual({ deleted: true });

        // the still-valid JWT is refused everywhere in the store API
        const me = await api.get("/store/customers/me", storeHeaders).catch((e) => e.response);
        expect(me.status).toEqual(401);
        const units = await api.get("/store/warranty/units", storeHeaders).catch((e) => e.response);
        expect(units.status).toEqual(401);

        // password login no longer works, but the email is free again
        const login = await api
          .post("/auth/customer/emailpass", { email: "test@email.com", password: "password" })
          .catch((e) => e.response);
        expect(login.status).toEqual(401);
        const again = await api.post("/auth/customer/emailpass/register", { email: "test@email.com", password: "password" });
        expect(again.status).toEqual(200);

        // admin still has the (anonymised) record
        const list = await api.get("/admin/customers?q=deleted%2B", adminHeaders);
        expect(list.data.customers.length).toBeGreaterThanOrEqual(1);
        expect(list.data.customers[0]).toEqual(expect.objectContaining({ first_name: "Akun", phone: null }));
      });
    });
  },
});
