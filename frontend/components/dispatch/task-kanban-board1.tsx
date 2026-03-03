"use client"

import { useState } from "react"
import {
  Plus,
  MapPin,
  Camera,
  Navigation,
  GripVertical,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type Priority = "high" | "medium" | "low"
type TaskStatus = "todo" | "in_progress" | "verified"

interface Task {
  id: string
  title: string
  ward: string
  assignee: string
  priority: Priority
  status: TaskStatus
  hasGpsProof: boolean
  hasCameraProof: boolean
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  high: { label: "High", className: "bg-sentiment-negative/10 text-sentiment-negative border-sentiment-negative/20" },
  medium: { label: "Medium", className: "bg-accent-amber/10 text-accent-amber border-accent-amber/20" },
  low: { label: "Low", className: "bg-muted text-muted-foreground border-border" },
}

const statusConfig: Record<TaskStatus, { label: string; key: TaskStatus }> = {
  todo: { label: "To Do", key: "todo" },
  in_progress: { label: "In Progress", key: "in_progress" },
  verified: { label: "Verified", key: "verified" },
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Distribute Pamphlets - Zone A",
    ward: "Model Town",
    assignee: "Rajesh Kumar",
    priority: "high",
    status: "todo",
    hasGpsProof: false,
    hasCameraProof: false,
  },
  {
    id: "2",
    title: "Door-to-door Survey - Block C",
    ward: "Paschim Vihar",
    assignee: "Sunita Devi",
    priority: "medium",
    status: "in_progress",
    hasGpsProof: false,
    hasCameraProof: false,
  },
  {
    id: "3",
    title: "Rally Setup - Main Ground",
    ward: "Model Town",
    assignee: "Amit Singh",
    priority: "high",
    status: "verified",
    hasGpsProof: true,
    hasCameraProof: true,
  },
  {
    id: "4",
    title: "Voter Awareness Camp",
    ward: "Civil Lines",
    assignee: "Priya Sharma",
    priority: "low",
    status: "todo",
    hasGpsProof: false,
    hasCameraProof: false,
  },
]

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
export function TaskKanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newWard, setNewWard] = useState("")
  const [newAssignee, setNewAssignee] = useState("")
  const [newPriority, setNewPriority] = useState<Priority>("medium")

  function handleMove(id: string, newStatus: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        return {
          ...t,
          status: newStatus,
          hasGpsProof: newStatus === "verified" ? true : t.hasGpsProof,
          hasCameraProof: newStatus === "verified" ? true : t.hasCameraProof,
        }
      })
    )
  }

  function handleCreate() {
    if (!newTitle.trim()) return
    const task: Task = {
      id: String(Date.now()),
      title: newTitle.trim(),
      ward: newWard || "Unassigned",
      assignee: newAssignee || "Unassigned",
      priority: newPriority,
      status: "todo",
      hasGpsProof: false,
      hasCameraProof: false,
    }
    setTasks((prev) => [...prev, task])
    setNewTitle("")
    setNewWard("")
    setNewAssignee("")
    setNewPriority("medium")
    setCreateOpen(false)
  }

  const columns = Object.values(statusConfig)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Task Board</h2>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-3.5" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key)
          return (
            <div key={col.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-xs font-semibold text-foreground">
                  {col.label}
                </span>
                <Badge
                  variant="secondary"
                  className="font-mono text-[10px]"
                >
                  {colTasks.length}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                {colTasks.length === 0 && (
                  <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8">
                    <p className="text-[11px] text-muted-foreground/50">
                      No tasks
                    </p>
                  </div>
                )}
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onMove={handleMove} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Create New Task</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Task Title</Label>
              <Input
                placeholder="e.g. Distribute Pamphlets"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
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
                  Assignee
                </Label>
                <Input
                  placeholder="Worker name"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select
                value={newPriority}
                onValueChange={(v) => setNewPriority(v as Priority)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
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
              disabled={!newTitle.trim()}
              className="text-xs"
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
