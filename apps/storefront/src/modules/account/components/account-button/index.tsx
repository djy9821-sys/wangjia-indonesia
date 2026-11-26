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
      className="flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl px-2 py-1"
      href="/account"
      aria-label={customer ? "Akun saya" : "Masuk"}
    >
      <User size={15} />
      <span className="hidden medium:inline-block">
        {customer ? customer.first_name : "Masuk"}
      </span>
    </LocalizedClientLink>
  )
}
