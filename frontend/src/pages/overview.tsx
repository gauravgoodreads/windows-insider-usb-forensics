import { Link } from "react-router-dom"
import { ArrowUpRight, Check, Minus, Scale } from "lucide-react"

import { PageHeader } from "@/components/app-shell"
import { ArtifactLinks, ConfidenceBadge } from "@/components/evidence"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper"
import { useCaseData } from "@/lib/case-data"
import { assessmentBadge } from "@/lib/format"

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <FramePanel className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-3xl font-medium tracking-tight tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </FramePanel>
  )
}

export function OverviewPage() {
  const d = useCaseData()
  const supported = d.hypotheses.filter((h) => h.assessment === "SUPPORTED").length
  const partial = d.hypotheses.filter((h) => h.assessment === "PARTIALLY_SUPPORTED").length
  const maxScore = Object.values(d.score.rules).reduce((a, b) => a + b, 0)
  const transfer = d.correlations.find((c) => c.type === "POSSIBLE_TRANSFER_SESSION")
  const experiments = new Set(d.artifacts.map((a) => a.experiment).filter(Boolean)).size
  const realRecords = d.artifacts.filter((a) => a.artifact_type !== "simulation_metadata").length

  const steps = [
    {
      title: "Ingest",
      metric: `${d.artifacts.length} records`,
      body: `Export files from ${experiments} experiments were loaded and hashed as evidence item ${d.evidence[0]?.evidence_id ?? "—"}. Every record keeps its original payload.`,
      to: "/custody",
      link: "See the evidence hash",
    },
    {
      title: "Normalize",
      metric: `${realRecords} observations`,
      body: "Differently shaped records (USBSTOR, NTFS listings, shortcuts, Recycle Bin, logons) were mapped into one model. Missing values stay missing.",
      to: "/artifacts",
      link: "Browse normalized artifacts",
    },
    {
      title: "Correlate",
      metric: `${d.correlations.length} links`,
      body: `Records were joined by user, device, file and a ${d.settings.analysis.correlation_window_minutes}-minute window. Each link lists the artifact IDs it used and why.`,
      to: "/correlations",
      link: "Inspect correlations",
    },
    {
      title: "Assess",
      metric: `${supported} + ${partial} of ${d.hypotheses.length}`,
      body: "Four hypotheses were tested separately, each with a confidence label and an interpretation limit.",
      to: "/hypotheses",
      link: "Read the hypotheses",
    },
    {
      title: "Report",
      metric: `${d.reports.length} files`,
      body: "The same stored results were written to PDF, HTML, Markdown, JSON and CSV, so the dashboard is not the only presentation.",
      to: "/reports",
      link: "Download reports",
    },
  ]

  return (
    <>
      <PageHeader eyebrow={`Case ${d.case.case_id}`} title="Can Windows traces tell an ordinary USB backup from a simulated insider transfer?">
        {d.case.title}. Investigator: {d.case.investigator}.
      </PageHeader>

      <div className="flex flex-col gap-6">
        <Alert variant="info">
          <Scale />
          <AlertTitle>Finding</AlertTitle>
          <AlertDescription className="text-[0.95rem] leading-relaxed text-foreground">
            {d.conclusion ??
              "Several independent artifacts agree within the USB window; no single artifact establishes the transfer on its own."}{" "}
            <span className="text-muted-foreground">USB use appears in both experiments, so it is treated as weak evidence on its own.</span>
          </AlertDescription>
        </Alert>

        <Frame spacing="sm" className="grid grid-cols-2 gap-1 lg:grid-cols-4">
          <Stat label="Normalized artifacts" value={String(d.artifacts.length)} detail={`${experiments} controlled scenarios`} />
          <Stat label="Correlations" value={String(d.correlations.length)} detail={transfer ? `incl. ${transfer.event_id} possible transfer` : "explainable links"} />
          <Stat label="Hypotheses supported" value={`${supported}/${d.hypotheses.length}`} detail={partial ? `${partial} partially supported` : "with stated limits"} />
          <Stat label="Experimental score" value={`${d.score.score}/${maxScore}`} detail="not a probability or standard" />
        </Frame>

        <Frame>
          <FrameHeader>
            <FrameTitle>How the conclusion was reached</FrameTitle>
            <FrameDescription>Select a stage to see what happened to the evidence there.</FrameDescription>
          </FrameHeader>
          <FramePanel>
            <Stepper defaultValue={3} indicators={{ completed: <Check className="size-3.5" /> }}>
              <StepperNav>
                {steps.map((s, i) => (
                  <StepperItem key={s.title} step={i + 1} completed className="relative">
                    <StepperTrigger className="flex-col gap-2 rounded-md px-1 py-1">
                      <StepperIndicator />
                      <div className="flex flex-col items-center gap-0.5 text-center">
                        <StepperTitle>{s.title}</StepperTitle>
                        <span className="hidden font-mono text-[0.7rem] text-muted-foreground sm:block">{s.metric}</span>
                      </div>
                    </StepperTrigger>
                    {i < steps.length - 1 && <StepperSeparator className="mx-1 -mt-9 group-data-[state=completed]/step:bg-primary/60" />}
                  </StepperItem>
                ))}
              </StepperNav>
              <StepperPanel className="mt-5 border-t pt-4">
                {steps.map((s, i) => (
                  <StepperContent key={s.title} value={i + 1} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-2xl text-sm leading-relaxed">
                      <span className="font-medium">{s.title}: </span>
                      {s.body}
                    </p>
                    <Link to={s.to} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
                      {s.link} <ArrowUpRight className="size-3.5" />
                    </Link>
                  </StepperContent>
                ))}
              </StepperPanel>
            </Stepper>
          </FramePanel>
        </Frame>

        <div className="grid gap-6 lg:grid-cols-5">
          <Frame className="lg:col-span-3">
            <FrameHeader className="flex-row items-center justify-between">
              <FrameTitle>Hypotheses</FrameTitle>
              <Link to="/hypotheses" className="text-xs font-medium text-primary hover:underline">
                Details and limits
              </Link>
            </FrameHeader>
            <FramePanel className="p-0">
              <ul className="divide-y">
                {d.hypotheses.map((h) => {
                  const b = assessmentBadge(h.assessment)
                  return (
                    <li key={h.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                      <span className="font-mono text-sm font-medium text-primary">{h.id}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{h.title}</div>
                        <ArtifactLinks ids={h.supporting_artifacts.slice(0, 6)} className="mt-1.5" />
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant={b.variant}>{b.label}</Badge>
                        <ConfidenceBadge value={h.confidence} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </FramePanel>
          </Frame>

          <Frame className="lg:col-span-2">
            <FrameHeader className="flex-row items-center justify-between">
              <FrameTitle>Control comparison</FrameTitle>
              <Link to="/experiments" className="text-xs font-medium text-primary hover:underline">
                Open A/B
              </Link>
            </FrameHeader>
            <FramePanel className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Trace</th>
                    <th className="px-2 py-2 text-center font-medium">A</th>
                    <th className="px-4 py-2 text-center font-medium">B</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {d.experiments.map((r) => (
                    <tr key={r.feature}>
                      <td className="px-4 py-2.5">{r.feature}</td>
                      <td className="px-2 text-center">{r.a ? <Check className="mx-auto size-4 text-success" /> : <Minus className="mx-auto size-4 text-muted-foreground/50" />}</td>
                      <td className="px-4 text-center">{r.b ? <Check className="mx-auto size-4 text-success" /> : <Minus className="mx-auto size-4 text-muted-foreground/50" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                Only USB connection appears in both, which is why it cannot separate the scenarios.
              </p>
            </FramePanel>
          </Frame>
        </div>
      </div>
    </>
  )
}
