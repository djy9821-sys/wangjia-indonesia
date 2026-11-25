import LocalizedClientLink from "@/modules/common/components/localized-client-link"

const StoreBreadcrumbItem = ({
  title,
  handle,
}: {
  title: string
  handle?: string
}) => {
  return (
    <li className="text-ui-fg-muted">
      <LocalizedClientLink
        className="hover:text-ui-fg-base"
        href={handle ? `${handle}` : "/store"}
      >
        {title}
      </LocalizedClientLink>
    </li>
  )
}

const StoreBreadcrumb = () => {
  return (
    <ul className="flex items-center gap-x-3 text-sm">
      <StoreBreadcrumbItem title="Produk" key="base" />
      <span className="text-ui-fg-muted">{">"}</span>
      <StoreBreadcrumbItem title="Semua produk" handle="/store" />
    </ul>
  )
}

export default StoreBreadcrumb
