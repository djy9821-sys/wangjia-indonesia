import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ensureAdminRole } from "../../middlewares/ensure-admin-role";
import {
  listInstallmentsTransformQueryConfig,
  retrievePaymentPlanTransformQueryConfig,
} from "./query-config";
import {
  AdminConfirmInstallment,
  AdminCreatePaymentPlan,
  AdminGetPaymentPlanParams,
  AdminListInstallmentsParams,
  AdminRejectProof,
  AdminReleasePlan,
} from "./validators";

/*
  Warehouse gate: an order can only be fulfilled once finance has released
  its payment plan. Orders without a plan need a captured payment.
*/
export const ensureOrderReleasedForFulfillment = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: plans } = await query.graph({
    entity: "payment_plan",
    fields: ["id", "released_at", "status"],
    filters: { order_id: req.params.id },
  });
  const plan = plans[0];

  if (plan) {
    if (!plan.released_at) {
      return res.status(400).json({
        type: "not_allowed",
        message: "财务尚未确认到款，此订单还不能发货",
      });
    }
    return next();
  }

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "payment_collections.status"],
    filters: { id: req.params.id },
  });
  const captured = (order?.payment_collections ?? []).some((pc: any) =>
    ["captured", "completed", "partially_captured"].includes(pc.status)
  );
  if (!captured) {
    return res.status(400).json({
      type: "not_allowed",
      message: "此订单没有付款计划，也没有已收款记录，不能发货。请先创建付款计划。",
    });
  }
  return next();
};

export const adminPaymentPlansMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/orders/:id/payment-plan",
    middlewares: [
      validateAndTransformQuery(
        AdminGetPaymentPlanParams,
        retrievePaymentPlanTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/payment-plan",
    middlewares: [
      ensureAdminRole("sales", "finance"),
      validateAndTransformBody(AdminCreatePaymentPlan),
      validateAndTransformQuery(
        AdminGetPaymentPlanParams,
        retrievePaymentPlanTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/payment-installments",
    middlewares: [
      validateAndTransformQuery(
        AdminListInstallmentsParams,
        listInstallmentsTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/payment-installments/:id/confirm",
    middlewares: [
      ensureAdminRole("finance"),
      validateAndTransformBody(AdminConfirmInstallment),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/payment-proofs/:id/reject",
    middlewares: [
      ensureAdminRole("finance"),
      validateAndTransformBody(AdminRejectProof),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/payment-plans/:id/release",
    middlewares: [ensureAdminRole(), validateAndTransformBody(AdminReleasePlan)],
  },
  {
    method: ["GET"],
    matcher: "/admin/warehouse/orders",
    middlewares: [ensureAdminRole("warehouse", "finance", "sales")],
  },
  {
    method: ["POST"],
    matcher: "/admin/orders/:id/fulfillments",
    middlewares: [
      ensureAdminRole("warehouse"),
      ensureOrderReleasedForFulfillment,
    ],
  },
];
