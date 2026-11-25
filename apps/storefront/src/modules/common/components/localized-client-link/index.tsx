"use client"

import { BASE_PATH, IS_PREVIEW } from "@/lib/util/preview"
import Link from "next/link"
import { useParams } from "next/navigation"
import React from "react"

/**
 * Use this component to create a Next.js `<Link />` that persists the current country code in the url,
 * without having to explicitly pass it as a prop.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: any
}) => {
  const { countryCode } = useParams()

  if (IS_PREVIEW) {
    // the browse-only copy has no server for client-side navigation: plain page loads
    const { prefetch, passHref, replace, scroll, shallow, ...rest } = props
    return (
      <a href={`${BASE_PATH}/${countryCode}${href}`} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <Link href={`/${countryCode}${href}`} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
