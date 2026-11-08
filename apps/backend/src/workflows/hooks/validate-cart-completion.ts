import { completeCartWorkflow } from "@medusajs/core-flows";
import { StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { getCartApprovalStatus } from "../../utils/get-cart-approval-status";
import { checkSpendingLimit } from "../../utils/check-spending-limit";
import { HttpTypes } from "@medusajs/framework/types";
import { GROUP_BUY_MODULE } from "../../modules/group-buy";
import GroupBuyModuleService from "../../modules/group-buy/service";
import { isGroupBuyJoinable } from "../../utils/group-buy";
completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [queryCart],
  } = await query.graph({
    entity: "cart",
    fields: ["approvals.*", "customer_id", "total", "items.metadata"],
    filters: {
      id: cart.id,
    },
  });

  // Check if cart is pending approval
  const { isPendingApproval } = getCartApprovalStatus(queryCart);

  if (isPendingApproval) {
    throw new Error("Cart is pending approval");
  }

  // Check if spending limit will be exceeded
  if (queryCart.customer_id) {
    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["employee.spending_limit"],
      filters: {
        id: queryCart.customer_id,
      },
    });

    if (customer.employee?.spending_limit) {
      const spendLimitExceeded = checkSpendingLimit(
        queryCart as any,
        customer as any
      );

      if (spendLimitExceeded) {
        throw new Error("Cart total exceeds spending limit");
      }
    }
  }

  // Group-buy lines carry a custom price that is only valid while the group is open.
  const groupBuyIds: string[] = [
    ...new Set<string>(
      ((queryCart as any).items ?? [])
        .map((i: any) => i?.metadata?.group_buy_id)
        .filter((id: unknown): id is string => typeof id === "string" && !!id)
    ),
  ];
  if (groupBuyIds.length) {
    const groupBuys = container.resolve<GroupBuyModuleService>(GROUP_BUY_MODULE);
    for (const id of groupBuyIds) {
      const gb = await groupBuys.retrieveGroupBuy(id).catch(() => null);
      if (!gb || !isGroupBuyJoinable(gb)) {
        throw new Error("Patungan sudah ditutup. Hapus barang patungan dari keranjang atau pesan dengan harga normal.");
      }
    }
  }

  return new StepResponse(undefined, null);
});
