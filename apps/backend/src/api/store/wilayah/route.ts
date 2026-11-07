import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { getWilayah } from "../../../utils/wilayah";

/* GET /store/wilayah -> provinces */
export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.json({ provinces: getWilayah().provinces });
};
