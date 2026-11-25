#!/usr/bin/env node
/*
  The browse-only copy of the shop for GitHub Pages, so people can look at it before the shop
  has a server (https://djy9821-sys.github.io/wangjia-indonesia/):

    cd apps/storefront
    node scripts/build-preview.mjs             # build into .preview/
    node scripts/build-preview.mjs --publish   # and push it to the gh-pages branch
    node scripts/build-preview.mjs --no-build  # save the pages again from the last build

  Needs Postgres and the backend running on this machine: the pages are rendered from them.
  It builds the shop in preview mode (src/lib/util/preview.ts) into .next-preview/, starts it
  on 127.0.0.1, saves every page reachable from the home page, copies the scripts and files,
  and makes each picture as WebP at three widths (src/lib/preview-image-loader.js). Pages,
  prices and pictures are real; search, sign-in, quotes and ordering need the real server.
*/
import { execFileSync, spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const require = createRequire(path.join(APP, "package.json"))
const sharp = require("sharp")
const NEXT_BIN = require.resolve("next/dist/bin/next")

const REPO = "djy9821-sys/wangjia-indonesia"
const BASE = "/wangjia-indonesia"
const SITE = `https://djy9821-sys.github.io${BASE}`
const COUNTRY = "id"
const PORT = 8100
const ORIGIN = `http://127.0.0.1:${PORT}`
const OUT = path.join(APP, ".preview")
const BACKEND_STATIC = path.resolve(APP, "../backend/static")
const WIDTHS = [400, 800, 1200] // as in src/lib/preview-image-loader.js
const PICTURE = /\.(png|jpe?g|webp)$/i

const env = {
  ...process.env,
  NEXT_PUBLIC_WJ_PREVIEW: "1",
  NEXT_PUBLIC_BASE_PATH: BASE,
  NEXT_PUBLIC_BASE_URL: SITE,
  NEXT_TELEMETRY_DISABLED: "1",
}

const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [NEXT_BIN, ...args], { cwd: APP, env, stdio: "inherit" })
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`next ${args[0]} exited ${code}`))))
  })

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

// 1. Build. Next rewrites next-env.d.ts and tsconfig.json for its output folder: put them back.
if (!process.argv.includes("--no-build")) {
  const kept = Object.fromEntries(
    await Promise.all(["next-env.d.ts", "tsconfig.json"].map(async (f) => [f, await readFile(path.join(APP, f), "utf8")]))
  )
  try {
    await run(["build"])
  } finally {
    for (const [f, text] of Object.entries(kept)) await writeFile(path.join(APP, f), text)
  }
}

// Addresses of this machine become the copy's, but never inside the page data Next sends along
// (self.__next_f): its text rows carry their length, and a changed length breaks the page. The
// pictures in that data go through the image loader, which knows the backend's address.
const swap = (text) =>
  text
    .replaceAll("http://localhost:9000/static/", `${SITE}/static/`)
    .replaceAll("http://localhost:8000", SITE)
    // Next puts the base path in front of its share pictures, and the site address holds it too
    .replaceAll(`${SITE}${BASE}/`, `${SITE}/`)
const fix = (html) =>
  html
    .split(/(<script>self\.__next_f\.push\([\s\S]*?\)<\/script>)/)
    .map((part, i) => (i % 2 ? part : swap(part)))
    .join("")

// 2. Serve it on loopback and save every page reachable from the home page.
// its own process group: next start runs the server in a child process that must stop too
const server = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(PORT), "-H", "127.0.0.1"], {
  cwd: APP,
  env,
  stdio: "ignore",
  detached: true,
})
const pages = new Map()
let notFound = ""
try {
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(`${ORIGIN}${BASE}/${COUNTRY}`)).ok) break
    } catch {}
    if (i > 120) throw new Error("the preview server did not start")
    await new Promise((r) => setTimeout(r, 500))
  }

  const queue = [`/${COUNTRY}`]
  const seen = new Set(queue)
  const linkRe = new RegExp(`href="${BASE}(/${COUNTRY}(?:/[^"#?]*)?)"`, "g")
  while (queue.length) {
    const page = queue.shift()
    const res = await fetch(`${ORIGIN}${BASE}${page}`, { redirect: "manual" })
    if (res.status !== 200) {
      console.log(`  skipped ${page} (${res.status})`)
      continue
    }
    const html = await res.text()
    pages.set(page, html)
    for (const [, href] of html.matchAll(linkRe)) {
      const link = href.replace(/\/$/, "")
      if (seen.has(link) || link.includes("/checkout") || link.endsWith(".md")) continue
      seen.add(link)
      queue.push(link)
    }
  }
  notFound = await (await fetch(`${ORIGIN}${BASE}/${COUNTRY}/halaman-yang-tidak-ada`)).text()

  // files the pages point at that are neither pages nor copied below (icons, share picture)
  await rm(OUT, { recursive: true, force: true })
  const extra = new Set()
  const fileRe = new RegExp(`(?:${SITE.replace(/[.]/g, "\\.")}|"${BASE})(/[^"?#\\s]+\\.[a-z0-9]+)`, "gi")
  for (const html of pages.values()) {
    for (const [, file] of fix(html).matchAll(fileRe)) {
      if (!/^\/(_next\/static|img|static)\//.test(file) && !existsSync(path.join(APP, "public", file))) extra.add(file)
    }
  }
  for (const file of extra) {
    const res = await fetch(`${ORIGIN}${BASE}${file}`)
    if (!res.ok) continue
    await mkdir(path.dirname(path.join(OUT, file)), { recursive: true })
    await writeFile(path.join(OUT, file), Buffer.from(await res.arrayBuffer()))
  }
} finally {
  process.kill(-server.pid, "SIGTERM")
}

