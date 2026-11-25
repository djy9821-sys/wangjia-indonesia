/*
  The browse-only copy of the shop on GitHub Pages, made by scripts/build-preview.mjs so people
  can look at the shop before it has a server. Nothing answers behind it, so what needs the
  backend (search, sign-in, quotes, a real cart) stays out, and links are plain page loads
  under the repository's path. Off unless the build sets NEXT_PUBLIC_WJ_PREVIEW=1.
*/
export const IS_PREVIEW = process.env.NEXT_PUBLIC_WJ_PREVIEW === "1"

export const BASE_PATH = IS_PREVIEW ? process.env.NEXT_PUBLIC_BASE_PATH ?? "" : ""

/** A file from /public, under the copy's path in the preview. */
export const asset = (path: string) => `${BASE_PATH}${path}`
