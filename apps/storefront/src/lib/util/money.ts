import { isEmpty } from "@/lib/util/isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "id-ID",
}: ConvertToLocaleParams) => {
  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }
  // Rupiah is quoted without sen: "Rp 8.900.000" instead of "IDR 8,900,000.00".
  const wholeAmount = Number.isInteger(amount)
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency_code,
    minimumFractionDigits: minimumFractionDigits ?? (wholeAmount ? 0 : undefined),
    maximumFractionDigits: maximumFractionDigits ?? (wholeAmount ? 0 : undefined),
  }).format(amount)
}
