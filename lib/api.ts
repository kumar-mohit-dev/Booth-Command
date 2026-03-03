export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export interface Voter {
  name: string
  age: number
  gender: string
  phone: string
  phone_number?: string
  ward: string
  occupation?: string
}

export interface VoterFilterResponse {
  total_results: number
  voters: Voter[]
}

export interface VoterFilters {
  ward?: string
  min_age?: number
  max_age?: number
  gender?: string
  occupation?: string
  specific_scheme?: string
  has_any_scheme?: boolean
}

export interface SentimentAnalyzeResponse {
  ward: string
  current_sentiment: string
  latest_news_summary: string
  news_dates?: string[]
  tags?: string[]
}

export type TaskPriority = "high" | "medium" | "low"
export type TaskStatus = "todo" | "pending_verification" | "verified"

export interface Task {
  id: string | number
  title: string
  ward: string
  assignee: string
  priority: TaskPriority
  status: TaskStatus
  proof_image?: string
  lat?: number
  lng?: number
}

export interface TaskListResponse {
  tasks: Task[]
}

export interface MapWardData {
  ward: string
  zone: string
  total_voters: number
  sentiment_status: "positive" | "negative" | "neutral"
  raw_score: number
  coordinates: [number, number]
}

export interface MapDataResponse {
  map_data: MapWardData[]
}