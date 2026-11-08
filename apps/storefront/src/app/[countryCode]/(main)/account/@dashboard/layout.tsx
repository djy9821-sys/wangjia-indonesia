import { retrieveCustomer } from "@/lib/data/customer"
import AccountLayout from "@/modules/account/templates/account-layout"
import BrandBanner from "@/modules/common/components/brand-banner"

export default async function AccountPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <div className="flex flex-col gap-2 p-2">
      <BrandBanner className="h-44" />
      <AccountLayout customer={customer}>{children}</AccountLayout>
    </div>
  )
}
