"use client"
import dynamic from "next/dynamic"
import { MapPin, ClipboardList, Loader2 } from "lucide-react"
import { PageHeading } from "@/components/shared/page-heading"
import { StatCard } from "@/components/shared/stat-card"
import { TaskKanbanBoard } from "@/components/dispatch/task-kanban-board"

const DispatchMap = dynamic(
  () => import("@/components/dispatch/dispatch-map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-lg border border-border bg-card">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">
            Loading map...
          </span>
        </div>
      </div>
    ),
  }
)

export default function DispatchPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Ground Worker Dispatch"
        subtitle="Assign physical tasks to party workers based on map data and track verification."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Tasks" value={12} icon={ClipboardList} />
        <StatCard
          label="Workers in Field"
          value={8}
          icon={MapPin}
          trend="3 verified today"
          trendUp
        />
        <StatCard
          label="Completion Rate"
          value="72%"
          icon={ClipboardList}
          trend="+5% this week"
          trendUp
        />
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Live Dispatch Map */}
        <div className="h-[420px] xl:w-[420px] xl:shrink-0">
          <DispatchMap />
        </div>

        {/* Kanban Board */}
        <div className="flex-1">
          <TaskKanbanBoard />
        </div>
      </div>
    </div>
  )
}
