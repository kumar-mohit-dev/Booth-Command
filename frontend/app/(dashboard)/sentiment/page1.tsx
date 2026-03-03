"use client"

import { useState, useCallback } from "react"
import { Radar, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeading } from "@/components/shared/page-heading"
import { SentimentScorecard } from "@/components/sentiment/sentiment-scorecard"
import { RawDataFeed } from "@/components/sentiment/raw-data-feed"
import { SentimentTrendChart } from "@/components/sentiment/sentiment-trend-chart"
import { API_BASE_URL } from "@/lib/api"

interface FeedItem {
  text: string
  date?: string
  source?: string
}

export default function SentimentPage() {
  const [ward, setWard] = useState("")
  const [sentiment, setSentiment] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [analyzedWard, setAnalyzedWard] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = useCallback(async () => {
    if (!ward.trim()) return

    setIsLoading(true)
    setError(null)
    setAnalyzedWard(ward.trim())

    try {
      const res = await fetch(`${API_BASE_URL}/api/sentiment/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ward: ward.trim() }),
      })

      if (!res.ok) {
        throw new Error(`API returned ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()

      setSentiment(data.current_sentiment || "Neutral")
      setSummary(data.latest_news_summary || null)

      // Populate raw feed from response tags and news
      const items: FeedItem[] = []
      if (data.latest_news_summary) {
        items.push({
          text: data.latest_news_summary,
          date: data.news_dates?.[0] || new Date().toLocaleDateString(),
          source: "AI Analysis",
        })
      }
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => {
          items.push({
            text: tag,
            source: "Tag",
          })
        })
      }
      setFeedItems(items)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze sentiment"
      )
      setSentiment(null)
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }, [ward])

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="AI Sentiment Engine"
        subtitle="Live Twitter/News scraping and Gemini AI analysis for ward-level public opinion."
      />

      {/* Controls */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Radar className="size-4 text-primary" />
            Analysis Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="ward-select" className="text-xs text-muted-foreground">
                Select Ward
              </Label>
              <Input
                id="ward-select"
                placeholder="e.g. Model Town, Paschim Vihar..."
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !ward.trim()}
              size="sm"
              className="h-9 gap-1.5 text-xs"
            >
              <Zap className="size-3.5" />
              Run Live AI Scraping
            </Button>
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-sentiment-negative/20 bg-sentiment-negative/5 p-3">
              <p className="text-xs text-sentiment-negative">
                <span className="font-semibold">Error:</span> {error}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Make sure your backend is running at {API_BASE_URL}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SentimentScorecard
          sentiment={sentiment}
          summary={summary}
          ward={analyzedWard}
          isLoading={isLoading}
        />
        <RawDataFeed items={feedItems} />
      </div>

      <SentimentTrendChart />
    </div>
  )
}
