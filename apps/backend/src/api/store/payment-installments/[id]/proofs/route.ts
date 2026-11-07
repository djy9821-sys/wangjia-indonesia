import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows";
import { submitPaymentProofWorkflow } from "../../../../../workflows/payment-plan/workflows";
import {
  assertInstallmentOwnedByCustomer,
  retrieveStorePaymentPlan,
} from "../../../payment-plans/utils";
import { StoreSubmitPaymentProofType } from "../../../payment-plans/validators";

/*
  Customer uploads a bank transfer receipt for an installment.
  The file is stored through Medusa's File module, then the proof is recorded
  and the installment goes to "awaiting_confirmation".
*/
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreSubmitPaymentProofType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id;
  const installment = await assertInstallmentOwnedByCustomer(
    req.scope,
    req.params.id,
    customerId
  );

  const { file, ...details } = req.validatedBody;
  const binary = Buffer.from(file.content, "base64").toString("binary");

  const { result: uploaded } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: [
        {
          filename: `${installment.id}-${Date.now()}-${file.name}`,
          mimeType: file.mime_type,
          content: binary,
          access: "public",
        },
      ],
    },
  });

  await submitPaymentProofWorkflow(req.scope).run({
    input: {
      installment_id: installment.id,
      submitted_by: customerId,
      file_url: uploaded[0].url,
      file_id: uploaded[0].id,
      bank_name: details.bank_name ?? null,
      sender_name: details.sender_name ?? null,
      amount: details.amount ?? null,
      transferred_at: details.transferred_at ?? null,
      note: details.note ?? null,
    },
  });

  const plan = await retrieveStorePaymentPlan(req.scope, {
    id: installment.plan_id,
  });

  res.status(201).json({ payment_plan: plan });
};
