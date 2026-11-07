"use client"

import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@medusajs/ui"
import Markdown from "react-markdown"
import Accordion from "./accordion"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Deskripsi",
      component: <ProductSpecsTab product={product} />,
    },
    {
      label: "Spesifikasi",
      component: <ProductSpecificationsTab product={product} />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple" className="flex flex-col gap-y-2">
        {tabs.map((tab, i) => (
          <Accordion.Item
            className="bg-neutral-100 small:px-24 px-6"
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductSpecsTab = ({ product }: ProductTabsProps) => {
  return (
    <div className="text-small-regular py-8 xl:w-2/3">
      <Markdown
        components={{
          p: ({ children }) => (
            <Text className="text-neutral-950 mb-2">{children}</Text>
          ),
          h2: ({ children }) => (
            <Text className="text-xl text-neutral-950 my-4 font-semibold">
              {children}
            </Text>
          ),
          h3: ({ children }) => (
            <Text className="text-lg text-neutral-950 mb-2">{children}</Text>
          ),
        }}
      >
        {product.description ? product.description : "-"}
      </Markdown>
    </div>
  )
}

/*
  Specs live in product metadata as "spec:<label>" = "<value>" so they can be
  edited in the admin's Metadata panel without a custom UI. Other metadata
  keys (brand, internal flags) are not shown.
*/
// Keys may carry a numeric prefix ("spec:03 Listrik") to fix the display order.
const specEntries = (metadata?: Record<string, unknown> | null) =>
  Object.entries(metadata ?? {})
    .filter(([k, v]) => k.startsWith("spec:") && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => [k.slice(5).replace(/^\d+\s+/, ""), String(v)] as const)

const ProductSpecificationsTab = ({ product }: ProductTabsProps) => {
  const specs = specEntries(product.metadata)
  return (
    <div className="text-small-regular py-8">
      <Table className="rounded-lg shadow-borders-base overflow-hidden border-none">
        <Table.Body>
          {specs.map(([label, value]) => (
            <Table.Row key={label}>
              <Table.Cell className="border-r">
                <span className="font-semibold">{label}</span>
              </Table.Cell>
              <Table.Cell className="px-4">{value}</Table.Cell>
            </Table.Row>
          ))}
          {!specs.length && product.weight && (
            <Table.Row>
              <Table.Cell className="border-r">
                <span className="font-semibold">Berat</span>
              </Table.Cell>
              <Table.Cell className="px-4">{(product.weight / 1000).toLocaleString("id-ID")} kg</Table.Cell>
            </Table.Row>
          )}
          {(product.height || product.width || product.length) && (
            <Table.Row>
              <Table.Cell className="border-r">
                <span className="font-semibold">Dimensi (T × L × P)</span>
              </Table.Cell>
              <Table.Cell className="px-4">
                {product.height} × {product.width} × {product.length} mm
              </Table.Cell>
            </Table.Row>
          )}

          {!specs.length && !product.weight && (
            <Table.Row>
              <Table.Cell className="px-4 text-ui-fg-subtle">Spesifikasi belum diisi.</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  )
}

export default ProductTabs
