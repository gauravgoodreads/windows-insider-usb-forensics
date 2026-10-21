import { Check, CircleAlert, Minus } from "lucide-react"

import { PageHeader } from "@/components/app-shell"
import { ArtifactLinks, ConfidenceBadge } from "@/components/evidence"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { useCaseData, type Correlation } from "@/lib/case-data"
import { CORRELATION_LABEL, EXPERIMENT_LABEL, HYPOTHESIS_LIMIT, assessmentBadge, clock, humanize, isDestination, minutesBetween } from "@/lib/format"
import { cn } from "@/lib/utils"

function window(c: Correlation) {
  if (!c.start_time) return "No time"
  if (c.start_time === c.end_time || !c.end_time) return clock(c.start_time)
  return `${clock(c.start_time)}–${clock(c.end_time)} · ${minutesBetween(c.start_time, c.end_time)} min`
}

export function CorrelationsPage() {
  const d = useCaseData()
  const groups = Array.from(new Set(d.correlations.map((c) => c.experiment ?? "—"))).sort()

  return (
    <>
      <PageHeader eyebrow="Analysis" title="Correlations">
        Each link joins records that share a user, device, file or the {d.settings.analysis.correlation_window_minutes}-minute window. The engine stores
        the exact artifact IDs it used and its reasons in plain language, so every link can be checked by hand.
      </PageHeader>

      <div className="flex flex-col gap-8">
        {groups.map((g) => (
          <section key={g} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">{EXPERIMENT_LABEL[g] ?? g}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {d.correlations
                .filter((c) => (c.experiment ?? "—") === g)
                .map((c) => {
                  const key = c.type === "POSSIBLE_TRANSFER_SESSION"
                  return (
                    <Frame key={c.event_id} spacing="sm" className={cn(key && "md:col-span-2 [--frame-border-color:var(--color-primary)]")}>
                      <FrameHeader className="flex-row flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{c.event_id}</span>
                        <FrameTitle className="flex-1">{CORRELATION_LABEL[c.type] ?? humanize(c.type)}</FrameTitle>
                        {key && <Badge variant="primary-light">Key link</Badge>}
                        <ConfidenceBadge value={c.confidence} />
                      </FrameHeader>
                      <FramePanel className="flex flex-col gap-3">
                        <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1 text-sm">
                          <dt className="text-muted-foreground">Window</dt>
                          <dd className="font-mono text-xs leading-5 tabular-nums">{window(c)}</dd>
                          {c.user && (
                            <>
                              <dt className="text-muted-foreground">User</dt>
                              <dd>{c.user}</dd>
                            </>
                          )}
                          {c.device && (
                            <>
                              <dt className="text-muted-foreground">Device</dt>
                              <dd>{c.device}</dd>
                            </>
                          )}
                          {c.files.length > 0 && (
                            <>
                              <dt className="text-muted-foreground">Files</dt>
                              <dd className="break-words">{c.files.join(", ")}</dd>
                            </>
                          )}
                        </dl>
                        <ul className="flex flex-col gap-1.5 text-sm">
                          {c.reasoning.map((r) => (
                            <li key={r} className="flex gap-2">
                              <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </FramePanel>
                      <FrameFooter className="flex-row flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Built from</span>
                        <ArtifactLinks ids={c.related_artifacts} />
                      </FrameFooter>
                    </Frame>
                  )
                })}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

export function HypothesesPage() {
  const d = useCaseData()
  return (
    <>
      <PageHeader eyebrow="Analysis" title="Hypotheses H1–H4">
        Four separate questions instead of one verdict. Confidence labels are project-defined (Low, Medium, High), not probabilities, and every result
        carries the limit that must be stated with it.
      </PageHeader>

      <div className="flex flex-col gap-4">
        {d.hypotheses.map((h) => {
          const b = assessmentBadge(h.assessment)
          return (
            <Frame key={h.id}>
              <FrameHeader className="flex-row flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold text-primary">{h.id}</span>
                <FrameTitle className="flex-1 text-base">{h.title}</FrameTitle>
                <Badge variant={b.variant} size="lg">{b.label}</Badge>
                <ConfidenceBadge value={h.confidence} />
              </FrameHeader>
              <FramePanel className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{h.description}</p>
                  <div>
                    <h3 className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Why</h3>
                    <ul className="flex flex-col gap-1.5 text-sm">
                      {h.reasoning.map((r) => (
                        <li key={r} className="flex gap-2">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Supporting artifacts ({h.supporting_artifacts.length})
                    </h3>
                    <ArtifactLinks ids={h.supporting_artifacts} />
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">Contradicting artifacts</h3>
                    {h.contradicting_artifacts.length ? (
                      <ArtifactLinks ids={h.contradicting_artifacts} />
                    ) : (
                      <span className="text-sm text-muted-foreground">None recorded</span>
                    )}
                  </div>
                </div>
              </FramePanel>
              {HYPOTHESIS_LIMIT[h.id] && (
                <FrameFooter className="flex-row items-start gap-2 text-sm">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>
                    <span className="font-medium">Limit: </span>
                    <span className="text-muted-foreground">{HYPOTHESIS_LIMIT[h.id]}</span>
                  </span>
                </FrameFooter>
              )}
            </Frame>
          )
        })}
      </div>

      {d.limitations.length > 0 && (
        <Alert variant="warning" className="mt-6">
          <CircleAlert />
          <AlertTitle>Limitations of the whole analysis</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {d.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}

export function ExperimentsPage() {
  const d = useCaseData()
  const summary = (exp: string) => {
    const arts = d.artifacts.filter((a) => a.experiment === exp && a.artifact_type !== "simulation_metadata")
    return {
      total: arts.length,
      sensitive: arts.filter((a) => a.classification !== "NORMAL").length,
      destination: arts.filter((a) => isDestination(a)).length,
      correlations: d.correlations.filter((c) => c.experiment === exp).length,
    }
  }
  const a = summary("EXP-A")
  const b = summary("EXP-B")
  const rows: [string, number, number][] = [
    ["Observations", a.total, b.total],
    ["Sensitive-file records", a.sensitive, b.sensitive],
    ["Records on the USB drive", a.destination, b.destination],
    ["Correlations", a.correlations, b.correlations],
  ]

  return (
    <>
      <PageHeader eyebrow="Analysis" title="Experiment A vs Experiment B">
        Both scenarios share the same workstation, user, USB drive and fictional files, so the only real difference is what the user did. A is the control:
        without it, normal USB traces could be mistaken for evidence of leakage.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Frame>
          <FrameHeader>
            <FrameTitle>Which traces appear</FrameTitle>
            <FrameDescription>The feature checks used by the dashboard and reports.</FrameDescription>
          </FrameHeader>
          <FramePanel className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">Trace</th>
                  <th className="px-3 py-2.5 text-center font-medium">A · normal</th>
                  <th className="px-3 py-2.5 text-center font-medium">B · incident</th>
                  <th className="px-4 py-2.5 text-left font-medium">Separates?</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {d.experiments.map((r) => (
                  <tr key={r.feature}>
                    <td className="px-4 py-3">{r.feature}</td>
                    <td className="px-3 text-center">{r.a ? <Check className="mx-auto size-4 text-success" /> : <Minus className="mx-auto size-4 text-muted-foreground/50" />}</td>
                    <td className="px-3 text-center">{r.b ? <Check className="mx-auto size-4 text-success" /> : <Minus className="mx-auto size-4 text-muted-foreground/50" />}</td>
                    <td className="px-4">
                      {r.a === r.b ? <Badge variant="secondary" size="sm">No</Badge> : <Badge variant="success-light" size="sm">Yes</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader>
            <FrameTitle>Counts per experiment</FrameTitle>
            <FrameDescription>Simulation metadata rows are excluded.</FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-4">
            {rows.map(([label, av, bv]) => {
              const max = Math.max(av, bv, 1)
              return (
                <div key={label} className="flex flex-col gap-1.5">
                  <div className="text-sm">{label}</div>
                  {(
                    [
                      ["A", av, "bg-muted-foreground/40"],
                      ["B", bv, "bg-primary"],
                    ] as const
                  ).map(([name, v, color]) => (
                    <div key={name} className="grid grid-cols-[1.25rem_1fr_2rem] items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{name}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", color)} style={{ width: `${(v / max) * 100}%` }} />
                      </div>
                      <span className="text-right font-mono text-xs tabular-nums">{v}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </FramePanel>
        </Frame>
      </div>

      <Alert className="mt-6">
        <CircleAlert />
        <AlertTitle>Why this matters</AlertTitle>
        <AlertDescription>
          USB connection is present in both experiments, so on its own it cannot tell them apart. What separates B is sensitive-file activity and
          destination-side copies on the USB inside the same connection window. When reproducing the scenarios on a test PC, clean up between A and B so
          that one experiment's traces never leak into the other.
        </AlertDescription>
      </Alert>
    </>
  )
}
