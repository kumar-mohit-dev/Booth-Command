"use client"

import { useEffect, useState } from "react"
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { API_BASE_URL, type Task, type TaskStatus } from "@/lib/api"
import { Loader2, AlertCircle } from "lucide-react"

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "#3b82f6",
  pending_verification: "#f59e0b",
  verified: "#10b981",
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  pending_verification: "Pending",
  verified: "Verified",
}

const WARD_COORDINATES: Record<string, [number, number]> = {
  "Model Town": [28.7159, 77.1909],
  "Saraswati Vihar": [28.6964, 77.1232],
  "Paschim Vihar": [28.6698, 77.0934],
  "Karol Bagh": [28.6514, 77.1907],
  "Rajouri Garden": [28.6492, 77.1226],
  "Dwarka": [28.5921, 77.0460],
  "Rohini": [28.7495, 77.0565],
  "Pitampura": [28.6986, 77.1316],
  "Janakpuri": [28.6219, 77.0815],
  "Lajpat Nagar": [28.5677, 77.2433],
  "Chandni Chowk": [28.6506, 77.2300],
  "Shahdara": [28.6725, 77.2942],
  "Mayur Vihar": [28.5930, 77.2990],
  "Vasant Kunj": [28.5206, 77.1570],
  "Saket": [28.5236, 77.2086],
  "Connaught Place": [28.6315, 77.2167],
  "Greater Kailash": [28.5490, 77.2436],
  "Nehru Place": [28.5491, 77.2529],
  "Tilak Nagar": [28.6404, 77.0952],
  "Punjabi Bagh": [28.6696, 77.1300],
  "Hauz Khas": [28.5494, 77.2001],
  "Malviya Nagar": [28.5321, 77.2106],
  "Defence Colony": [28.5741, 77.2322],
  "South Extension": [28.5788, 77.2239],
  "Kirti Nagar": [28.6537, 77.1427],
  "Patel Nagar": [28.6490, 77.1681],
  "Narela": [28.8526, 77.0930],
  "Burari": [28.7577, 77.2014],
  "Tri Nagar": [28.6849, 77.1575],
  "Wazirpur": [28.6953, 77.1693],
}

const NEW_DELHI_CENTER: [number, number] = [28.6139, 77.2090]
const DEFAULT_ZOOM = 11
const REFETCH_INTERVAL = 20_000

function getWardCoords(ward: string): [number, number] {
  if (WARD_COORDINATES[ward]) return WARD_COORDINATES[ward]

  const lower = ward.toLowerCase()
  for (const [key, coords] of Object.entries(WARD_COORDINATES)) {
    if (key.toLowerCase() === lower) return coords
  }

  return NEW_DELHI_CENTER
}

export default function DispatchMap() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchTasks() {
      try {
        if (!tasks.length) setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE_URL}/api/tasks`)
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        const json = await res.json()
        if (!cancelled) setTasks(json.tasks ?? [])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load tasks")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTasks()
    const interval = setInterval(fetchTasks, REFETCH_INTERVAL)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const statusCounts = tasks.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Loading task locations...
            </span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && !loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-5 text-destructive" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Failed to load tasks
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      <MapContainer
        center={NEW_DELHI_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        style={{ background: "#0f172a" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {tasks.map((task) => {
          // Use real phone GPS if available, otherwise fallback to the ward center
          const coords: [number, number] = task.lat && task.lng 
            ? [task.lat, task.lng] 
            : getWardCoords(task.ward);
            
          const color = STATUS_COLORS[task.status] ?? "#3b82f6"

          return (
            <CircleMarker
              key={task.id}
              center={coords}
              radius={task.status === "verified" ? 9 : 7}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.4,
                weight: 2,
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -8]}
                className="leaflet-tooltip-custom"
              >
                <div className="flex flex-col gap-0.5 font-sans">
                  <span className="text-xs font-semibold">{task.title}</span>
                  <span className="text-[10px] text-gray-500">
                    {task.assignee} &middot; {task.ward}
                  </span>
                </div>
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1.5 rounded-lg border border-border bg-card/90 p-2.5 shadow-md backdrop-blur-sm">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Task Status
        </span>
        {(
          [
            ["todo", STATUS_COLORS.todo, STATUS_LABELS.todo],
            ["pending_verification", STATUS_COLORS.pending_verification, STATUS_LABELS.pending_verification],
            ["verified", STATUS_COLORS.verified, STATUS_LABELS.verified],
          ] as const
        ).map(([status, clr, label]) => (
          <div key={status} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: clr }}
              />
              <span className="text-xs text-foreground">{label}</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {statusCounts[status] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
