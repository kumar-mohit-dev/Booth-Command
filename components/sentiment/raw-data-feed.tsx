"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Newspaper } from "lucide-react"

interface RawDataFeedProps {
  items: Array<{
    text: string
    date?: string
    source?: string
  }>
}

export function RawDataFeed({ items }: RawDataFeedProps) {
  if (items.length === 0) {
    return (
      <Card className="border border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Newspaper className="size-8 text-muted-foreground/30" />
          <p className="mt-2 text-xs text-muted-foreground">
            No scraped data yet. Run analysis to populate this feed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Newspaper className="size-4 text-primary" />
          Raw Data Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="flex flex-col">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-b-0"
              >
                <p className="text-xs leading-relaxed text-foreground">
                  {item.text}
                </p>
                <div className="flex items-center gap-2">
                  {item.date && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {item.date}
                    </span>
                  )}
                  {item.source && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal"
                    >
                      {item.source}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
