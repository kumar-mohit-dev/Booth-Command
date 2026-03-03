interface PageHeadingProps {
  title: string
  subtitle?: string
}

export function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <h1 className="text-xl font-semibold tracking-tight text-balance text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground text-pretty">{subtitle}</p>
      )}
    </div>
  )
}
