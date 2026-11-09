/** Seed products with a single variant carry a placeholder option value; don't show it. */
export const isPlaceholderVariant = (title?: string | null) =>
  !title || /^(standar|standard|default|default variant)$/i.test(title.trim())

export const variantLabel = (title?: string | null) => (isPlaceholderVariant(title) ? null : title)
