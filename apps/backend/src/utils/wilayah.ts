import { readFileSync } from "node:fs";
import path from "node:path";

export type Region = { code: string; name: string };
export type Wilayah = {
  source: string;
  provinces: Region[];
  regencies: Record<string, Region[]>;
  districts: Record<string, Region[]>;
};

let cache: Wilayah | null = null;

/*
  Indonesian administrative regions (38 provinces, 514 regencies, 7,285
  districts) from cahyadsn/wilayah (MIT). Loaded once from data/wilayah.json.
*/
export function getWilayah(): Wilayah {
  if (!cache) {
    const candidates = [
      path.join(process.cwd(), "data", "wilayah.json"),
      path.join(__dirname, "..", "..", "data", "wilayah.json"),
      path.join(__dirname, "..", "..", "..", "data", "wilayah.json"),
    ];
    const file = candidates.find((p) => {
      try {
        readFileSync(p);
        return true;
      } catch {
        return false;
      }
    });
    if (!file) {
      throw new Error("data/wilayah.json not found");
    }
    cache = JSON.parse(readFileSync(file, "utf8")) as Wilayah;
  }
  return cache;
}
