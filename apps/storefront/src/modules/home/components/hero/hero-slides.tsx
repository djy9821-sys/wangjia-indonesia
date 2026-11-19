"use client"

import LocalizedClientLink from "@/modules/common/components/localized-client-link"
// Poppins ships with the shop (open font licence), so nothing is fetched from Google.
import "@fontsource/poppins/latin-400.css"
import "@fontsource/poppins/latin-600.css"
import "@fontsource/poppins/latin-800.css"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"

export type HeroSlide = {
  handle: string
  words: string[]
  image: string
  width: number
  height: number
  alt: string
  /** Width of the machine, picked per photo so the words stay readable. */
  size: string
  line: string
  strong: string
  price: string | null
}

const AUTO_MS = 7000

const Arrow = ({ flip }: { flip?: boolean }) => (
  <svg aria-hidden viewBox="0 0 24 24" className={`h-5 w-5 ${flip ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

/* One machine at a time on black: its name fills the screen and the machine
   sits in front of the words. Moves on by itself unless pointed at, and not at
   all for visitors who prefer less motion. */
const HeroSlides = ({ slides }: { slides: HeroSlide[] }) => {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + slides.length) % slides.length),
    [slides.length]
  )

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }
    const timer = window.setTimeout(() => go(1), AUTO_MS)
    return () => window.clearTimeout(timer)
  }, [index, paused, go, slides.length])

  const slide = slides[index]
  const number = String(index + 1).padStart(2, "0")

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Produk unggulan WANGJIA"
      className="relative isolate overflow-hidden rounded-3xl bg-black font-['Poppins',ui-sans-serif,system-ui,sans-serif] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1)
        if (e.key === "ArrowLeft") go(-1)
      }}
    >
      <div className="relative mx-auto flex min-h-[640px] max-w-[1440px] flex-col px-6 pt-6 pb-8 small:min-h-[780px] small:px-14 small:pt-10 small:pb-10">
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Produk sebelumnya"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/90 transition hover:bg-white hover:text-black"
          >
            <Arrow flip />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Produk berikutnya"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/90 transition hover:bg-white hover:text-black"
          >
            <Arrow />
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center py-6">
          <h1
            key={`words-${index}`}
            className="pointer-events-none select-none text-center text-[clamp(4.25rem,13vw,11.5rem)] font-extrabold leading-[0.86] tracking-[-0.035em]"
          >
            {slide.words.map((word, i) => (
              <span
                key={word + i}
                className="block opacity-0 animate-hero-word motion-reduce:animate-none motion-reduce:opacity-100"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {word}
              </span>
            ))}
          </h1>
          <div
            key={`machine-${index}`}
            className="absolute inset-0 flex items-center justify-center animate-hero-product motion-reduce:animate-none"
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              width={slide.width}
              height={slide.height}
              priority={index === 0}
              className={`h-auto max-w-[780px] drop-shadow-[0_45px_45px_rgba(0,0,0,0.7)] ${slide.size}`}
            />
          </div>
          <div role="tablist" aria-label="Pilih produk" className="absolute right-0 top-1/2 hidden -translate-y-1/2 flex-col gap-4 small:flex">
            {slides.map((s, i) => (
              <button
                key={s.handle}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.words.join(" ")}
                onClick={() => setIndex(i)}
                className={`h-4 w-4 rounded-full border-2 border-white transition ${i === index ? "bg-white" : "bg-transparent hover:bg-white/40"}`}
              />
            ))}
          </div>
        </div>

        <div className="relative grid items-end gap-6 small:grid-cols-[1fr_auto_1fr]">
          <p className="text-lg leading-snug small:text-2xl">
            {slide.line}
            <br />
            <b className="font-extrabold">{slide.strong}</b>
          </p>
          <div className="flex items-center gap-4">
            <LocalizedClientLink
              href={`/products/${slide.handle}`}
              className="rounded-md border-2 border-white/90 px-6 py-3 text-sm font-semibold transition hover:bg-white hover:text-black"
            >
              Lihat produk
            </LocalizedClientLink>
            {slide.price && <span className="text-sm text-white/70">mulai {slide.price}</span>}
          </div>
          <div aria-hidden className="flex items-end justify-end gap-4">
            <span className="mb-[0.9em] hidden h-px w-28 bg-white/70 small:block" />
            <span className="text-[clamp(5rem,11vw,9.5rem)] font-normal leading-[0.8] text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.9)]">
              {number}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSlides
