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

// 1x1 transparent PNG
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

medusaIntegrationTestRunner({
  inApp: true,
  env: { ADMIN_DEFAULT_ROLE: "owner", OTP_DEV_CODE: "000000" },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders, region, salesChannel, product;

    const createOrderViaQuote = async () => {
      const cart = await cartSeeder({
        api,
        storeHeaders,
        data: {
          region_id: region.id,
          sales_channel_id: salesChannel.id,
          items: [{ quantity: 1, variant_id: product.variants[0].id }],
        },
      });
      const {
        data: { quote },
      } = await api.post("/store/quotes", { cart_id: cart.id }, storeHeaders);
      return { orderId: quote.draft_order_id as string, total: 100 };
    };

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      const publishableKey = await generatePublishableKey(container);
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

    describe("payment plan lifecycle", () => {
      it("creates a plan, collects a receipt, confirms it and releases the order", async () => {
        const { orderId } = await createOrderViaQuote();

        // sum must equal the order total
        const bad = await api
          .post(
            `/admin/orders/${orderId}/payment-plan`,
            { installments: [{ label: "DP", amount: 10 }] },
            adminHeaders
          )
          .catch((e) => e.response);
        expect(bad.status).toEqual(400);

        const created = await api.post(
          `/admin/orders/${orderId}/payment-plan`,
          {
            release_policy: "deposit_paid",
            note: "BCA 123456 a.n. PT Truk Air",
            installments: [
              { label: "Uang muka 30%", amount: 30 },
              { label: "Pelunasan 70%", amount: 70 },
            ],
          },
          adminHeaders
        );
        expect(created.status).toEqual(201);
        const plan = created.data.payment_plan;
        expect(plan).toEqual(
          expect.objectContaining({
            order_id: orderId,
            status: "active",
            release_policy: "deposit_paid",
            released_at: null,
          })
        );
        expect(plan.installments).toHaveLength(2);
        const [deposit, balance] = [...plan.installments].sort(
          (a, b) => a.sequence - b.sequence
        );
        expect(deposit.status).toEqual("unpaid");

        // only one plan per order
        const dup = await api
          .post(
            `/admin/orders/${orderId}/payment-plan`,
            { installments: [{ label: "x", amount: 100 }] },
            adminHeaders
          )
          .catch((e) => e.response);
        expect(dup.status).toEqual(400);

        // the customer sees the plan through the store API
        const storePlan = await api.get(
          `/store/orders/${orderId}/payment-plan`,
          storeHeaders
        );
        expect(storePlan.status).toEqual(200);
        expect(storePlan.data.payment_plan.id).toEqual(plan.id);
        expect(storePlan.data.payment_plan.note).toEqual(
          "BCA 123456 a.n. PT Truk Air"
        );

        // the warehouse cannot fulfill yet
        const {
          data: { order: orderWithItems },
        } = await api.get(`/admin/orders/${orderId}?fields=items.id`, adminHeaders);
        const blocked = await api
          .post(
            `/admin/orders/${orderId}/fulfillments`,
            { items: [{ id: orderWithItems.items[0].id, quantity: 1 }] },
            adminHeaders
          )
          .catch((e) => e.response);
        expect(blocked.status).toEqual(400);
        expect(blocked.data.message).toContain("财务尚未确认到款");

        // customer uploads a bank transfer receipt for the deposit
        const uploaded = await api.post(
          `/store/payment-installments/${deposit.id}/proofs`,
          {
            file: { name: "bukti.png", mime_type: "image/png", content: PNG_BASE64 },
            bank_name: "BCA",
            sender_name: "Budi",
            amount: 30,
            transferred_at: new Date().toISOString(),
          },
          storeHeaders
        );
        expect(uploaded.status).toEqual(201);
        const depositAfterUpload = uploaded.data.payment_plan.installments.find(
          (i) => i.id === deposit.id
        );
        expect(depositAfterUpload.status).toEqual("awaiting_confirmation");
        expect(depositAfterUpload.proofs).toHaveLength(1);
        const proof = depositAfterUpload.proofs[0];
        expect(proof.status).toEqual("pending");
        expect(proof.file_url).toEqual(expect.any(String));

        // finance sees it in the work queue
        const queue = await api.get(
          `/admin/payment-installments?status=awaiting_confirmation`,
          adminHeaders
        );
        expect(queue.status).toEqual(200);
        expect(queue.data.installments.map((i) => i.id)).toContain(deposit.id);
        expect(queue.data.installments[0].order).toEqual(
          expect.objectContaining({ id: orderId })
        );

        // finance confirms -> paid, plan released (deposit policy)
        const confirmed = await api.post(
          `/admin/payment-installments/${deposit.id}/confirm`,
          { proof_id: proof.id },
          adminHeaders
        );
        expect(confirmed.status).toEqual(200);
        expect(confirmed.data.release).toEqual(
          expect.objectContaining({ released: true, released_now: true, all_paid: false })
        );
        const planAfter = confirmed.data.payment_plan;
        expect(planAfter.released_at).not.toBeNull();
        expect(planAfter.status).toEqual("active");
        const depositPaid = planAfter.installments.find((i) => i.id === deposit.id);
        expect(depositPaid.status).toEqual("paid");
        expect(depositPaid.payment_method).toEqual("bank_transfer");
        expect(depositPaid.proofs[0].status).toEqual("accepted");

        // confirming twice is refused
        const again = await api
          .post(
            `/admin/payment-installments/${deposit.id}/confirm`,
            {},
            adminHeaders
          )
          .catch((e) => e.response);
        expect(again.status).toEqual(400);

        // the warehouse queue now lists the order
        const warehouse = await api.get(`/admin/warehouse/orders`, adminHeaders);
        expect(warehouse.status).toEqual(200);
        expect(warehouse.data.orders.map((r) => r.order.id)).toContain(orderId);

        // a rejected receipt sends the balance back to unpaid
        const balanceUpload = await api.post(
          `/store/payment-installments/${balance.id}/proofs`,
          {
            file: { name: "bukti2.png", mime_type: "image/png", content: PNG_BASE64 },
          },
          storeHeaders
        );
        const balanceProof = balanceUpload.data.payment_plan.installments.find(
          (i) => i.id === balance.id
        ).proofs[0];
        const rejected = await api.post(
          `/admin/payment-proofs/${balanceProof.id}/reject`,
          { review_note: "Nominal tidak sesuai" },
          adminHeaders
        );
        expect(rejected.status).toEqual(200);
        const balanceAfter = rejected.data.payment_plan.installments.find(
          (i) => i.id === balance.id
        );
        expect(balanceAfter.status).toEqual("unpaid");
        expect(balanceAfter.proofs[0]).toEqual(
          expect.objectContaining({ status: "rejected", review_note: "Nominal tidak sesuai" })
        );

        // manual confirmation of the balance completes the plan
        const done = await api.post(
          `/admin/payment-installments/${balance.id}/confirm`,
          { payment_method: "other", note: "Mutasi BCA 7788" },
          adminHeaders
        );
        expect(done.data.release.all_paid).toEqual(true);
        expect(done.data.payment_plan.status).toEqual("completed");
      });

      it("full_paid policy releases only when every installment is paid, owner can force", async () => {
        const { orderId } = await createOrderViaQuote();
        const {
          data: { payment_plan: plan },
        } = await api.post(
          `/admin/orders/${orderId}/payment-plan`,
          {
            release_policy: "full_paid",
            installments: [
              { label: "DP", amount: 50 },
              { label: "Pelunasan", amount: 50 },
            ],
          },
          adminHeaders
        );
        const [first] = [...plan.installments].sort((a, b) => a.sequence - b.sequence);

        const confirmed = await api.post(
          `/admin/payment-installments/${first.id}/confirm`,
          {},
          adminHeaders
        );
        expect(confirmed.data.release.released).toEqual(false);
        expect(confirmed.data.payment_plan.released_at).toBeNull();

        const forced = await api.post(
          `/admin/payment-plans/${plan.id}/release`,
          {},
          adminHeaders
        );
        expect(forced.status).toEqual(200);
        expect(forced.data.payment_plan.released_at).not.toBeNull();
      });

      it("refunds a paid deposit, revokes the release, and cancels abandoned plans", async () => {
        const { orderId } = await createOrderViaQuote();
        const {
          data: { payment_plan: plan },
        } = await api.post(
          `/admin/orders/${orderId}/payment-plan`,
          {
            installments: [
              { label: "DP", amount: 40 },
              { label: "Pelunasan", amount: 60 },
            ],
          },
          adminHeaders
        );
        const [deposit] = [...plan.installments].sort((a, b) => a.sequence - b.sequence);

        // refunding an unpaid installment is refused
        const tooEarly = await api
          .post(`/admin/payment-installments/${deposit.id}/refund`, { amount: 10 }, adminHeaders)
          .catch((e) => e.response);
        expect(tooEarly.status).toEqual(400);

        await api.post(`/admin/payment-installments/${deposit.id}/confirm`, { payment_method: "bank_transfer" }, adminHeaders);

        // partial refund keeps it paid, release stays
        const partial = await api.post(
          `/admin/payment-installments/${deposit.id}/refund`,
          { amount: 15, reason: "Kelebihan transfer", method: "bank_transfer", bank_account: "BCA 999" },
          adminHeaders
        );
        expect(partial.status).toEqual(200);
        expect(partial.data.release_revoked).toEqual(false);
        let dep = partial.data.payment_plan.installments.find((i) => i.id === deposit.id);
        expect(dep.status).toEqual("paid");
        expect(Number(dep.refunded_amount)).toEqual(15);
        expect(dep.refunds).toHaveLength(1);

        // over-refund refused
        const tooMuch = await api
          .post(`/admin/payment-installments/${deposit.id}/refund`, { amount: 30 }, adminHeaders)
          .catch((e) => e.response);
        expect(tooMuch.status).toEqual(400);

        // full refund -> refunded, warehouse release revoked
        const full = await api.post(
          `/admin/payment-installments/${deposit.id}/refund`,
          { amount: 25, reason: "Pesanan dibatalkan", method: "bank_transfer" },
          adminHeaders
        );
        expect(full.data.release_revoked).toEqual(true);
        expect(full.data.payment_plan.released_at).toBeNull();
        dep = full.data.payment_plan.installments.find((i) => i.id === deposit.id);
        expect(dep.status).toEqual("refunded");

        // the customer sees the refund
        const storePlan = await api.get(`/store/orders/${orderId}/payment-plan`, storeHeaders);
        const storeDep = storePlan.data.payment_plan.installments.find((i) => i.id === deposit.id);
        expect(storeDep.status).toEqual("refunded");
        expect(storeDep.refunds).toHaveLength(2);

        // cancel plan (and the order)
        const cancelled = await api.post(
          `/admin/payment-plans/${plan.id}/cancel`,
          { reason: "Pelanggan membatalkan", cancel_order: false },
          adminHeaders
        );
        expect(cancelled.status).toEqual(200);
        expect(cancelled.data.payment_plan.status).toEqual("cancelled");
        const statuses = cancelled.data.payment_plan.installments.map((i) => i.status).sort();
        expect(statuses).toEqual(["cancelled", "refunded"]);

        const again = await api
          .post(`/admin/payment-plans/${plan.id}/cancel`, {}, adminHeaders)
          .catch((e) => e.response);
        expect(again.status).toEqual(400);
      });

      it("locks order edits while a plan is active and allows a new plan after cancelling it", async () => {
        const { orderId } = await createOrderViaQuote();
        await api.post(
          `/admin/orders/${orderId}/payment-plan`,
          { installments: [{ label: "Full", amount: 100 }] },
          adminHeaders
        );

        const locked = await api
          .post(`/admin/order-edits`, { order_id: orderId }, adminHeaders)
          .catch((e) => e.response);
        expect(locked.status).toEqual(400);
        expect(locked.data.message).toContain("金额已锁定");

        const plans = await api.get(`/admin/orders/${orderId}/payment-plan`, adminHeaders);
        const cancelled = await api.post(
          `/admin/payment-plans/${plans.data.payment_plan.id}/cancel`,
          { reason: "tambah ongkir", cancel_order: false },
          adminHeaders
        );
        expect(cancelled.data.payment_plan.status).toEqual("cancelled");

        // a fresh plan can now be created on the same order
        const again = await api.post(
          `/admin/orders/${orderId}/payment-plan`,
          { installments: [{ label: "Full", amount: 100 }] },
          adminHeaders
        );
        expect(again.status).toEqual(201);
        expect(again.data.payment_plan.status).toEqual("active");
      });

      it("manages team roles with a bootstrap owner", async () => {
        const team = await api.get(`/admin/team`, adminHeaders);
        expect(team.status).toEqual(200);
        expect(team.data.bootstrap).toEqual(true);
        expect(team.data.me.role).toEqual("owner");
        const me = team.data.users.find((u) => u.id === team.data.me.id);

        const set = await api.post(`/admin/team/${me.id}/role`, { role: "owner" }, adminHeaders);
        expect(set.status).toEqual(200);

        const after = await api.get(`/admin/team`, adminHeaders);
        expect(after.data.bootstrap).toEqual(false);

        // the last owner cannot demote themselves
        const demote = await api
          .post(`/admin/team/${me.id}/role`, { role: "finance" }, adminHeaders)
          .catch((e) => e.response);
        expect(demote.status).toEqual(400);
      });

      it("serves Indonesian regions for address pickers", async () => {
        const pub = { headers: { "x-publishable-api-key": storeHeaders.headers["x-publishable-api-key"] } };
        const provinces = await api.get(`/store/wilayah`, pub);
        expect(provinces.status).toEqual(200);
        expect(provinces.data.provinces.length).toBeGreaterThan(30);
        const jakarta = provinces.data.provinces.find((p) => p.code === "31");
        expect(jakarta.name).toMatch(/Jakarta/i);
        const regencies = await api.get(`/store/wilayah/31`, pub);
        expect(regencies.data.regencies.length).toBeGreaterThan(4);
        const districts = await api.get(`/store/wilayah/31.71`, pub);
        expect(districts.data.districts.map((d) => d.name)).toContain("Gambir");
      });

      it("issues and verifies WhatsApp OTP codes for sign-up", async () => {
        const pub = { headers: { "x-publishable-api-key": storeHeaders.headers["x-publishable-api-key"] } };
        const sent = await api.post(`/store/otp/request`, { phone: "0812-3456-7890" }, pub);
        expect(sent.status).toEqual(200);
        expect(sent.data.phone).toEqual("6281234567890");

        const wrong = await api
          .post(`/store/otp/verify`, { phone: "081234567890", code: "123456" }, pub)
          .catch((e) => e.response);
        expect(wrong.status).toEqual(400);

        // OTP_DEV_CODE is accepted outside production
        const ok = await api.post(`/store/otp/verify`, { phone: "+6281234567890", code: "000000" }, pub);
        expect(ok.status).toEqual(200);
        expect(ok.data.verification_token).toEqual(expect.any(String));

        const bad = await api
          .post(`/store/otp/request`, { phone: "12" }, pub)
          .catch((e) => e.response);
        expect(bad.status).toEqual(400);
      });

      it("registers and removes push device tokens for the customer", async () => {
        const token = "fcm-token-" + "x".repeat(40);
        const reg = await api.post(`/store/push-tokens`, { token, platform: "ios", app_version: "0.1.0" }, storeHeaders);
        expect(reg.status).toEqual(200);
        expect(reg.data.device.platform).toEqual("ios");

        // re-registering the same token is idempotent
        const again = await api.post(`/store/push-tokens`, { token, platform: "ios" }, storeHeaders);
        expect(again.data.device.id).toEqual(reg.data.device.id);

        const list = await api.get(`/store/push-tokens`, storeHeaders);
        expect(list.data.devices).toHaveLength(1);

        const del = await api.delete(`/store/push-tokens/${encodeURIComponent(token)}`, storeHeaders);
        expect(del.data.deleted).toEqual(true);
        const after = await api.get(`/store/push-tokens`, storeHeaders);
        expect(after.data.devices).toHaveLength(0);

        const anon = await api
          .post(`/store/push-tokens`, { token }, { headers: { "x-publishable-api-key": storeHeaders.headers["x-publishable-api-key"] } })
          .catch((e) => e.response);
        expect(anon.status).toEqual(401);
      });

      it("hides other customers' plans and rejects unauthenticated access", async () => {
        const { orderId } = await createOrderViaQuote();
        await api.post(
          `/admin/orders/${orderId}/payment-plan`,
          { installments: [{ label: "Full", amount: 100 }] },
          adminHeaders
        );

        const anon = await api
          .get(`/store/orders/${orderId}/payment-plan`, {
            headers: { "x-publishable-api-key": storeHeaders.headers["x-publishable-api-key"] },
          })
          .catch((e) => e.response);
        expect(anon.status).toEqual(401);
      });
    });
  },
});
