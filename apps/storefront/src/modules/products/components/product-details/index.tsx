import { HttpTypes } from "@medusajs/types"
import Markdown from "react-markdown"

/*
  Specifications and description, always open (no accordion): a farmer comparing machines
  should not have to hunt for the numbers. Specs live in product metadata as
  "spec:<label>" = "<value>", editable in the admin's Metadata panel; a numeric prefix
  ("spec:03 Listrik") fixes the order.
*/
const specEntries = (metadata?: Record<string, unknown> | null) =>
  Object.entries(metadata ?? {})
    .filter(([k, v]) => k.startsWith("spec:") && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => [k.slice(5).replace(/^\d+\s+/, ""), String(v)] as const)

const MONO = "font-[family-name:var(--font-geist-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-[#6b6f76]"
const HEAD = "mt-3 font-[family-name:var(--font-archivo)] [font-stretch:72%] font-extrabold uppercase leading-[0.92] text-[40px] small:text-[56px] text-[#121417]"

export default function ProductDetails({ product }: { product: HttpTypes.StoreProduct }) {
  const specs = specEntries(product.metadata)
  const rows: (readonly [string, string])[] = [...specs]
  if (!specs.length && product.weight) rows.push(["Berat", `${(product.weight / 1000).toLocaleString("id-ID")} kg`])
  if (product.height || product.width || product.length) rows.push(["Dimensi (T × L × P)", `${product.height ?? "–"} × ${product.width ?? "–"} × ${product.length ?? "–"} mm`])

  return (
    <div className="border-t border-[#e3dfd6]">
      <section className="content-container grid gap-8 py-14 small:grid-cols-12 small:gap-12 small:py-20" aria-labelledby="spec-title">
        <div className="small:col-span-4">
          <p className={MONO}>Spesifikasi</p>
          <h2 id="spec-title" className={HEAD}>
            Angka dari katalog
          </h2>
        </div>
        <dl className="divide-y divide-[#e3dfd6] border-y border-[#e3dfd6] small:col-span-8">
          {rows.length ? (
            rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(110px,38%)_1fr] gap-4 py-3.5">
                <dt className={MONO + " pt-0.5"}>{k}</dt>
                <dd className="text-[16px] text-[#121417]">{v}</dd>
              </div>
            ))
          ) : (
            <div className="py-3.5 text-[15px] text-[#6b6f76]">Spesifikasi belum diisi. Tanyakan lewat WhatsApp.</div>
          )}
        </dl>
      </section>

      {product.description && (
        <section className="content-container grid gap-8 pb-16 small:grid-cols-12 small:gap-12 small:pb-24" aria-labelledby="desc-title">
          <div className="small:col-span-4">
            <p className={MONO}>Deskripsi</p>
            <h2 id="desc-title" className={HEAD}>
              Tentang produk ini
            </h2>
          </div>
          <div className="max-w-[68ch] text-[17px] leading-relaxed text-[#2b2f35] small:col-span-8 [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-[20px] [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-4">
            <Markdown>{product.description}</Markdown>
          </div>
        </section>
      )}
    </div>
  )
}
