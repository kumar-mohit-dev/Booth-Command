
"use client"

import { useEffect, useState } from "react"
import {
  MapContainer,
  TileLayer,
  Circle, // Changed from CircleMarker to Circle for geographic scaling
  Tooltip,
  Popup,
} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { API_BASE_URL, type MapWardData } from "@/lib/api"
import { Loader2 } from "lucide-react"

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#1f9d55",
  negative: "#ef4444",
  neutral: "#64748b",
}

const NEW_DELHI_CENTER: [number, number] = [28.6139, 77.209]
const DEFAULT_ZOOM = 11

export default function ConstituencyMap() {
  const [wardData, setWardData] = useState<MapWardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMapData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE_URL}/api/command/map-data`)
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        const json = await res.json()
        setWardData(json.map_data ?? [])
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load map data"
        )
      } finally {
        setLoading(false)
      }
    }

    fetchMapData()
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border">
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Loading map data...
            </span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-sentiment-negative/10">
              <span className="text-sm font-bold text-sentiment-negative">
                !
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">
              Failed to load map data
            </p>
            <p className="max-w-xs text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      <MapContainer
        center={NEW_DELHI_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: "#0f172a" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {wardData.map((ward) => {
          const color = SENTIMENT_COLORS[ward.sentiment_status] ?? "#64748b"
          
          // Radius in meters: Base of 1km + extra depending on population size.
          // Adjust the "1000" and "0.1" multipliers to fit the visual density of Delhi wards perfectly.
          const radiusInMeters = 1000 + (ward.total_voters * 0.1)

          return (
            <Circle // Using Circle so it scales geographically with the zoom level
              key={ward.ward}
              center={[ward.coordinates[0], ward.coordinates[1]]}
              radius={radiusInMeters}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.35,
                weight: 2,
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -8]}
                className="leaflet-tooltip-custom"
              >
                <span className="font-sans text-xs font-semibold">
                  {ward.ward}
                </span>
              </Tooltip>
              <Popup>
                {/* Added min-w-[150px] to force the popup to stay wide enough */}
                <div className="flex flex-col gap-1.5 font-sans min-w-[150px]">
                  <p className="text-sm font-bold leading-tight">{ward.ward}</p>
                  <p className="text-xs text-gray-500">{ward.zone}</p>
                  <div className="my-0.5 h-px bg-gray-200" />
                  
                  {/* Replaced grid with a flex column for better spacing */}
                  <div className="flex flex-col gap-1.5 text-xs">
                    
                    {/* flex & justify-between pushes the label left and value right */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500">Voters</span>
                      <span className="font-mono font-semibold">
                        {ward.total_voters.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500">Sentiment</span>
                      <span
                        className="font-semibold capitalize"
                        style={{ color }}
                      >
                        {ward.sentiment_status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500">Score</span>
                      <span className="font-mono font-semibold">
                        {ward.raw_score}/100
                      </span>
                    </div>
                    
                  </div>
                </div>
              </Popup>
            </Circle>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1.5 rounded-lg border border-border bg-card/90 p-3 shadow-md backdrop-blur-sm">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Sentiment
        </span>
        {(
          [
            ["positive", "#1f9d55", "Positive"],
            ["negative", "#ef4444", "Negative"],
            ["neutral", "#64748b", "Neutral"],
          ] as const
        ).map(([, clr, label]) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: clr }}
            />
            <span className="text-xs text-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}