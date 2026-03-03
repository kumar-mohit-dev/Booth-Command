"use client"

import { useState } from "react"
import {
  Search,
  RotateCcw,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { VoterFilters } from "@/lib/api"

interface FilterSidebarProps {
  onApplyFilters: (filters: VoterFilters) => void
  isLoading: boolean
}

const genderOptions = ["Male", "Female", "Other"]
const occupationOptions = [
  "Student",
  "Business",
  "Government",
  "Private",
  "Retired",
  "Homemaker",
  "Unemployed",
  "Other",
]

export function FilterSidebar({ onApplyFilters, isLoading }: FilterSidebarProps) {
  const [ward, setWard] = useState("")
  const [minAge, setMinAge] = useState("")
  const [maxAge, setMaxAge] = useState("")
  const [gender, setGender] = useState<string>("")
  const [occupation, setOccupation] = useState<string>("")
  const [schemeStatus, setSchemeStatus] = useState<string>("any")
  const [specificScheme, setSpecificScheme] = useState("")

  function handleApply() {
    const filters: VoterFilters = {}
    if (ward.trim()) filters.ward = ward.trim()
    if (minAge) filters.min_age = parseInt(minAge)
    if (maxAge) filters.max_age = parseInt(maxAge)
    if (gender && gender !== "all") filters.gender = gender
    if (occupation && occupation !== "all") filters.occupation = occupation
    if (schemeStatus === "specific" && specificScheme.trim()) {
      filters.specific_scheme = specificScheme.trim()
    } else if (schemeStatus === "has_any") {
      filters.has_any_scheme = true
    } else if (schemeStatus === "has_none") {
      filters.has_any_scheme = false
    }
    onApplyFilters(filters)
  }

  function handleReset() {
    setWard("")
    setMinAge("")
    setMaxAge("")
    setGender("")
    setOccupation("")
    setSchemeStatus("any")
    setSpecificScheme("")
    onApplyFilters({})
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Search className="size-4 text-primary" />
          Voter Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Ward */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ward" className="text-xs text-muted-foreground">
            Ward
          </Label>
          <Input
            id="ward"
            placeholder="e.g. Model Town"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        {/* Age Range */}
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="min-age" className="text-xs text-muted-foreground">
              Min Age
            </Label>
            <Input
              id="min-age"
              type="number"
              placeholder="18"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="max-age" className="text-xs text-muted-foreground">
              Max Age
            </Label>
            <Input
              id="max-age"
              type="number"
              placeholder="65"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {genderOptions.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Occupation */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Occupation</Label>
          <Select value={occupation} onValueChange={setOccupation}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All occupations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {occupationOptions.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Scheme Toggle */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Scheme Status</Label>
          <RadioGroup
            value={schemeStatus}
            onValueChange={setSchemeStatus}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="any" id="scheme-any" />
              <Label htmlFor="scheme-any" className="text-xs font-normal cursor-pointer">
                No filter
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="has_any" id="scheme-has-any" />
              <Label htmlFor="scheme-has-any" className="text-xs font-normal cursor-pointer">
                Has ANY scheme
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="has_none" id="scheme-has-none" />
              <Label htmlFor="scheme-has-none" className="text-xs font-normal cursor-pointer">
                Has NO schemes
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="specific" id="scheme-specific" />
              <Label htmlFor="scheme-specific" className="text-xs font-normal cursor-pointer">
                Has specific scheme
              </Label>
            </div>
          </RadioGroup>
          {schemeStatus === "specific" && (
            <Input
              placeholder="e.g. PM Awas Yojana"
              value={specificScheme}
              onChange={(e) => setSpecificScheme(e.target.value)}
              className="h-8 text-xs"
            />
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleApply}
            disabled={isLoading}
            size="sm"
            className="h-8 text-xs"
          >
            {isLoading ? (
              <>
                <RotateCcw className="mr-1.5 size-3 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Search className="mr-1.5 size-3" />
                Apply Filters
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
          >
            <RotateCcw className="mr-1.5 size-3" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
