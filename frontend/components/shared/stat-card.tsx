import { type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("border border-border shadow-sm", className)}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="font-mono text-xl font-bold tracking-tight text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {trend && (
            <span
              className={cn(
                "text-[11px] font-medium",
                trendUp ? "text-sentiment-positive" : "text-sentiment-negative"
              )}
            >
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
