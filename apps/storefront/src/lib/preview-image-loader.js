// Only in the browse-only copy (next.config.js, scripts/build-preview.mjs): a static host has no
// image service, so every picture is a WebP file the build script made ahead at three widths,
// under the copy's path. The backend's photos (its /static folder) are copied along.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ""
// the backend's photos, by its own address or by the copy's (the script rewrites the first)
const STATIC = [
  `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/static/`,
  `${process.env.NEXT_PUBLIC_BASE_URL || ""}/static/`,
]
// the same widths as WIDTHS in scripts/build-preview.mjs, which makes the files
const WIDTHS = [400, 800, 1200]

export default function previewImageLoader({ src, width }) {
  const prefix = STATIC.find((p) => p !== "/static/" && src.startsWith(p))
  const path = prefix ? `/static/${src.slice(prefix.length)}` : src
  if (!path.startsWith("/")) {
    return src
  }
  if (path.endsWith(".svg")) {
    return `${BASE}${path}`
  }
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS[WIDTHS.length - 1]
  return `${BASE}/img${path.replace(/\.\w+$/, "")}-${w}.webp`
}
