"use client"

import { Phone, User } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Voter } from "@/lib/api"

interface VoterDataTableProps {
  voters: Voter[]
  totalResults: number
  isLoading: boolean
  hasFiltered: boolean
}

export function VoterDataTable({
  voters,
  totalResults,
  isLoading,
  hasFiltered,
}: VoterDataTableProps) {
  if (isLoading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Voter Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasFiltered) {
    return (
      <Card className="border border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <User className="size-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Apply filters to search voters
          </p>
          <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground/60">
            Use the filter panel to query voters by ward, age, gender,
            occupation, or scheme status.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (voters.length === 0) {
    return (
      <Card className="border border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <User className="size-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            No voters found
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Try adjusting your filter criteria.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold">Voter Records</CardTitle>
        <Badge variant="secondary" className="font-mono text-xs">
          {totalResults.toLocaleString()} results
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Age</TableHead>
                <TableHead className="text-xs">Gender</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Ward</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voters.map((voter, index) => (
                <TableRow key={`${voter.name}-${voter.phone || voter.phone_number}-${index}`} className="even:bg-muted/30">
                  <TableCell className="text-xs font-medium text-foreground">
                    {voter.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {voter.age}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {voter.gender}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1 font-mono text-muted-foreground">
                      <Phone className="size-3" />
                      {voter.phone || voter.phone_number || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal"
                    >
                      {voter.ward}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
