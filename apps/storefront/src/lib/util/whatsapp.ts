/** wa.me link with a prefilled message; the number is the shop's sales line (same as the floating button). */
export function whatsappLink(text: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6281200000000"
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}
