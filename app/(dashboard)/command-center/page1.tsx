import { Map, Users, Activity } from "lucide-react"
import { PageHeading } from "@/components/shared/page-heading"
import { StatCard } from "@/components/shared/stat-card"

export default function CommandCenterPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Command Center"
        subtitle="Geographic overview of the constituency, color-coded by AI sentiment and demographic density."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Voters"
          value={5031}
          icon={Users}
          trend="+124 this week"
          trendUp
        />
        <StatCard
          label="Active Workers"
          value={48}
          icon={Activity}
          trend="12 in field"
          trendUp
        />
        <StatCard
          label="Constituency Sentiment"
          value="Positive"
          icon={Map}
          trend="72% favorable"
          trendUp
        />
      </div>

      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-card p-20">
        <div className="flex flex-col items-center gap-2 text-center">
          <Map className="size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            Interactive Map
          </p>
          <p className="max-w-xs text-xs text-muted-foreground/60">
            Leaflet map with ward polygons will render here, color-coded by
            sentiment data from the API.
          </p>
        </div>
      </div>
    </div>
  )
}
