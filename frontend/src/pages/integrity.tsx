import { useState } from "react"
import { Check, Copy, Download, FileCode, FileJson, FileSpreadsheet, FileText, Fingerprint, ShieldCheck } from "lucide-react"

import { PageHeader } from "@/components/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { CodeBlock } from "@/components/reui/code-block/code-block"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { IconTile } from "@/components/reui/icon-tile"
import { Timeline, TimelineContent, TimelineDate, TimelineHeader, TimelineIndicator, TimelineItem, TimelineSeparator, TimelineTitle } from "@/components/reui/timeline"
import { Button } from "@/components/ui/button"
import { useCaseData } from "@/lib/case-data"
import { SCORE_RULE_LABEL, bytes, clock, day, humanize } from "@/lib/format"
import { cn } from "@/lib/utils"

function CopyHash({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
          .catch(() => setCopied(false))
      }}
    >
      {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy hash"}
    </Button>
  )
}

export function CustodyPage() {
  const d = useCaseData()
  return (
    <>
      <PageHeader eyebrow="Integrity" title="Chain of custody">
        Who handled each evidence item, when, and its SHA-256 fingerprint. If a later hash matches the recorded one, the bytes examined are unchanged. A
        hash detects change; it is not encryption.
      </PageHeader>

      <div className="flex flex-col gap-6">
        {d.evidence.map((e) => (
          <Frame key={e.evidence_id}>
            <FrameHeader className="flex-row flex-wrap items-center gap-3">
              <IconTile variant="soft">
                <Fingerprint />
              </IconTile>
              <div className="min-w-0 flex-1">
                <FrameTitle className="font-mono">{e.evidence_id}</FrameTitle>
                <FrameDescription>{e.filename}</FrameDescription>
              </div>
              <CopyHash value={e.sha256} />
            </FrameHeader>
            <FramePanel className="flex flex-col gap-3">
              <div>
                <div className="mb-1 text-xs text-muted-foreground">SHA-256</div>
                <div className="font-mono text-sm break-all">{e.sha256}</div>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Size</dt>
                  <dd className="font-mono">{bytes(e.size)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Recorded</dt>
                  <dd>
                    {day(e.acquired_at)} {clock(e.acquired_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Examiner</dt>
                  <dd>{e.examiner}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd>{e.evidence_id.startsWith("EVD-DEMO") ? <Badge variant="warning-light">Synthetic demo bundle</Badge> : "Export bundle"}</dd>
                </div>
              </dl>
            </FramePanel>
            <FrameFooter className="text-sm text-muted-foreground">{e.notes}</FrameFooter>
          </Frame>
        ))}

        <div className="grid gap-6 lg:grid-cols-2">
          <Frame>
            <FrameHeader>
              <FrameTitle>Custody events</FrameTitle>
            </FrameHeader>
            <FramePanel className="pl-8">
              <Timeline value={d.custody.length}>
                {d.custody.map((c, i) => (
                  <TimelineItem key={c.id} step={i + 1} className="group-data-[orientation=vertical]/timeline:ms-6">
                    <TimelineHeader>
                      <TimelineSeparator />
                      <TimelineDate>
                        {day(c.timestamp)} · {clock(c.timestamp)}
                      </TimelineDate>
                      <TimelineTitle>{c.action}</TimelineTitle>
                      <TimelineIndicator className="group-data-[orientation=vertical]/timeline:-left-6" />
                    </TimelineHeader>
                    <TimelineContent>
                      {c.person} · {c.source} → {c.destination}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </FramePanel>
          </Frame>

          <Frame>
            <FrameHeader>
              <FrameTitle>Investigator tool audit log</FrameTitle>
              <FrameDescription>Every analysis run is recorded. Newest first.</FrameDescription>
            </FrameHeader>
            <FramePanel className="max-h-80 overflow-y-auto p-0">
              <table className="w-full text-sm">
                <tbody className="divide-y">
                  {d.audit.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2 font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">{a.timestamp}</td>
                      <td className="px-4 py-2">{humanize(a.action)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </FramePanel>
          </Frame>
        </div>

        <Frame>
          <FrameHeader>
            <FrameTitle>Collect and verify real evidence</FrameTitle>
            <FrameDescription>Read-only triage of a real Windows PC, then hashing and verification. Run from the project folder; no virtual machine needed.</FrameDescription>
          </FrameHeader>
          <FramePanel className="p-0">
            <CodeBlock
              language="bash"
              variant="ghost"
              label="Evidence collection and integrity commands"
              code={[
                ".\\collector\\collect_usb_artifacts.ps1 -OutputDir C:\\Evidence\\triage-001 -SinceDays 14",
                "python acquisition\\hash_evidence.py   C:\\Evidence\\triage-001\\collected_LIVE.json --evidence-id EVD-001",
                "python acquisition\\verify_evidence.py C:\\Evidence\\triage-001\\collected_LIVE.json --manifest C:\\Evidence\\EVD-001.json",
                "python scripts\\run_pipeline.py --input C:\\Evidence\\triage-001",
              ].join("\n")}
            />
          </FramePanel>
        </Frame>
      </div>
    </>
  )
}

const REPORT_META: Record<string, { icon: typeof FileText; label: string; use: string }> = {
  pdf: { icon: FileText, label: "PDF report", use: "Submission-ready document" },
  html: { icon: FileCode, label: "HTML report", use: "Opens in any browser" },
  md: { icon: FileText, label: "Markdown report", use: "Plain-text, version-friendly" },
  json: { icon: FileJson, label: "JSON report", use: "Full machine-readable results" },
  csv: { icon: FileSpreadsheet, label: "CSV dataset", use: "Open in Excel for research" },
}

export function ReportsPage() {
  const d = useCaseData()
  return (
    <>
      <PageHeader eyebrow="Output" title="Reports and datasets">
        Generated from the same case database as this dashboard, so every format tells the same story.
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {d.reports.map((r) => {
          const meta = REPORT_META[r.suffix] ?? { icon: FileText, label: r.suffix.toUpperCase(), use: "" }
          return (
            <Frame key={r.name} spacing="sm">
              <FramePanel className="flex items-start gap-3">
                <IconTile variant="frame" size="sm">
                  <meta.icon />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{meta.label}</div>
                  <div className="font-mono text-[0.7rem] break-all text-muted-foreground">{r.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {meta.use} · {bytes(r.size)}
                  </div>
                </div>
                <Button variant="outline" size="icon-sm" render={<a href={`/reports/download/${encodeURIComponent(r.name)}`} aria-label={`Download ${r.name}`} />}>
                  <Download />
                </Button>
              </FramePanel>
            </Frame>
          )
        })}
      </div>
      {d.disclaimer && <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">{d.disclaimer}</p>}
    </>
  )
}

export function SettingsPage() {
  const d = useCaseData()
  const s = d.settings
  const max = Object.values(d.score.rules).reduce((a, b) => a + b, 0)
  return (
    <>
      <PageHeader eyebrow="Method" title="Method and settings">
        The rules behind every result. They are explicit, configurable in config/*.yaml, and defined by this project rather than by an industry standard.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Frame>
          <FrameHeader>
            <FrameTitle>Case configuration</FrameTitle>
          </FrameHeader>
          <FramePanel>
            <dl className="grid grid-cols-[9rem_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Case ID</dt>
              <dd className="font-mono">{s.project.case_id}</dd>
              <dt className="text-muted-foreground">Workstation</dt>
              <dd>{s.victim.hostname} · {s.victim.os}</dd>
              <dt className="text-muted-foreground">User</dt>
              <dd>{s.victim.username}</dd>
              <dt className="text-muted-foreground">Company</dt>
              <dd>{s.company.name} (fictional)</dd>
              <dt className="text-muted-foreground">USB label</dt>
              <dd className="font-mono">{s.usb.expected_label}</dd>
              <dt className="text-muted-foreground">Time zone</dt>
              <dd>{s.project.timezone}</dd>
              <dt className="text-muted-foreground">Correlation window</dt>
              <dd>
                <span className="font-medium">{s.analysis.correlation_window_minutes} minutes</span>
                <span className="text-muted-foreground"> · allowed {s.analysis.allowed_windows.join(", ")}</span>
              </dd>
            </dl>
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader className="flex-row items-center justify-between">
            <FrameTitle>Experimental score</FrameTitle>
            <span className="font-mono text-lg tabular-nums">
              {d.score.score}
              <span className="text-muted-foreground">/{max}</span>
            </span>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-2.5">
            {Object.entries(d.score.rules).map(([rule, pts]) => {
              const hit = d.score.observed[rule]
              return (
                <div key={rule} className="grid grid-cols-[1fr_5rem_1.5rem] items-center gap-3 text-sm">
                  <span className={cn(!hit && "text-muted-foreground")}>{SCORE_RULE_LABEL[rule] ?? humanize(rule)}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: pts }, (_, i) => (
                      <span key={i} className={cn("h-2 flex-1 rounded-sm", hit ? "bg-primary" : "bg-muted")} />
                    ))}
                  </div>
                  <span className="text-right font-mono text-xs tabular-nums">{hit ? `+${pts}` : "0"}</span>
                </div>
              )
            })}
          </FramePanel>
          <FrameFooter className="text-xs text-muted-foreground">{d.score.disclaimer}</FrameFooter>
        </Frame>
      </div>

      <Alert className="mt-6">
        <ShieldCheck />
        <AlertTitle>Scope of this platform</AlertTitle>
        <AlertDescription>{d.disclaimer}</AlertDescription>
      </Alert>
    </>
  )
}
