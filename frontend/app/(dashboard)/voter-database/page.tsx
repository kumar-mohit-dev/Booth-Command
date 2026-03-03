"use client"

import { useState, useCallback } from "react"
import { Send, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeading } from "@/components/shared/page-heading"
import { StatCard } from "@/components/shared/stat-card"
import { FilterSidebar } from "@/components/voter-database/filter-sidebar"
import { VoterDataTable } from "@/components/voter-database/voter-data-table"
import { WhatsAppBlastModal } from "@/components/voter-database/whatsapp-blast-modal"
import { API_BASE_URL, type Voter, type VoterFilters } from "@/lib/api"

export default function VoterDatabasePage() {
  const [voters, setVoters] = useState<Voter[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasFiltered, setHasFiltered] = useState(false)
  const [blastOpen, setBlastOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApplyFilters = useCallback(async (filters: VoterFilters) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.ward) params.set("ward", filters.ward)
      if (filters.min_age) params.set("min_age", String(filters.min_age))
      if (filters.max_age) params.set("max_age", String(filters.max_age))
      if (filters.gender) params.set("gender", filters.gender)
      if (filters.occupation) params.set("occupation", filters.occupation)
      if (filters.specific_scheme)
        params.set("specific_scheme", filters.specific_scheme)
      if (filters.has_any_scheme !== undefined)
        params.set("has_any_scheme", String(filters.has_any_scheme))

      const queryString = params.toString()
      const url = `${API_BASE_URL}/api/voters/filter${queryString ? `?${queryString}` : ""}`

      const res = await fetch(url)

      if (!res.ok) {
        throw new Error(`API returned ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      setVoters(data.voters || [])
      setTotalResults(data.total_results || 0)
      setHasFiltered(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch voter data"
      )
      setVoters([])
      setTotalResults(0)
      setHasFiltered(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeading
          title="Voter Database"
          subtitle="Build hyper-local targeted audiences with intelligent segmentation."
        />

        {hasFiltered && totalResults > 0 && (
          <Button
            size="sm"
            onClick={() => setBlastOpen(true)}
            className="gap-1.5 self-start text-xs"
          >
            <Send className="size-3.5" />
            Trigger WhatsApp Blast
          </Button>
        )}
      </div>

      {hasFiltered && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Filtered Voters"
            value={totalResults}
            icon={Users}
          />
          <StatCard
            label="With Phone"
            value={voters.filter((v) => v.phone || v.phone_number).length}
            icon={Users}
          />
          <StatCard
            label="Avg Age"
            value={
              voters.length > 0
                ? Math.round(
                    voters.reduce((sum, v) => sum + v.age, 0) / voters.length
                  )
                : 0
            }
            icon={Users}
          />
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-72">
          <FilterSidebar
            onApplyFilters={handleApplyFilters}
            isLoading={isLoading}
          />
        </aside>

        <main className="flex-1">
          {error && (
            <div className="mb-4 rounded-lg border border-sentiment-negative/20 bg-sentiment-negative/5 p-3">
              <p className="text-xs text-sentiment-negative">
                <span className="font-semibold">Error:</span> {error}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Make sure your backend is running at {API_BASE_URL}
              </p>
            </div>
          )}
          <VoterDataTable
            voters={voters}
            totalResults={totalResults}
            isLoading={isLoading}
            hasFiltered={hasFiltered}
          />
        </main>
      </div>

      <WhatsAppBlastModal
        open={blastOpen}
        onOpenChange={setBlastOpen}
        recipientCount={totalResults}
      />
    </div>
  )
}
