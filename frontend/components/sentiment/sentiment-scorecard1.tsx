"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SentimentScorecardProps {
  sentiment: string | null
  summary: string | null
  ward: string
  isLoading: boolean
}

function getSentimentConfig(sentiment: string | null) {
  const s = sentiment?.toLowerCase() || ""
  if (s.includes("positive")) {
    return {
      label: "Positive",
      color: "bg-sentiment-positive",
      textColor: "text-sentiment-positive",
      bgAccent: "bg-sentiment-positive/10",
    }
  }
  if (s.includes("negative")) {
    return {
      label: "Negative",
      color: "bg-sentiment-negative",
      textColor: "text-sentiment-negative",
      bgAccent: "bg-sentiment-negative/10",
    }
  }
  return {
    label: "Neutral",
    color: "bg-sentiment-neutral",
    textColor: "text-sentiment-neutral",
    bgAccent: "bg-sentiment-neutral/10",
  }
}

export function SentimentScorecard({
  sentiment,
  summary,
  ward,
  isLoading,
}: SentimentScorecardProps) {
  const config = getSentimentConfig(sentiment)

  if (isLoading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">
              AI is analyzing {ward}...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sentiment) {
    return (
      <Card className="border border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            Select a ward and run analysis to view sentiment.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          Sentiment Analysis - {ward}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-4",
            config.bgAccent
          )}
        >
          <div className={cn("size-4 rounded-full", config.color)} />
          <div className="flex flex-col">
            <span className={cn("text-lg font-bold", config.textColor)}>
              {config.label}
            </span>
            <Badge variant="outline" className="mt-0.5 w-fit text-[10px]">
              AI-Powered Analysis
            </Badge>
          </div>
        </div>

        {summary && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs leading-relaxed text-foreground">
              {summary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
