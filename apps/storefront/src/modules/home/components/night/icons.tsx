/* Small line icons for the night home page; currentColor, decorative (aria-hidden). */

export const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export { default as WhatsAppIcon } from "@/modules/common/icons/whatsapp"

export const PauseIcon = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true" className="i-pause">
    <path d="M3 2v8M9 2v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const PlayIcon = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true" className="i-play">
    <path d="M3 1.8v8.4L10 6Z" fill="currentColor" />
  </svg>
)
