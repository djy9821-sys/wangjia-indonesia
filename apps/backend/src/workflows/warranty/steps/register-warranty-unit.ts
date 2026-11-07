import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { WARRANTY_MODULE } from "../../../modules/warranty";
import WarrantyModuleService from "../../../modules/warranty/service";
import { addMonths } from "../../../utils/warranty";

export type RegisterWarrantyUnitInput = {
  code: string;
  customer_id: string;
  registered_name: string | null;
  registered_phone: string | null;
  farm_location?: string | null;
};

/*
  Activates the warranty of the unit behind a QR code for the calling
  customer. Re-registering your own unit just updates the farm location;
  a unit registered by someone else is refused.
*/
export const registerWarrantyUnitStep = createStep(
  "register-warranty-unit",
  async (input: RegisterWarrantyUnitInput, { container }) => {
    const service = container.resolve<WarrantyModuleService>(WARRANTY_MODULE);
    const [unit] = await service.listWarrantyUnits({ code: input.code.toUpperCase() });
    if (!unit || unit.status === "void") {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Kode tidak dikenal. Unit ini bukan produk WANGJIA resmi atau labelnya sudah dibatalkan."
      );
    }
    if (unit.customer_id && unit.customer_id !== input.customer_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Unit ini sudah didaftarkan oleh pelanggan lain. Hubungi tim WANGJIA jika Anda pembeli yang sah."
      );
    }

    const previous = {
      id: unit.id,
      status: unit.status,
      customer_id: unit.customer_id,
      registered_at: unit.registered_at,
      registered_name: unit.registered_name,
      registered_phone: unit.registered_phone,
      farm_location: unit.farm_location,
      warranty_expires_at: unit.warranty_expires_at,
    };

    const registeredAt = unit.registered_at ?? new Date();
    const updated = await service.updateWarrantyUnits({
      id: unit.id,
      status: "registered",
      customer_id: input.customer_id,
      registered_at: registeredAt,
      registered_name: input.registered_name,
      registered_phone: input.registered_phone,
      farm_location: input.farm_location ?? unit.farm_location,
      warranty_expires_at: unit.warranty_expires_at ?? addMonths(registeredAt, unit.warranty_months),
    });

    return new StepResponse({ unit: updated, first_time: !previous.customer_id }, previous);
  },
  async (previous, { container }) => {
    if (!previous) return;
    const service = container.resolve<WarrantyModuleService>(WARRANTY_MODULE);
    await service.updateWarrantyUnits(previous);
  }
);
