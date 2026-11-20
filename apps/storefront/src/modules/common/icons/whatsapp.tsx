/* WhatsApp line icon in currentColor; decorative (aria-hidden), the button carries the label. */
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.6-4.4A8.4 8.4 0 1 1 20.5 11.6Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path
      d="M9 8.6c.2-.5.6-.6.9-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c.4.9 1.2 1.7 2.1 2.1l.6-.5c.2-.1.4-.2.6-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.7-.6.9-.8.4-2.4.4-4.4-1.6S8.6 9.4 9 8.6Z"
      fill="currentColor"
    />
  </svg>
)

export default WhatsAppIcon
