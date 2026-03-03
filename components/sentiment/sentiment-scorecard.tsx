"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// 1. Updated sentiment to expect a number
interface SentimentScorecardProps {
  sentiment: number | null
  summary: string | null
  ward: string
  isLoading: boolean
}

// 2. Updated logic to handle the 0-100 scale
function getSentimentConfig(score: number | null) {
  if (score === null) {
    return {
      label: "Unknown",
      color: "bg-muted",
      textColor: "text-muted-foreground",
      bgAccent: "bg-muted/10",
    }
  }

  // Define thresholds for your 0-100 scale
  if (score >= 60) {
    return {
      label: `Positive (${score})`, 
      color: "bg-sentiment-positive",
      textColor: "text-sentiment-positive",
      bgAccent: "bg-sentiment-positive/10",
    }
  }
  
  if (score <= 40) {
    return {
      label: `Negative (${score})`,
      color: "bg-sentiment-negative",
      textColor: "text-sentiment-negative",
      bgAccent: "bg-sentiment-negative/10",
    }
  }
  
  return {
    label: `Neutral (${score})`,
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

  // 3. Changed from !sentiment to sentiment === null so a score of 0 doesn't hide the UI
  if (sentiment === null) {
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