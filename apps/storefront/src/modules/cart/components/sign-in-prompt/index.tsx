"use client"

import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { Container, Text } from "@medusajs/ui"
import Image from "next/image"

const BackgroundImage = () => (
  <div className="absolute inset-0 bg-[linear-gradient(120deg,#0E5A8A_0%,#1B8A5A_100%)]">
    <Image
      src="/products/aerator-2hp.png"
      alt=""
      width={320}
      height={240}
      className="absolute right-0 bottom-0 h-full w-auto object-contain opacity-30 pointer-events-none"
    />
  </div>
)

const SignInPrompt = () => {
  return (
    <Container className="flex justify-between self-stretch relative w-full h-28 p-0 overflow-hidden">
      <BackgroundImage />
      <div className="absolute inset-0 z-1 flex justify-between items-center text-center p-4">
        <Text className="small:text-4xl text-lg text-white text-left">
          Masuk untuk
          <br />
          checkout lebih cepat.
        </Text>
        <div className="flex small:flex-row flex-col small:gap-4 gap-2">
          <LocalizedClientLink href="/account?view=register">
            <Button
              variant="secondary"
              className="small:h-10 h-8 small:min-w-36 min-w-24 rounded-full"
              data-testid="sign-in-button"
            >
              Daftar
            </Button>
          </LocalizedClientLink>
          <LocalizedClientLink href="/account?view=log-in">
            <Button
              variant="primary"
              className="small:h-10 h-8 small:min-w-36 min-w-24 rounded-full"
              data-testid="sign-in-button"
            >
              Masuk
            </Button>
          </LocalizedClientLink>
        </div>
      </div>
    </Container>
  )
}

export default SignInPrompt
