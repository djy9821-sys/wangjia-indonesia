const SkeletonProductPreview = () => {
  return (
    // the shape of the product card: a square picture, then the name and the price
    <div className="animate-pulse overflow-hidden rounded-2xl bg-ui-bg-base shadow-borders-base">
      <div className="aspect-square w-full bg-ui-bg-component" />
      <div className="flex flex-col gap-2 p-3 small:p-4">
        <div className="h-3.5 w-4/5 rounded bg-ui-bg-component" />
        <div className="mt-4 h-4 w-1/2 rounded bg-ui-bg-component" />
      </div>
    </div>
  )
}

export default SkeletonProductPreview
