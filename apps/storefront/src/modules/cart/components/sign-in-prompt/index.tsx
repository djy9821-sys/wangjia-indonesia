"use client"

import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Image from "next/image"

/*
  Above the cart of a visitor who is not signed in: an order needs an account (payment in
  stages and the warranty are tied to it), so the two ways in sit here, on the night of the
  home page with the machine.
*/
const SignInPrompt = () => (
  <div className="relative flex min-h-[112px] w-full items-center justify-between gap-4 overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#121d3d_0%,#060b15_70%)] p-5 text-[#f2f4f7]">
    <Image
      src="/products/kincir-2hp-oranye-front.webp"
      alt=""
      width={1000}
      height={475}
      className="pointer-events-none absolute bottom-2 right-[30%] hidden h-[64%] w-auto object-contain opacity-60 small:block"
    />
    <p className="relative text-[18px] font-medium leading-snug small:text-[26px]">
      Masuk untuk
      <br />
      melanjutkan pesanan.
    </p>
    <div className="relative flex shrink-0 flex-col gap-2 small:flex-row small:gap-3">
      <LocalizedClientLink href="/account?view=log-in">
        <Button variant="primary" className="h-10 min-w-28 small:min-w-36" data-testid="sign-in-button">
          Masuk
        </Button>
      </LocalizedClientLink>
      <LocalizedClientLink href="/account?view=register">
        <Button variant="secondary" className="h-10 min-w-28 small:min-w-36" data-testid="register-button">
          Daftar
        </Button>
      </LocalizedClientLink>
    </div>
  </div>
)

export default SignInPrompt
