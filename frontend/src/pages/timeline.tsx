import { useState } from "react"
import { Usb } from "lucide-react"

import { PageHeader } from "@/components/app-shell"
import { ArtifactId, useOpenArtifact } from "@/components/evidence"
import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCaseData, type Artifact } from "@/lib/case-data"
import { ARTIFACT_LABEL, EXPERIMENT_LABEL, TONE_CLASS, clock, day, humanize, minutesBetween, offset, toneOf } from "@/lib/format"
import { cn } from "@/lib/utils"

function ExperimentTimeline({ experiment, onlyUsbWindow }: { experiment: string; onlyUsbWindow: boolean }) {
  const d = useCaseData()
  const open = useOpenArtifact()
  const usb = d.correlations.find((c) => c.type === "USB_SESSION" && c.experiment === experiment)
  // Without a disconnect record the window stays open for the configured correlation window, matching the engine's rule.
  const hasEnd = !!usb?.end_time && usb.end_time !== usb.start_time
  const startMs = usb?.start_time ? Date.parse(usb.start_time) : null
  const endMs = startMs === null ? null : hasEnd ? Date.parse(usb!.end_time!) : startMs + d.settings.analysis.correlation_window_minutes * 60000
  const inWindow = (a: Artifact) => startMs !== null && endMs !== null && !!a.timestamp && Date.parse(a.timestamp) >= startMs && Date.parse(a.timestamp) <= endMs
  const items = d.artifacts.filter((a) => a.experiment === experiment && a.timestamp).filter((a) => !onlyUsbWindow || inWindow(a))
  const span = usb && hasEnd ? minutesBetween(usb.start_time, usb.end_time) : null

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>{EXPERIMENT_LABEL[experiment] ?? experiment}</FrameTitle>
        <FrameDescription>
          {items[0]?.timestamp ? `${day(items[0].timestamp)} · ${offset(items[0].timestamp)}` : "No timed events"}
          {usb && (
            <span className="mt-1 flex items-center gap-1.5 text-usb">
              <Usb className="size-3.5" />
              {hasEnd
                ? `USB window ${clock(usb.start_time)}–${clock(usb.end_time)}${span !== null ? ` (${span} min)` : ""}`
                : `USB connected ${clock(usb.start_time)} · no removal record, ${d.settings.analysis.correlation_window_minutes}-min window applied`}
            </span>
          )}
        </FrameDescription>
      </FrameHeader>
      <FramePanel className="pl-8">
        <Timeline value={items.length}>
          {items.map((a, i) => {
            const tone = TONE_CLASS[toneOf(a)]
            const inside = inWindow(a)
            return (
              <TimelineItem key={a.artifact_id} step={i + 1} className="group-data-[orientation=vertical]/timeline:ms-6">
                <TimelineHeader>
                  <TimelineSeparator className={cn(inside ? "bg-usb/40" : "bg-border")} />
                  <TimelineDate className="font-mono tabular-nums">{clock(a.timestamp)}</TimelineDate>
                  <TimelineTitle>
                    <button type="button" onClick={() => open(a.artifact_id)} className="text-left hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none">
                      {a.description || ARTIFACT_LABEL[a.artifact_type]}
                    </button>
                  </TimelineTitle>
                  <TimelineIndicator className={cn("border-0 size-3.5 group-data-[orientation=vertical]/timeline:-left-6", tone.dot, inside && "ring-4 ring-usb/15")} />
                </TimelineHeader>
                <TimelineContent className="mt-1 flex flex-wrap items-center gap-1.5">
                  <ArtifactId id={a.artifact_id} />
                  <Badge variant="outline" size="sm" className={tone.soft}>
                    {ARTIFACT_LABEL[a.artifact_type] ?? humanize(a.artifact_type)}
                  </Badge>
                  {a.filename && a.artifact_type !== "usb" && <span className="text-xs text-foreground">{a.filename}</span>}
                  {a.classification !== "NORMAL" && (
                    <Badge variant="destructive-light" size="xs">
                      {humanize(a.classification)}
                    </Badge>
                  )}
                </TimelineContent>
              </TimelineItem>
            )
          })}
        </Timeline>
      </FramePanel>
    </Frame>
  )
}

export function TimelinePage() {
  const d = useCaseData()
  const [scope, setScope] = useState("all")
  const untimed = d.artifacts.filter((a) => !a.timestamp)
  const experiments = Array.from(new Set(d.artifacts.map((a) => a.experiment).filter((e): e is string => !!e))).sort()

  return (
    <>
      <PageHeader
        eyebrow="Evidence"
        title="Unified timeline"
        actions={
          <Tabs value={scope} onValueChange={(v) => setScope(String(v))}>
            <TabsList>
              <TabsTrigger value="all">All events</TabsTrigger>
              <TabsTrigger value="usb">Inside USB window</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        Events ordered by their recorded time and shown in case time (UTC+05:30), never converted to your clock. In Experiment B the sensitive-file activity clusters inside the USB window.
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {(
          [
            ["user", "User session"],
            ["usb", "USB device"],
            ["file", "File activity"],
            ["risk", "Archive or deletion"],
          ] as const
        ).map(([tone, label]) => (
          <span key={tone} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", TONE_CLASS[tone].dot)} /> {label}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {experiments.map((e) => (
          <ExperimentTimeline key={e} experiment={e} onlyUsbWindow={scope === "usb"} />
        ))}
      </div>

      {untimed.length > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          {untimed.length} records have no timestamp and are kept out of the ordering rather than given a guessed time:{" "}
          {untimed.map((a) => a.artifact_id).join(", ")}.
        </p>
      )}
    </>
  )
}