// 3. Write the pages. A page that is also a folder (/id, /id/blog) gets an index.html as well.
for (const [page, html] of pages) {
  const text = fix(html)
  await mkdir(path.dirname(path.join(OUT, page)), { recursive: true })
  await writeFile(path.join(OUT, `${page}.html`), text)
  if ([...pages.keys()].some((p) => p.startsWith(`${page}/`))) {
    await mkdir(path.join(OUT, page), { recursive: true })
    await writeFile(path.join(OUT, page, "index.html"), text)
  }
}
await writeFile(path.join(OUT, "404.html"), fix(notFound))

// the bare address opens the shop; its share card is the home page's
const home = fix(pages.get(`/${COUNTRY}`))
const head = [...home.matchAll(/<title>[^<]*<\/title>|<meta (?:name="description"|property="og:[^"]+"|name="twitter:[^"]+")[^>]*>/g)]
  .map(([tag]) => tag)
  .join("\n")
await writeFile(
  path.join(OUT, "index.html"),
  `<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
${head}
<meta http-equiv="refresh" content="0; url=${COUNTRY}">
<script>location.replace("${COUNTRY}" + location.hash)</script>
</head><body style="background:#060b15"><a href="${COUNTRY}" style="color:#f2f4f7">WANGJIA</a></body></html>
`
)

// 4. Scripts, styles, fonts, files from public/ and the backend's photos as they are.
await cp(path.join(APP, ".next-preview/static"), path.join(OUT, "_next/static"), { recursive: true })
await cp(path.join(APP, "public"), OUT, { recursive: true })
if (existsSync(BACKEND_STATIC)) await cp(BACKEND_STATIC, path.join(OUT, "static"), { recursive: true })
await writeFile(path.join(OUT, ".nojekyll"), "") // or GitHub Pages drops _next/

// 5. Every picture as WebP at the loader's widths: img/<its path without extension>-<width>.webp
const pictures = []
for await (const f of walk(path.join(APP, "public"))) if (PICTURE.test(f)) pictures.push([f, path.relative(path.join(APP, "public"), f)])
if (existsSync(BACKEND_STATIC)) {
  for await (const f of walk(BACKEND_STATIC)) if (PICTURE.test(f)) pictures.push([f, path.join("static", path.relative(BACKEND_STATIC, f))])
}
for (const [file, rel] of pictures) {
  const stem = path.join(OUT, "img", rel.replace(/\.\w+$/, ""))
  await mkdir(path.dirname(stem), { recursive: true })
  for (const w of WIDTHS) {
    await sharp(file).resize({ width: w, withoutEnlargement: true }).webp({ quality: 75 }).toFile(`${stem}-${w}.webp`)
  }
}

console.log(`\nPreview: ${pages.size} pages, ${pictures.length} pictures in ${path.relative(process.cwd(), OUT)}/`)

// 6. Optionally publish: the folder becomes the only commit of the gh-pages branch.
if (process.argv.includes("--publish")) {
  const git = (...args) => execFileSync("git", args, { cwd: OUT, stdio: "inherit" })
  const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: APP }).toString().trim()
  // the author of the repository's last commit (this machine has no user.name in its git config)
  const who = (key) => execFileSync("git", ["log", "-1", `--format=${key}`], { cwd: APP }).toString().trim()
  git("init", "-q")
  git("checkout", "-q", "-b", "gh-pages")
  git("add", "-A")
  git("-c", `user.name=${who("%an")}`, "-c", `user.email=${who("%ae")}`, "commit", "-q", "-m", `Preview of ${sha}`)
  git("push", "-q", "-f", `https://github.com/${REPO}.git`, "gh-pages")
  console.log(`Published: ${SITE}/`)
}
