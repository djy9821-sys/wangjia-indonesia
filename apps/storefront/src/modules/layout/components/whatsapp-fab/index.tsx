/*
  Floating WhatsApp button on every store page: in Indonesia most buyers ask
  before they order. Uses the same number as the app and the notifications.
*/
const WhatsAppFab = () => {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6281200000000"
  const text = encodeURIComponent("Halo WANGJIA, saya mau tanya tentang kincir air.")
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg hover:brightness-95 small:bottom-6 small:right-6"
    >
      <svg viewBox="0 0 32 32" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.3.7 4.5 1.9 6.4L4 29l7.9-1.9c1.8 1 3.9 1.5 6.1 1.5 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.7c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.7 1.1 1.2-4.5-.3-.4A9.8 9.8 0 0 1 6 14.9C6 9.4 10.5 5 16 5s10 4.4 10 9.9-4.5 9.8-10 9.8zm5.5-7.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4z" />
      </svg>
      <span className="hidden small:inline text-sm font-medium">Chat WhatsApp</span>
    </a>
  )
}

export default WhatsAppFab
