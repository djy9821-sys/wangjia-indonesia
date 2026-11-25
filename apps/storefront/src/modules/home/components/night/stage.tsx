"use client"

import { useEffect, useRef } from "react"
import type { AnchorName, Phase, PondScene } from "./scene"
import { asset } from "@/lib/util/preview"

/*
  The fixed scene behind the night home page and everything that moves:
  - a poster frame of the same scene paints first (the LCP image) and stays without WebGL;
  - the three.js scene loads after first paint and fades in over it;
  - scroll drives it (GSAP ScrollTrigger; Lenis smooth wheel on desktop only);
  - clock, chart, part labels, reveals, the buy bar, tap ripples and the pause button.
  Tiers: poster only on Save-Data or 2 GB phones; a lean scene on weak phones; reduced
  motion starts paused and cuts between chapters instead of flying the camera.
*/

type NetInfo = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }

export default function NightStage({ family }: { family: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const root = canvas?.closest<HTMLElement>("[data-wj-night]")
    if (!canvas || !root) return

    let cancelled = false
    let scene: PondScene | null = null
    const cleanups: (() => void)[] = []
    const listen = (target: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions) => {
      target.addEventListener(type, fn, opts)
      cleanups.push(() => target.removeEventListener(type, fn, opts))
    }
    const one = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel)
    const all = <T extends Element = HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel))

    const nav = navigator as NetInfo
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const fine = window.matchMedia("(pointer: fine)").matches
    const memory = nav.deviceMemory ?? 8
    const posterOnly = !!nav.connection?.saveData || memory <= 2
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4 || Math.min(window.innerWidth, window.innerHeight) < 520
    root.dataset.motion = reduce ? "reduced" : "on"

    // the site header stays on top; the scene and the sticky chapters start under it
    const header = document.querySelector<HTMLElement>("[data-site-header]")
    const setHeader = () => root.style.setProperty("--hdr", `${Math.round(header?.getBoundingClientRect().height ?? 0)}px`)
    setHeader()
    if (header) {
      const ro = new ResizeObserver(setHeader)
      ro.observe(header)
      cleanups.push(() => ro.disconnect())
    }

    // reveals: headings by line mask, copy by opacity, card rows as one unit
    all(".rv").forEach((rv) => Array.from(rv.children).forEach((ln, i) => (ln as HTMLElement).style.setProperty("--i", String(i))))
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in")
            reveal.unobserve(e.target)
          }
        }),
      { rootMargin: "0px 0px -12% 0px" }
    )
    all(".rv, .fade").forEach((el) => reveal.observe(el))
    cleanups.push(() => reveal.disconnect())

    // Jakarta time ties the page to the night shift
    const clock = one("[data-clock]")
    const tick = () => {
      if (!clock) return
      const now = new Date()
      const t = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })
      const h = Number(now.toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }))
      clock.innerHTML = `<b>${t} WIB</b> · ${h >= 18 || h < 6 ? "kincir sedang bekerja" : "nanti malam kincir bekerja"}`
    }
    tick()
    const clockTimer = window.setInterval(tick, 30000)
    cleanups.push(() => window.clearInterval(clockTimer))

    // the buy bar appears once the hero has scrolled away, and leaves before the footer
    const bar = one<HTMLElement & { inert: boolean }>("[data-buybar]")
    const hero = one(".hero")
    const onScroll = () => {
      if (!bar || !hero) return
      const past = hero.getBoundingClientRect().bottom < 0
      const atEnd = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 320
      const show = past && !atEnd
      bar.classList.toggle("show", show)
      bar.inert = !show
    }
    listen(window, "scroll", onScroll, { passive: true })
    onScroll()

    // anatomy labels follow the exploded parts (projected every frame while the chapter is on screen)
    const callouts = all(".callout")
    const dots = all(".dot")
    const lines = all<SVGPolylineElement>("[data-leaders] polyline")
    const pins = all<SVGCircleElement>("[data-leaders] circle")
    let anatomyOn = false
    let shown = 0
    const placeLabels = () => {
      if (!anatomyOn || !scene) return
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      if (W < 768) {
        dots.forEach((d, i) => {
          const p = scene!.project(d.dataset.anchor as AnchorName)
          d.style.transform = `translate(${p.x}px, ${p.y}px)`
          d.classList.toggle("on", i < shown)
        })
        return
      }
      const colX = W - 270 - (W >= 1024 ? 40 : 32)
      const pts = callouts.map((c) => ({ c, p: scene!.project(c.dataset.anchor as AnchorName), h: c.offsetHeight, y: 0 }))
      const order = [...pts].sort((a, b) => a.p.y - b.p.y)
      const top = 64
      const gap = 22
      let y = top
      order.forEach((o) => {
        o.y = Math.max(o.p.y - 18, y)
        y = o.y + o.h + gap
      })
      if (y - gap > H - 40) {
        let yy = H - 40
        ;[...order].reverse().forEach((o) => {
          o.y = Math.min(o.y, yy - o.h)
          yy = o.y - gap
        })
      }
      pts.forEach((o, i) => {
        const on = i < shown
        o.c.style.transform = `translate(${colX}px, ${o.y}px)`
        o.c.classList.toggle("on", on)
        lines[i]?.setAttribute("points", `${o.p.x},${o.p.y} ${colX - 40},${o.y + 14} ${colX},${o.y + 14}`)
        lines[i]?.classList.toggle("on", on)
        pins[i]?.setAttribute("cx", String(o.p.x))
        pins[i]?.setAttribute("cy", String(o.p.y))
        pins[i]?.classList.toggle("on", on)
      })
    }
    const hideLabels = () => [...callouts, ...dots, ...lines, ...pins].forEach((el) => el.classList.remove("on"))

    const setup = async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lenis")])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      // smooth wheel scrolling on desktop only; touch keeps native scrolling
      if (!reduce && fine) {
        const lenis = new Lenis({ lerp: 0.1 })
        lenis.on("scroll", ScrollTrigger.update)
        const raf = (t: number) => lenis.raf(t * 1000)
        gsap.ticker.add(raf)
        gsap.ticker.lagSmoothing(0)
        const onAnchor = (e: Event) => {
          const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
          const id = a?.getAttribute("href")
          if (!a || !id || id.length < 2 || !root.querySelector(id)) return
          e.preventDefault()
          lenis.scrollTo(id, { offset: -(header?.offsetHeight ?? 0), duration: 1.4 })
        }
        listen(root, "click", onAnchor)
        cleanups.push(() => {
          gsap.ticker.remove(raf)
          lenis.destroy()
        })
      }

      // the scene: poster first; skip WebGL on the lowest tier
      if (!posterOnly) {
        try {
          const { createPondScene } = await import("./scene")
          if (cancelled) return
          // the canvas shows only once it has drawn a frame, so the poster never fades to black
          let drawn = false
          const onFrame = () => {
            if (!drawn) {
              drawn = true
              root.dataset.live = ""
            }
            placeLabels()
          }
          const created = await createPondScene(canvas, { lowPower, still: reduce, parallax: fine && !reduce, family, onFrame })
          if (cancelled) {
            created.dispose()
            return
          }
          scene = created
        } catch {
          root.dataset.nogl = ""
        }
      }

      const s = scene
      if (s) {
        const fit = () => s.resize(Math.max(1, canvas.clientWidth), Math.max(1, canvas.clientHeight))
        fit()
        const ro = new ResizeObserver(fit)
        ro.observe(canvas)
        cleanups.push(() => ro.disconnect())

        // the poster already shows the hero frame, so the live scene starts on that same frame (no opening move)
        s.set("p0", 1)

        // render only while a scene chapter is on screen
        const seen = new Set<Element>()
        const vis = new IntersectionObserver((entries) => {
          entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)))
          s.setVisible(seen.size > 0)
        })
        all("[data-scene]").forEach((el) => vis.observe(el))
        cleanups.push(() => vis.disconnect())

        // something to touch: a tap on empty water starts a ring there
        const onTap = (e: Event) => {
          const pe = e as PointerEvent
          if (pe.button > 0 || (pe.target as Element).closest("a, button, input, label, summary, form, .chartmini, .callout")) return
          const r = canvas.getBoundingClientRect()
          s.ripple(pe.clientX - r.left, pe.clientY - r.top)
        }
        all("[data-scene]").forEach((el) => listen(el, "pointerdown", onTap))

        // pause the ambient motion (WCAG 2.2.2); reduced motion starts paused
        const pause = one<HTMLButtonElement>("[data-pause]")
        if (pause) {
          const show = () => {
            pause.dataset.playing = String(s.playing)
            pause.setAttribute("aria-pressed", String(!s.playing))
            const label = pause.querySelector("span")
            if (label) label.textContent = s.playing ? "Jeda" : "Putar"
          }
          pause.hidden = false
          show()
          listen(pause, "click", () => {
            s.play(!s.playing)
            show()
          })
        }
      }

      // scroll drives the night: p1 hero to pond, p2 the hours, p3 anatomy, p4 dawn
      const triggers: { kill: () => void }[] = []
      const bind = (trigger: string, key: Phase, start: string, end: string, cb?: (p: number) => void) => {
        const el = one(trigger)
        if (!el) return
        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            start,
            end,
            onUpdate: (st) => {
              s?.set(key, reduce ? Math.round(st.progress) : st.progress)
              cb?.(st.progress)
            },
            onRefresh: (st) => s?.set(key, reduce ? Math.round(st.progress) : st.progress),
          })
        )
      }
      const nclock = one("[data-nclock]")
      const steps = all(".steps p")
      const curve = one<SVGPathElement>("[data-curve]")
      const nowDot = one<SVGCircleElement>("[data-now]")
      const low = one("[data-low]")
      const total = curve?.getTotalLength() ?? 0
      bind("#malam", "p1", "top bottom", "top top")
      bind("#malam", "p2", "top top", "bottom bottom", (p) => {
        const mins = 18 * 60 + Math.round((p * 12 * 60) / 10) * 10
        if (nclock) nclock.textContent = `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}.${String(mins % 60).padStart(2, "0")}`
        const k = p < 0.34 ? 0 : p < 0.68 ? 1 : 2
        steps.forEach((el, i) => el.classList.toggle("on", i === k))
        if (curve) curve.style.strokeDashoffset = String(1 - Math.min(1, p))
        if (curve && nowDot) {
          const pt = curve.getPointAtLength(total * Math.min(1, p))
          nowDot.setAttribute("cx", String(pt.x))
          nowDot.setAttribute("cy", String(pt.y))
        }
        low?.classList.toggle("on", p > 0.86)
      })
      bind("#anatomi", "p3", "top bottom", "bottom bottom", (p) => {
        shown = p < 0.55 ? 0 : Math.min(5, Math.floor((p - 0.55) / 0.06) + 1)
      })
      const anatomy = one("#anatomi")
      if (anatomy)
        triggers.push(
          ScrollTrigger.create({
            trigger: anatomy,
            start: "top 60%",
            end: "bottom top",
            onToggle: (st) => {
              anatomyOn = st.isActive
              if (!anatomyOn) hideLabels()
            },
          })
        )
      bind("#tanya", "p4", "top bottom", "top 20%")
      cleanups.push(() => triggers.forEach((t) => t.kill()))
      ScrollTrigger.refresh()
      // the display face changes heading heights when it arrives; measure again
      document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh())
    }
    setup()

    return () => {
      cancelled = true
      cleanups.forEach((f) => f())
      scene?.dispose()
      scene = null
      delete root.dataset.live
    }
  }, [family])

  return (
    <>
      {/* A poster frame of the same scene: the first paint, and the picture when WebGL is missing. */}
      <picture className="poster">
        <source media="(max-aspect-ratio: 7/10)" srcSet={asset("/home/night-poster-p.webp")} />
        <source media="(max-aspect-ratio: 13/10)" srcSet={asset("/home/night-poster-s.webp")} />
        <img src={asset("/home/night-poster-l.webp")} alt="" fetchPriority="high" decoding="async" />
      </picture>
      <canvas ref={canvasRef} className="scene" aria-hidden="true" />
      <div className="veil" aria-hidden="true" />
    </>
  )
}
