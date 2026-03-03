"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Plus,
  Camera,
  Navigation,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  API_BASE_URL,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type TaskListResponse,
} from "@/lib/api"

/* ------------------------------------------------------------------ */
/*  Config                                                            */
/* ------------------------------------------------------------------ */

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  high: {
    label: "High",
    className:
      "bg-sentiment-negative/10 text-sentiment-negative border-sentiment-negative/20",
  },
  medium: {
    label: "Medium",
    className: "bg-accent-amber/10 text-accent-amber border-accent-amber/20",
  },
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground border-border",
  },
}

const columns: { key: TaskStatus; label: string; accent: string }[] = [
  { key: "todo", label: "To Do", accent: "bg-primary/60" },
  {
    key: "pending_verification",
    label: "Pending Verification",
    accent: "bg-accent-amber/60",
  },
  { key: "verified", label: "Verified", accent: "bg-sentiment-positive/60" },
]

/* ------------------------------------------------------------------ */
/*  SWR Fetcher                                                       */
/* ------------------------------------------------------------------ */

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<TaskListResponse>
  })

/* ------------------------------------------------------------------ */
/*  Task Card                                                         */
/* ------------------------------------------------------------------ */

function TaskCard({
  task,
  onVerify,
  isVerifying,
}: {
  task: Task
  onVerify: (id: number | string) => void
  isVerifying: boolean
}) {
  const pConfig = priorityConfig[task.priority]

  return (
    <div className="group flex flex-col rounded-lg border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/30">
      {/* Title row */}
      <p className="mb-2 text-xs font-medium leading-snug text-foreground">
        {task.title}
      </p>

      {/* Badges */}
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn("text-[10px] font-medium", pConfig.className)}
        >
          {pConfig.label}
        </Badge>
        <Badge variant="outline" className="text-[10px] font-normal">
          {task.ward}
        </Badge>
      </div>

      {/* --- NEW: Image & GPS Proof Display --- */}
      {task.proof_image && (
        <div className="mb-3 overflow-hidden rounded-md border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={task.proof_image}
            alt="Proof"
            className="h-28 w-full object-cover"
          />
          {task.lat && task.lng && (
            <div className="flex items-center gap-1 bg-muted/30 px-2 py-1.5 text-[10px] text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">
                {task.lat.toFixed(5)}, {task.lng.toFixed(5)}
              </span>
            </div>
          )}
        </div>
      )}
      {/* ------------------------------------- */}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted-foreground">
          {task.assignee}
        </span>

        {/* Status-specific actions */}
        {task.status === "pending_verification" && (
          <Button
            variant="default"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px] font-semibold"
            onClick={() => onVerify(task.id)}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3" />
            )}
            Approve
          </Button>
        )}
        {task.status === "verified" && (
          <div className="flex items-center gap-1.5">
            <Navigation className="size-3 text-sentiment-positive" />
            <Camera className="size-3 text-sentiment-positive" />
            <span className="text-[10px] font-medium text-sentiment-positive">
              Verified
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Board                                                        */
/* ------------------------------------------------------------------ */ 

export function TaskKanbanBoard() {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<TaskListResponse>(`${API_BASE_URL}/api/tasks`, fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newWard, setNewWard] = useState("")
  const [newAssignee, setNewAssignee] = useState("")
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium")
  const [isCreating, setIsCreating] = useState(false)
  const [verifyingId, setVerifyingId] = useState<number | string | null>(null)

  const tasks = data?.tasks ?? []

  /* ---- Create Task ---- */
  async function handleCreate() {
    if (!newTitle.trim()) return
    setIsCreating(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          ward: newWard.trim() || "Unassigned",
          assignee: newAssignee.trim() || "Unassigned",
          priority: newPriority,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await mutate()
      setNewTitle("")
      setNewWard("")
      setNewAssignee("")
      setNewPriority("medium")
      setCreateOpen(false)
    } catch (err) {
      console.error("Failed to create task:", err)
    } finally {
      setIsCreating(false)
    }
  }

  /* ---- Verify Task ---- */
  async function handleVerify(id: number | string) {
    setVerifyingId(id)
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}/verify`, {
        method: "PATCH",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await mutate()
    } catch (err) {
      console.error("Failed to verify task:", err)
    } finally {
      setVerifyingId(null)
    }
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-sentiment-negative/30 bg-sentiment-negative/5 py-12">
        <AlertCircle className="size-6 text-sentiment-negative" />
        <p className="text-sm font-medium text-foreground">
          Failed to load tasks
        </p>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          Ensure the backend is running at{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {API_BASE_URL}
          </code>
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-1 gap-1.5 text-xs"
          onClick={() => mutate()}
        >
          <RefreshCw className="size-3" />
          Retry
        </Button>
      </div>
    )
  }

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-9 animate-pulse rounded-lg bg-muted/40" />
              <div className="h-24 animate-pulse rounded-lg bg-muted/20" />
              <div className="h-24 animate-pulse rounded-lg bg-muted/20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ---- Main render ---- */
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">Task Board</h2>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {tasks.length} total
          </Badge>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-3.5" />
          New Task
        </Button>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key)
          return (
            <div key={col.key} className="flex flex-col gap-2">
              {/* Column header */}
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-block size-2 rounded-full",
                      col.accent
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-foreground">
                    {col.label}
                  </span>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {colTasks.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {colTasks.length === 0 ? (
                  <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8">
                    <p className="text-[11px] text-muted-foreground/50">
                      No tasks
                    </p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onVerify={handleVerify}
                      isVerifying={verifyingId === task.id}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ---- Create Task Dialog ---- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Create New Task</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Task Title
              </Label>
              <Input
                placeholder="e.g. Distribute Pamphlets - Zone A"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Ward + Assignee side-by-side */}
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Ward / Booth
                </Label>
                <Input
                  placeholder="e.g. Model Town"
                  value={newWard}
                  onChange={(e) => setNewWard(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Assignee Name
                </Label>
                <Input
                  placeholder="Worker name"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select
                value={newPriority}
                onValueChange={(v) => setNewPriority(v as TaskPriority)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="inline-block size-2 rounded-full bg-sentiment-negative" />
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="inline-block size-2 rounded-full bg-accent-amber" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="inline-block size-2 rounded-full bg-muted-foreground" />
                      Low
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newTitle.trim() || isCreating}
              className="gap-1.5 text-xs"
            >
              {isCreating && <Loader2 className="size-3 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
