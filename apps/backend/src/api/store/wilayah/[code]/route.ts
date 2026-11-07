import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { getWilayah } from "../../../../utils/wilayah";

/*
  GET /store/wilayah/:code
    code = province code ("31")      -> its regencies (kabupaten/kota)
    code = regency code ("31.71")    -> its districts (kecamatan)
*/
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const code = String(req.params.code);
  const data = getWilayah();
  const depth = code.split(".").length;
  res.setHeader("Cache-Control", "public, max-age=86400");
  if (depth === 1) {
    return res.json({ regencies: data.regencies[code] ?? [] });
  }
  if (depth === 2) {
    return res.json({ districts: data.districts[code] ?? [] });
  }
  return res.status(404).json({ message: "Unknown region code" });
};
