"use client"

import { ArrowLeftMini, ArrowRightMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx, IconButton } from "@medusajs/ui"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"

type ImageGalleryProps = {
  product: HttpTypes.StoreProduct
}

const ImageGallery = ({ product }: ImageGalleryProps) => {
  const thumbnail = product?.thumbnail
  const images = useMemo(() => product?.images || [], [product])

  const [selectedImage, setSelectedImage] = useState(
    images[0] || {
      url: thumbnail,
      id: "thumbnail",
    }
  )
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const handleArrowClick = useCallback(
    (direction: "left" | "right") => {
      if (
        images.length === 0 ||
        (selectedImageIndex === 0 && direction === "left") ||
        (selectedImageIndex === images.length - 1 && direction === "right")
      ) {
        return
      }

      if (direction === "left") {
        setSelectedImageIndex((prev) => prev - 1)
        setSelectedImage(images[selectedImageIndex - 1])
      } else {
        setSelectedImageIndex((prev) => prev + 1)
        setSelectedImage(images[selectedImageIndex + 1])
      }
    },
    [images, selectedImageIndex]
  )

  const handleImageClick = useCallback(
    (image: HttpTypes.StoreProductImage) => {
      setSelectedImage(image)
      setSelectedImageIndex(images.findIndex((img) => img.id === image.id))
    },
    [images]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement) {
        return
      }

      if (e.key === "ArrowLeft") {
        handleArrowClick("left")
      } else if (e.key === "ArrowRight") {
        handleArrowClick("right")
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleArrowClick])

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Catalogue photos are white 1:1 squares, so the stage is a white
          square card and the photo fills it with a small margin. */}
      <div
        className="relative aspect-[4/3] small:aspect-square w-full max-w-[720px] overflow-hidden rounded-3xl border border-[#e3dfd6] bg-white"
        id={selectedImage.id}
      >
        {images.length > 1 && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-2.5 py-1 font-[family-name:var(--font-geist-mono)] text-[11px] font-medium tracking-[0.08em] text-[#4a4f57] tabular-nums">
            {selectedImageIndex + 1}/{images.length}
          </span>
        )}
        {!!selectedImage.url && (
          <Image
            src={selectedImage.url}
            priority
            className="object-contain p-4"
            alt={(selectedImage.metadata?.alt as string) || product.title}
            fill
            sizes="(max-width: 576px) 90vw, (max-width: 992px) 50vw, 640px"
          />
        )}
      </div>
      <div className="flex w-full max-w-[720px] small:flex-row flex-col-reverse gap-y-3 justify-between">
        {images.length > 1 && (
          <div className="hidden small:flex flex-row gap-x-2 self-end small:self-auto">
            <IconButton
              aria-label="Gambar sebelumnya"
              disabled={selectedImageIndex === 0}
              className="rounded-full items-center justify-center"
              onClick={() => handleArrowClick("left")}
            >
              <ArrowLeftMini />
            </IconButton>
            <IconButton
              aria-label="Gambar berikutnya"
              disabled={selectedImageIndex === images.length - 1}
              className="rounded-full items-center justify-center"
              onClick={() => handleArrowClick("right")}
            >
              <ArrowRightMini />
            </IconButton>
          </div>
        )}
        <ul className="flex flex-row gap-x-4 overflow-x-auto">
          {images.map((image, index) => (
            <li
              key={image.id}
              className={clx(
                "flex aspect-[1/1] w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-white border border-[#e3dfd6] cursor-pointer",
                index === selectedImageIndex && "border-[#121417] shadow-[0_0_0_1px_#121417]"
              )}
              onClick={() => handleImageClick(image)}
              role="button"
              aria-label={`Show image ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={(image.metadata?.alt as string) || ""}
                height={56}
                width={56}
                className={clx(
                  index === selectedImageIndex ? "opacity-100" : "opacity-60",
                  "hover:opacity-100 object-contain p-1"
                )}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ImageGallery
