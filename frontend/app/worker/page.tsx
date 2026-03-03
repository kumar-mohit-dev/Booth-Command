"use client"

import { useState, useRef, useCallback } from "react"
import useSWR from "swr"
import {
  Camera,
  CheckCircle2,
  Loader2,
  MapPin,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Send,
  X,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  API_BASE_URL,
  type Task,
  type TaskPriority,
  type TaskListResponse,
} from "@/lib/api"

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getGeolocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    )
  })
}

/* ------------------------------------------------------------------ */
/*  Config                                                            */
/* ------------------------------------------------------------------ */

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  high: {
    label: "High",
    className:
      "bg-sentiment-negative/15 text-sentiment-negative border-sentiment-negative/30",
  },
  medium: {
    label: "Medium",
    className: "bg-accent-amber/15 text-accent-amber border-accent-amber/30",
  },
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground border-border",
  },
}

/* ------------------------------------------------------------------ */
/*  SWR Fetcher                                                       */
/* ------------------------------------------------------------------ */

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<TaskListResponse>
  })

/* ------------------------------------------------------------------ */
/*  Submission Modal                                                  */
/* ------------------------------------------------------------------ */

function SubmissionModal({
  task,
  onClose,
  onSuccess,
}: {
  task: Task
  onClose: () => void
  onSuccess: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageB64, setImageB64] = useState<string | null>(null)
  const [location, setLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handlePhotoCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const b64 = await fileToBase64(file)
      setImageB64(b64)
      setImagePreview(URL.createObjectURL(file))

      // Auto-fetch GPS once photo is taken
      setLocLoading(true)
      setLocError(null)
      try {
        const coords = await getGeolocation()
        setLocation(coords)
      } catch {
        setLocError("Could not get GPS. Please allow location access.")
      } finally {
        setLocLoading(false)
      }
    },
    []
  )

  const handleSubmit = useCallback(async () => {
    if (!imageB64 || !location) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/tasks/${task.id}/submit`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: location.lat,
            lng: location.lng,
            proof_image_b64: imageB64,
          }),
        }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSubmitted(true)
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch {
      setSubmitError("Submission failed. Please retry.")
    } finally {
      setIsSubmitting(false)
    }
  }, [imageB64, location, task.id, onSuccess])

  /* --- Success overlay --- */
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
        <div className="flex size-20 items-center justify-center rounded-full bg-sentiment-positive/20">
          <CheckCircle2 className="size-10 text-sentiment-positive" />
        </div>
        <p className="text-lg font-semibold text-foreground">
          Proof Submitted!
        </p>
        <p className="text-sm text-muted-foreground">
          Task sent for verification.
        </p>
      </div>
    )
  }

  const pConfig = priorityConfig[task.priority]
  const canSubmit = !!imageB64 && !!location && !isSubmitting

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={onClose}
        >
          <ArrowLeft className="size-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-semibold text-foreground">
            {task.title}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{task.ward}</span>
            <Badge
              variant="outline"
              className={cn("text-[10px] font-medium", pConfig.className)}
            >
              {pConfig.label}
            </Badge>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
        {/* Step 1 - Capture Photo */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <p className="text-sm font-semibold text-foreground">
              Capture Photo Proof
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoCapture}
          />

          {!imagePreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-44 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 transition-colors active:bg-primary/10"
            >
              <Camera className="size-10 text-primary" />
              <span className="text-sm font-medium text-primary">
                Take Photo
              </span>
            </button>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Captured proof"
                className="h-48 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null)
                  setImageB64(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm"
              >
                <X className="size-4" />
                <span className="sr-only">Remove photo</span>
              </button>
            </div>
          )}
        </section>

        {/* Step 2 - GPS Location */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <p className="text-sm font-semibold text-foreground">
              GPS Location
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            {locLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-xs">Fetching GPS coordinates...</span>
              </div>
            ) : location ? (
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-sentiment-positive" />
                <span className="font-mono text-xs text-foreground">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
                <CheckCircle2 className="ml-auto size-4 text-sentiment-positive" />
              </div>
            ) : locError ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sentiment-negative">
                  <AlertCircle className="size-4" />
                  <span className="text-xs">{locError}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit gap-1.5 text-xs"
                  onClick={async () => {
                    setLocLoading(true)
                    setLocError(null)
                    try {
                      const coords = await getGeolocation()
                      setLocation(coords)
                    } catch {
                      setLocError("Still unable to get GPS location.")
                    } finally {
                      setLocLoading(false)
                    }
                  }}
                >
                  <RefreshCw className="size-3" />
                  Retry GPS
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                GPS will be captured after taking a photo.
              </p>
            )}
          </div>
        </section>

        {/* Submit Error */}
        {submitError && (
          <div className="flex items-center gap-2 rounded-lg border border-sentiment-negative/30 bg-sentiment-negative/10 px-3 py-2">
            <AlertCircle className="size-4 text-sentiment-negative" />
            <span className="text-xs text-sentiment-negative">
              {submitError}
            </span>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-border bg-card p-4">
        <Button
          className="h-12 w-full gap-2 text-sm font-semibold"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5" />
          )}
          Submit Proof
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Task Card (mobile)                                                */
/* ------------------------------------------------------------------ */

function MobileTaskCard({
  task,
  onSelect,
}: {
  task: Task
  onSelect: (task: Task) => void
}) {
  const pConfig = priorityConfig[task.priority]

  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors active:bg-accent"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <ClipboardList className="size-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold leading-tight text-foreground">
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{task.ward}</span>
          <span className="text-xs text-muted-foreground/50">{"/"}</span>
          <span className="text-xs text-muted-foreground">
            {task.assignee}
          </span>
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn("shrink-0 text-[10px] font-medium", pConfig.className)}
      >
        {pConfig.label}
      </Badge>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function WorkerPage() {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<TaskListResponse>(`${API_BASE_URL}/api/tasks`, fetcher, {
    refreshInterval: 20_000,
    revalidateOnFocus: true,
  })

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const todoTasks = (data?.tasks ?? []).filter((t) => t.status === "todo")

  /* ---- Selected task -> open submission modal ---- */
  if (selectedTask) {
    return (
      <SubmissionModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSuccess={() => {
          setSelectedTask(null)
          mutate()
        }}
      />
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-foreground">
              Field Worker App
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Tap a task to submit proof
            </p>
          </div>
          <Badge
            variant="secondary"
            className="font-mono text-[10px] tabular-nums"
          >
            {todoTasks.length} pending
          </Badge>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col gap-3 p-4">
        {/* Error */}
        {error && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-sentiment-negative/30 bg-sentiment-negative/5 py-10">
            <AlertCircle className="size-6 text-sentiment-negative" />
            <p className="text-sm font-medium text-foreground">
              Cannot reach server
            </p>
            <p className="max-w-xs text-center text-xs text-muted-foreground">
              Make sure the backend is running at{" "}
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
        )}

        {/* Loading skeletons */}
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="size-10 animate-pulse rounded-lg bg-muted" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
            </div>
          ))}

        {/* Empty state */}
        {!isLoading && !error && todoTasks.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
            <div className="flex size-16 items-center justify-center rounded-full bg-sentiment-positive/10">
              <CheckCircle2 className="size-8 text-sentiment-positive" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              All caught up!
            </p>
            <p className="text-xs text-muted-foreground">
              No pending tasks assigned to you.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5 text-xs"
              onClick={() => mutate()}
            >
              <RefreshCw className="size-3" />
              Refresh
            </Button>
          </div>
        )}

        {/* Task list */}
        {!isLoading &&
          !error &&
          todoTasks.map((task) => (
            <MobileTaskCard
              key={task.id}
              task={task}
              onSelect={setSelectedTask}
            />
          ))}
      </main>
    </div>
  )
}
