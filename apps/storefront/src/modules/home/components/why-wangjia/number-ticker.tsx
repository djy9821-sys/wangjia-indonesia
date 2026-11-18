"use client"

import { useEffect, useRef, useState } from "react"

/** Counts up to `value` the first time it scrolls into view. The page is drawn
 * with the final number, so it reads right without JavaScript and for visitors
 * who prefer less motion. */
const NumberTicker = ({ value, duration = 1200 }: { value: number; duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }
    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          setShown(Math.round(value * (1 - Math.pow(1 - t, 3))))
          if (t < 1) {
            frame = requestAnimationFrame(tick)
          }
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.6 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {shown}
    </span>
  )
}

export default NumberTicker
