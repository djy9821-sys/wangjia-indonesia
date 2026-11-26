import { clx, Button as MedusaButton } from "@medusajs/ui"
type ButtonProps = React.ComponentProps<typeof MedusaButton>

const Button = ({
  children,
  className: classNameProp,
  ...props
}: ButtonProps): React.ReactNode => {
  const variant = props.variant ?? "primary"

  const className = clx(classNameProp, {
    "!shadow-borders-base !border-none":
      variant === "secondary" || props.disabled,
    // the shop's one accent, as on the product pages (the starter's was an orange with white text)
    "!shadow-none bg-[#ffb547] hover:bg-[#ffcb80] !text-[#1a1205] font-medium":
      variant === "primary" && !props.disabled,
    "!shadow-none bg-transparent text-neutral-900": variant === "transparent",
  })
  return (
    <MedusaButton
      className={`!rounded-full text-sm font-normal ${className}`}
      variant={variant}
      {...props}
    >
      {children}
    </MedusaButton>
  )
}

export default Button
