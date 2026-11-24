"use client"

import { MachineInfo } from "@/lib/util/machines"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/*
  The pictures on a night stage, after mock-up A2. A machine opens with its cut-out standing
  on night water, the model set huge behind it and its reflection below. Catalogue photos
  are white squares, so they sit in a pool of moonlight: multiplied onto it, their white
  disappears and only the part remains. Styles: templates/product.css.
*/

type Slide = { kind: "night" } | { kind: "photo"; image: { id: string; url: string; alt?: string } }

type ImageGalleryProps = {
  product: HttpTypes.StoreProduct
  stage?: MachineInfo | null
}

const ImageGallery = ({ product, stage }: ImageGalleryProps) => {
  const slides = useMemo<Slide[]>(() => {
    const photos = (product.images?.length ? product.images : product.thumbnail ? [{ id: "thumbnail", url: product.thumbnail }] : []).map(
      (img) => ({ id: img.id, url: img.url, alt: ("metadata" in img ? (img.metadata?.alt as string | undefined) : undefined) ?? undefined })
    )
    return [...(stage ? [{ kind: "night" } as const] : []), ...photos.map((image) => ({ kind: "photo", image }) as const)]
  }, [product, stage])

  const [index, setIndex] = useState(0)
  const go = useCallback((step: number) => setIndex((i) => Math.min(slides.length - 1, Math.max(0, i + step))), [slides.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "ArrowLeft") go(-1)
      else if (e.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go])

  // a sideways swipe on phones turns the picture
  const startX = useRef<number | null>(null)
  const slide = slides[index]
  const many = slides.length > 1

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className="wj-stage relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-[var(--line)] small:aspect-square"
        onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (startX.current === null) return
          const dx = e.changedTouches[0].clientX - startX.current
          startX.current = null
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        }}
      >
        {slide?.kind === "night" && stage && (
          <div className="wj-night-slide absolute inset-0">
            <span aria-hidden="true" className="wj-word" translate="no">
              {stage.word}
            </span>
            <div className="wj-reflect" aria-hidden="true">
              <Image src={stage.image.src} alt="" fill sizes="(max-width: 1024px) 90vw, 640px" className="object-contain object-bottom" />
            </div>
            <div className="wj-machine">
              <Image src={stage.image.src} alt={stage.image.alt} fill priority sizes="(max-width: 1024px) 90vw, 640px" className="object-contain object-bottom" />
            </div>
          </div>
        )}
        {slide?.kind === "photo" && (
          <div className="wj-photo-slide absolute inset-0">
            <Image
              key={slide.image.id}
              src={slide.image.url}
              alt={slide.image.alt || product.title}
              fill
              priority={index === 0}
              sizes="(max-width: 1024px) 90vw, 640px"
              className="object-contain p-[7%] mix-blend-multiply"
            />
          </div>
        )}
        {many && (
          <>
            <span className="absolute bottom-[22px] left-4 z-10 rounded-full border border-[var(--line)] bg-[rgba(6,11,21,0.55)] px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[11px] font-medium tracking-[0.08em] text-[var(--text-2)] tabular-nums">
              {index + 1}/{slides.length}
            </span>
            <div className="absolute bottom-3 right-3 z-10 flex gap-2">
              {[-1, 1].map((step) => (
                <button
                  key={step}
                  type="button"
                  aria-label={step < 0 ? "Gambar sebelumnya" : "Gambar berikutnya"}
                  disabled={step < 0 ? index === 0 : index === slides.length - 1}
                  onClick={() => go(step)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line-2)] bg-[rgba(6,11,21,0.6)] text-[var(--text)] transition-[opacity,transform] duration-150 active:scale-[0.94] disabled:opacity-35"
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true" className={clx("h-4 w-4", step < 0 && "rotate-180")}>
                    <path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {many && (
        <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {slides.map((s, i) => (
            <li key={s.kind === "night" ? "night" : s.image.id} className="shrink-0">
              <button
                type="button"
                aria-label={`Gambar ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={clx(
                  "relative block h-16 w-16 overflow-hidden rounded-xl border transition-[border-color,opacity] duration-150 [container-type:inline-size]",
                  s.kind === "photo" && "wj-photo-slide",
                  i === index ? "border-[var(--text)]" : "border-[var(--line-2)] opacity-70 [@media(hover:hover)]:hover:opacity-100"
                )}
              >
                {s.kind === "night" && stage ? (
                  <>
                    {/* the night sits on a child: container units resolve against the button, not the page */}
                    <span aria-hidden="true" className="wj-night-slide absolute inset-0" />
                    <Image src={stage.image.src} alt="" fill sizes="64px" className="object-contain p-1.5" />
                  </>
                ) : s.kind === "photo" ? (
                  <Image src={s.image.url} alt="" fill sizes="64px" className="object-contain p-1 mix-blend-multiply" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ImageGallery
