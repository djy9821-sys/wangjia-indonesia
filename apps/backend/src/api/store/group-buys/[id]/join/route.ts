import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { addToCartWorkflow, createCartWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { GROUP_BUY_MODULE } from "../../../../../modules/group-buy";
import GroupBuyModuleService from "../../../../../modules/group-buy/service";
import { isGroupBuyJoinable, summarizeGroupBuys } from "../../../../../utils/group-buy";
import { StoreJoinGroupBuy } from "../../validators";

/*
  POST /store/group-buys/:id/join { quantity, cart_id?, region_id? }
  Puts the variant into the customer's cart at the group price (a custom-price
  line tagged with group_buy_id). Checkout then runs as usual; the order is
  counted toward the group when it is placed. Without cart_id a new cart is
  created for the caller.
*/
export const POST = async (req: AuthenticatedMedusaRequest<StoreJoinGroupBuy>, res: MedusaResponse) => {
  const service = req.scope.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const customerId = req.auth_context.actor_id;
  const { quantity } = req.validatedBody;

  const gb = await service.retrieveGroupBuy(req.params.id).catch(() => null);
  if (!gb || !isGroupBuyJoinable(gb)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Patungan ini sudah ditutup.");
  }
  const [summary] = await summarizeGroupBuys(req.scope, [gb]);
  if (summary.remaining_quantity !== null && quantity > summary.remaining_quantity) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Sisa kuota patungan tinggal ${summary.remaining_quantity} unit.`
    );
  }

  let cartId = req.validatedBody.cart_id;
  if (cartId) {
    const {
      data: [cart],
    } = await query.graph({ entity: "cart", fields: ["id", "customer_id", "completed_at"], filters: { id: cartId } });
    if (!cart || cart.completed_at || (cart.customer_id && cart.customer_id !== customerId)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Keranjang tidak valid.");
    }
  } else {
    let regionId = req.validatedBody.region_id;
    if (!regionId) {
      const { data: regions } = await query.graph({
        entity: "region",
        fields: ["id", "currency_code"],
        filters: { currency_code: gb.currency_code },
      });
      regionId = regions[0]?.id;
    }
    if (!regionId) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Region belum diatur.");
    const {
      data: [customer],
    } = await query.graph({ entity: "customer", fields: ["id", "email"], filters: { id: customerId } });
    const { result: cart } = await createCartWorkflow(req.scope).run({
      input: {
        region_id: regionId,
        customer_id: customerId,
        email: customer?.email ?? undefined,
        sales_channel_id: req.publishable_key_context?.sales_channel_ids?.[0],
        metadata: { group_buy_id: gb.id },
      },
    });
    cartId = cart.id;
  }

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id: cartId!,
      items: [
        {
          variant_id: gb.variant_id,
          quantity,
          unit_price: Number(gb.group_price),
          compare_at_unit_price: gb.regular_price == null ? undefined : Number(gb.regular_price),
          metadata: { group_buy_id: gb.id, group_buy_title: gb.title },
        },
      ],
    },
  });

  res.json({ cart_id: cartId, group_buy: summary });
};
