import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import User from "@/modules/common/icons/user"
import { B2BCustomer } from "@/types/global"

export default function AccountButton({
  customer,
}: {
  customer: B2BCustomer | null
}) {
  // a link styled as the bar's other controls (it used to wrap a button, which is not valid)
  return (
    <LocalizedClientLink
      className="flex gap-1.5 items-center rounded-2xl px-2 py-1 hover:bg-neutral-100"
      href="/account"
    >
      <User />
      <span className="hidden small:inline-block">
        {customer ? customer.first_name : "Masuk"}
      </span>
    </LocalizedClientLink>
  )
}
