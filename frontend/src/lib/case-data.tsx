import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type Confidence = "LOW" | "MEDIUM" | "HIGH"
export type Assessment = "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED" | "INSUFFICIENT_EVIDENCE"

export interface Artifact {
  artifact_id: string
  case_id: string
  timestamp: string | null
  timestamp_type: string
  artifact_type: string
  source: string
  host: string | null
  user: string | null
  path: string | null
  filename: string | null
  action: string | null
  device: string | null
  confidence: Confidence
  description: string
  experiment: string | null
  classification: string
  observed_fields: string[]
  inferred_fields: string[]
  raw: Record<string, unknown>
  derived_from: string[]
}

export interface Correlation {
  event_id: string
  type: string
  start_time: string | null
  end_time: string | null
  related_artifacts: string[]
  user: string | null
  device: string | null
  files: string[]
  confidence: Confidence
  reasoning: string[]
  experiment: string | null
}

export interface Hypothesis {
  id: string
  title: string
  description: string
  supporting_artifacts: string[]
  contradicting_artifacts: string[]
  assessment: Assessment
  confidence: Confidence
  reasoning: string[]
}

export interface CaseData {
  case: { case_id: string; title: string; investigator: string; created_at: string }
  evidence: { evidence_id: string; filename: string; sha256: string; size: number; examiner: string; acquired_at: string; notes: string }[]
  custody: { id: number; timestamp: string; action: string; person: string; evidence_id: string; source: string; destination: string; hash: string; notes: string }[]
  audit: { id: number; timestamp: string; action: string; details: string }[]
  artifacts: Artifact[]
  correlations: Correlation[]
  hypotheses: Hypothesis[]
  experiments: { feature: string; a: boolean; b: boolean }[]
  devices: { name: string; first: string | null; last: string | null; users: string[]; files: string[]; related: string[] }[]
  files: { name: string; classification: string | null; evidence: string[] }[]
  score: { score: number; observed: Record<string, boolean>; applied_rules: Record<string, number>; rules: Record<string, number>; disclaimer: string }
  reports: { name: string; size: number; suffix: string }[]
  settings: {
    project: { name: string; case_id: string; investigator: string; timezone: string }
    victim: { hostname: string; username: string; os: string }
    company: { name: string }
    usb: { expected_label: string }
    analysis: { correlation_window_minutes: number; allowed_windows: number[]; sensitive_patterns: Record<string, string> }
  }
  conclusion: string | null
  limitations: string[]
  disclaimer: string | null
}

type State = { data: CaseData | null; error: string | null; reload: () => void }
const CaseContext = createContext<State | null>(null)

export function CaseDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CaseData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/dashboard")
      .then((r) => {
        if (!r.ok) throw new Error(`The case API answered ${r.status}.`)
        return r.json() as Promise<CaseData>
      })
      .then((d) => !cancelled && (setData(d), setError(null)))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [nonce])

  return (
    <CaseContext.Provider value={{ data, error, reload: () => setNonce((n) => n + 1) }}>
      {children}
    </CaseContext.Provider>
  )
}

export function useCase() {
  const ctx = useContext(CaseContext)
  if (!ctx) throw new Error("useCase must be used inside CaseDataProvider")
  return ctx
}

/** Data is guaranteed by the shell, which renders pages only once the case has loaded. */
export function useCaseData(): CaseData {
  const { data } = useCase()
  if (!data) throw new Error("Case data is not loaded yet")
  return data
}

export function useArtifactIndex() {
  const data = useCaseData()
  return new Map(data.artifacts.map((a) => [a.artifact_id, a]))
}
