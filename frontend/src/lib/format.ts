import type { Artifact, Assessment, Confidence } from "@/lib/case-data"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * Timestamps are shown exactly as recorded (case local time, +05:30), never converted to the
 * viewer's clock, so the dashboard matches the reports and timeline CSV.
 */
export function clock(ts: string | null | undefined): string {
  const m = ts?.match(/T(\d{2}):(\d{2})/)
  return m ? `${m[1]}:${m[2]}` : "—"
}

export function day(ts: string | null | undefined): string {
  const m = ts?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : "Unknown time"
}

export function offset(ts: string | null | undefined): string {
  const m = ts?.match(/([+-]\d{2}:\d{2}|Z)$/)
  return m ? (m[1] === "Z" ? "UTC" : `UTC${m[1]}`) : ""
}

export function minutesBetween(a: string | null, b: string | null): number | null {
  if (!a || !b) return null
  return Math.round((Date.parse(b) - Date.parse(a)) / 60000)
}

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function humanize(value: string | null | undefined): string {
  if (!value) return "—"
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}

export const EXPERIMENT_LABEL: Record<string, string> = {
  "EXP-A": "Experiment A · normal backup",
  "EXP-B": "Experiment B · simulated incident",
}

export const ARTIFACT_LABEL: Record<string, string> = {
  simulation_metadata: "Simulation metadata",
  user_session: "User session",
  usb: "USB device",
  filesystem: "Filesystem",
  lnk: "Shortcut (LNK)",
  office: "Recent document",
  archive: "Archive",
  recycle_bin: "Recycle Bin",
}

export const CORRELATION_LABEL: Record<string, string> = {
  USER_SESSION: "User session",
  USB_SESSION: "USB session",
  POSSIBLE_TRANSFER_SESSION: "Possible transfer session",
  SENSITIVE_FILE_ACTIVITY: "Sensitive-file activity",
  ARCHIVE_ACTIVITY: "Archive activity",
  POSSIBLE_CONCEALMENT: "Possible concealment",
}

export type Tone ="usb" | "file" | "risk" | "user" | "meta"

export function toneOf(a: Artifact): Tone {
  if (a.artifact_type === "simulation_metadata") return "meta"
  if (a.artifact_type === "user_session") return "user"
  if (a.artifact_type === "usb") return "usb"
  if (a.artifact_type === "archive" || a.artifact_type === "recycle_bin" || a.action === "deleted") return "risk"
  return "file"
}

export const TONE_CLASS: Record<Tone, { dot: string; text: string; soft: string }> = {
  usb: { dot: "bg-usb", text: "text-usb", soft: "bg-usb/10 text-usb border-usb/20" },
  file: { dot: "bg-clue", text: "text-clue", soft: "bg-clue/10 text-clue border-clue/25" },
  risk: { dot: "bg-risk", text: "text-risk", soft: "bg-risk/10 text-risk border-risk/20" },
  user: { dot: "bg-muted-foreground", text: "text-muted-foreground", soft: "bg-muted text-muted-foreground border-border" },
  meta: { dot: "bg-border", text: "text-muted-foreground", soft: "bg-muted text-muted-foreground border-border" },
}

export function assessmentBadge(a: Assessment): { label: string; variant: "success-light" | "warning-light" | "destructive-light" | "secondary" } {
  switch (a) {
    case "SUPPORTED":
      return { label: "Supported", variant: "success-light" }
    case "PARTIALLY_SUPPORTED":
      return { label: "Partially supported", variant: "warning-light" }
    case "NOT_SUPPORTED":
      return { label: "Not supported", variant: "destructive-light" }
    default:
      return { label: humanize(a), variant: "secondary" }
  }
}

export function confidenceBadge(c: Confidence): "primary-outline" | "warning-outline" | "secondary" {
  return c === "HIGH" ? "primary-outline" : c === "MEDIUM" ? "warning-outline" : "secondary"
}

export function isDestination(a: Artifact): boolean {
  // Mirrors forensic/scoring/engine.py on_removable_media.
  const path = (a.path ?? "").toUpperCase()
  return !!path && (path.startsWith("E:\\") || (!!a.device && !/^(C:\\|HKLM|HKEY)/.test(path)))
}

/** The interpretation boundary that must accompany each hypothesis when it is presented. */
export const HYPOTHESIS_LIMIT: Record<string, string> = {
  H1: "USB use is ordinary and also appears in the control experiment, so device presence alone says nothing about copying.",
  H2: "Opening a file is not the same as copying it. Shortcut and recent-document records show access, not transfer.",
  H3: "Correlation establishes timing and links between records. It does not establish intent or prove causation.",
  H4: "Archiving and deleting files have many innocent explanations. Intent cannot be inferred from these traces.",
}

export const SCORE_RULE_LABEL: Record<string, string> = {
  usb_connection: "USB connection observed",
  sensitive_file_access: "Sensitive file accessed",
  archive_creation: "Archive created",
  deleted_sensitive_file: "Sensitive file deleted",
  matching_destination_file: "Matching file on the USB",
  user_session_correlation: "User session corroborates timing",
}
