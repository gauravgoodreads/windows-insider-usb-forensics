import { ArrowRight, CircleAlert, HardDrive, Usb, User } from "lucide-react"

import { PageHeader } from "@/components/app-shell"
import { ArtifactId, ToneDot, useOpenArtifact } from "@/components/evidence"
import { Alert, AlertDescription } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { IconTile } from "@/components/reui/icon-tile"
import { useArtifactIndex, useCaseData, type Artifact } from "@/lib/case-data"
import { ARTIFACT_LABEL, clock, day, humanize, isDestination } from "@/lib/format"

function EvidenceRow({ a }: { a: Artifact }) {
  const open = useOpenArtifact()
  return (
    <li>
      <button
        type="button"
        onClick={() => open(a.artifact_id)}
        className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
      >
        <span className="w-11 shrink-0 pt-0.5 font-mono text-xs text-muted-foreground tabular-nums">{clock(a.timestamp)}</span>
        <ToneDot artifact={a} className="mt-1.5" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm">{a.description || ARTIFACT_LABEL[a.artifact_type]}</span>
          {a.path && <span className="block truncate font-mono text-[0.7rem] text-muted-foreground">{a.path}</span>}
        </span>
        <ArtifactId id={a.artifact_id} />
      </button>
    </li>
  )
}

export function DevicesPage() {
  const d = useCaseData()
  const index = useArtifactIndex()

  return (
    <>
      <PageHeader eyebrow="Evidence" title="USB devices">
        Device identity and connection windows from USBSTOR, event-log and filesystem records. This answers whether a device was present. It does not, by
        itself, show that anything was copied.
      </PageHeader>

      <div className="flex flex-col gap-6">
        {d.devices.map((dev) => {
          const related = dev.related.map((id) => index.get(id)).filter((a): a is Artifact => !!a)
          const sessions = d.correlations.filter((c) => c.type === "USB_SESSION" && c.device === dev.name)
          const writes = related.filter((a) => isDestination(a))
          return (
            <Frame key={dev.name}>
              <FrameHeader className="flex-row items-center gap-3">
                <IconTile variant="soft" className="text-usb">
                  <Usb />
                </IconTile>
                <div className="min-w-0 flex-1">
                  <FrameTitle className="font-mono text-base">{dev.name}</FrameTitle>
                  <FrameDescription>
                    First seen {day(dev.first)} {clock(dev.first)} · last seen {clock(dev.last)}
                  </FrameDescription>
                </div>
              </FrameHeader>

              <div className="grid gap-1 md:grid-cols-3">
                <FramePanel>
                  <div className="mb-2 text-xs text-muted-foreground">Connection sessions</div>
                  <ul className="flex flex-col gap-2">
                    {sessions.map((s) => (
                      <li key={s.event_id} className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary" size="sm">{s.experiment?.replace("EXP-", "Exp ")}</Badge>
                        <span className="font-mono text-xs tabular-nums">
                          {clock(s.start_time)} <ArrowRight className="inline size-3" /> {clock(s.end_time)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </FramePanel>
                <FramePanel>
                  <div className="mb-2 text-xs text-muted-foreground">Users during sessions</div>
                  {dev.users.map((u) => (
                    <div key={u} className="flex items-center gap-2 text-sm">
                      <User className="size-3.5 text-muted-foreground" /> {u}
                    </div>
                  ))}
                </FramePanel>
                <FramePanel>
                  <div className="mb-2 text-xs text-muted-foreground">Written to this device</div>
                  <div className="font-mono text-2xl tabular-nums">{writes.length}</div>
                  <div className="text-xs text-muted-foreground">
                    file records, {dev.files.length} classified sensitive ({dev.files.join(", ") || "none"})
                  </div>
                </FramePanel>
              </div>

              <FramePanel className="p-0">
                <ul className="divide-y">
                  {related.map((a) => (
                    <EvidenceRow key={a.artifact_id} a={a} />
                  ))}
                </ul>
              </FramePanel>
            </Frame>
          )
        })}

        <Alert variant="warning">
          <CircleAlert />
          <AlertDescription>
            The same device appears in the normal backup and in the simulated incident. Device presence supports H1 only; copying needs file and
            destination evidence.
          </AlertDescription>
        </Alert>
      </div>
    </>
  )
}

export function FilesPage() {
  const d = useCaseData()
  const index = useArtifactIndex()
  const patterns = d.settings.analysis.sensitive_patterns

  return (
    <>
      <PageHeader eyebrow="Evidence" title="Sensitive files">
        Files matched against the configured sensitive-file list. Source-side records show the file being used on the computer; destination-side records
        show a copy on the USB drive. The second kind is the strongest single clue.
      </PageHeader>

      <div className="flex flex-col gap-5">
        {d.files.map((f) => {
          const evidence = f.evidence.map((id) => index.get(id)).filter((a): a is Artifact => !!a)
          const source = evidence.filter((a) => !isDestination(a))
          const dest = evidence.filter((a) => isDestination(a))
          return (
            <Frame key={f.name}>
              <FrameHeader className="flex-row flex-wrap items-center gap-3">
                <IconTile variant="soft" className="text-clue">
                  <HardDrive />
                </IconTile>
                <FrameTitle className="flex-1 text-base">{f.name}</FrameTitle>
                <Badge variant="destructive-light">{humanize(f.classification)}</Badge>
              </FrameHeader>
              <div className="grid gap-1 md:grid-cols-2">
                <FramePanel className="p-0">
                  <div className="border-b px-4 py-2 text-xs font-medium text-muted-foreground">On the computer · {source.length}</div>
                  {source.length ? (
                    <ul className="divide-y">{source.map((a) => <EvidenceRow key={a.artifact_id} a={a} />)}</ul>
                  ) : (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No source-side record.</p>
                  )}
                </FramePanel>
                <FramePanel className="p-0">
                  <div className="border-b px-4 py-2 text-xs font-medium text-usb">On the USB drive · {dest.length}</div>
                  {dest.length ? (
                    <ul className="divide-y">{dest.map((a) => <EvidenceRow key={a.artifact_id} a={a} />)}</ul>
                  ) : (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No destination-side record. This file is not shown on the USB.</p>
                  )}
                </FramePanel>
              </div>
            </Frame>
          )
        })}

        <Frame spacing="sm">
          <FrameHeader>
            <FrameTitle>Configured sensitive-file list</FrameTitle>
            <FrameDescription>From config/project.yaml. Files not on this list are classified Normal.</FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-wrap gap-2">
            {Object.entries(patterns).map(([name, cls]) => (
              <span key={name} className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm">
                {name}
                <Badge variant={cls === "HIGHLY_SENSITIVE" ? "destructive-light" : "warning-light"} size="xs">
                  {humanize(cls)}
                </Badge>
                {!d.files.some((f) => f.name === name) && <span className="text-xs text-muted-foreground">no activity</span>}
              </span>
            ))}
          </FramePanel>
        </Frame>
        <p className="text-xs text-muted-foreground">Select any record to open its normalized and raw data.</p>
      </div>
    </>
  )
}
