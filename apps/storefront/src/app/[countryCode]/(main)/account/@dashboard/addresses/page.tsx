import { retrieveCustomer } from "@/lib/data/customer"
import { getRegion } from "@/lib/data/regions"
import AddressBook from "@/modules/account/components/address-book"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Alamat",
  description: "Alamat pengiriman Anda",
}

export default async function Addresses(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Alamat Pengiriman</h1>
        <p className="text-base-regular">
          Simpan alamat tambak, kolam, atau gudang Anda agar bisa dipilih langsung saat checkout.
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
