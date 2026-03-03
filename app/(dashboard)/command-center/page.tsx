"use client"

import dynamic from "next/dynamic"
import { Map, Users, Activity } from "lucide-react"
import { PageHeading } from "@/components/shared/page-heading"
import { StatCard } from "@/components/shared/stat-card"

const ConstituencyMap = dynamic(
  () => import("@/components/command-center/constituency-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-card">
        <div className="flex flex-col items-center gap-2 text-center">
          <Map className="size-8 animate-pulse text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
)

export default function CommandCenterPage() {
  return (
    <div className="flex h-full flex-col gap-6">
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

      <div className="min-h-[500px] flex-1">
        <ConstituencyMap />
      </div>
    </div>
  )
}
