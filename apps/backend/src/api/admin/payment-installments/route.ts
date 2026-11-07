import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { fetchOrdersById } from "../payment-plans/utils";
import { AdminListInstallmentsParamsType } from "../payment-plans/validators";

/*
  Finance work queue: installments, optionally filtered by status
  (e.g. status=awaiting_confirmation), decorated with their order.
*/
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminListInstallmentsParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { fields, pagination } = req.queryConfig;
  const status = req.validatedQuery?.status as string | string[] | undefined;

  const { data: installments, metadata } = await query.graph({
    entity: "payment_installment",
    fields,
    filters: (status ? { status } : {}) as Record<string, unknown>,
    pagination: {
      ...pagination,
      skip: pagination.skip!,
      order: { created_at: "DESC" },
    },
  });

  const orderIds = Array.from(
    new Set(
      installments
        .map((i: any) => i.plan?.order_id as string | undefined)
        .filter(Boolean) as string[]
    )
  );
  const orders = await fetchOrdersById(req.scope, orderIds);

  res.json({
    installments: installments.map((i: any) => ({
      ...i,
      order: orders[i.plan?.order_id] ?? null,
    })),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });
};
