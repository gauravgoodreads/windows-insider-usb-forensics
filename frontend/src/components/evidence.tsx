import { createContext, useContext, useState, type ReactNode } from "react"
import { ArrowRight, FileWarning } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { CodeBlock } from "@/components/reui/code-block/code-block"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useArtifactIndex, type Artifact, type Confidence } from "@/lib/case-data"
import {
  ARTIFACT_LABEL,
  EXPERIMENT_LABEL,
  TONE_CLASS,
  clock,
  confidenceBadge,
  day,
  humanize,
  isDestination,
  offset,
  toneOf,
} from "@/lib/format"
import { cn } from "@/lib/utils"

const DrawerContext = createContext<(id: string) => void>(() => {})

/** Lets any page open a record in the evidence drawer by its artifact ID. */
export function useOpenArtifact() {
  return useContext(DrawerContext)
}

export function EvidenceDrawerProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null)
  const index = useArtifactIndex()
  const artifact = selected ? index.get(selected) : undefined

  return (
    <DrawerContext.Provider value={setSelected}>
      {children}
      <Sheet open={!!artifact} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {artifact && <ArtifactDetail artifact={artifact} />}
        </SheetContent>
      </Sheet>
    </DrawerContext.Provider>
  )
}

function Field({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0 break-words text-foreground", mono && "font-mono text-[0.8rem]")}>{children ?? "—"}</dd>
    </div>
  )
}

function ArtifactDetail({ artifact: a }: { artifact: Artifact }) {
  const open = useOpenArtifact()
  const tone = TONE_CLASS[toneOf(a)]
  return (
    <>
      <SheetHeader className="gap-2 border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <ArtifactId id={a.artifact_id} />
          <Badge variant="outline" size="sm" className={tone.soft}>
            {ARTIFACT_LABEL[a.artifact_type] ?? humanize(a.artifact_type)}
          </Badge>
          {a.experiment && <Badge variant="secondary" size="sm">{a.experiment}</Badge>}
          {a.classification !== "NORMAL" && (
            <Badge variant="destructive-light" size="sm">
              <FileWarning /> {humanize(a.classification)}
            </Badge>
          )}
        </div>
        <SheetTitle className="text-lg">{a.description || ARTIFACT_LABEL[a.artifact_type] || a.artifact_id}</SheetTitle>
        <SheetDescription>
          Normalized record with its untouched source payload. Missing values stay empty; nothing is guessed.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 px-4 pb-8">
        <section>
          <h3 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Normalized fields</h3>
          <dl className="divide-y">
            <Field label="Time">
              {a.timestamp ? `${day(a.timestamp)}, ${clock(a.timestamp)} (${offset(a.timestamp)})` : "Unknown"}
            </Field>
            <Field label="Time meaning">{humanize(a.timestamp_type)}</Field>
            <Field label="Activity">{humanize(a.action)}</Field>
            <Field label="File">{a.filename}</Field>
            <Field label="Path" mono>
              {a.path}
              {a.path && isDestination(a) && (
                <Badge variant="info-light" size="sm" className="ml-2 align-middle">on USB</Badge>
              )}
            </Field>
            <Field label="Device">{a.device}</Field>
            <Field label="User">{a.user}</Field>
            <Field label="Experiment">{a.experiment ? EXPERIMENT_LABEL[a.experiment] ?? a.experiment : null}</Field>
            <Field label="Source">{a.source}</Field>
            <Field label="Confidence">
              <ConfidenceBadge value={a.confidence} />
            </Field>
            <Field label="Inferred fields">
              {a.inferred_fields.length ? a.inferred_fields.map(humanize).join(", ") : "None. Every value was observed."}
            </Field>
            <Field label="Derived from">
              <span className="flex flex-wrap gap-1">
                {a.derived_from.map((id) =>
                  id === a.artifact_id ? (
                    <ArtifactId key={id} id={id} />
                  ) : (
                    <ArtifactId key={id} id={id} onClick={() => open(id)} />
                  )
                )}
              </span>
            </Field>
          </dl>
        </section>

        <Separator />

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Raw source record</h3>
          <p className="text-sm text-muted-foreground">
            Exactly as ingested from the export. {a.observed_fields.length} fields observed.
          </p>
          <CodeBlock code={JSON.stringify(a.raw, null, 2)} language="json" label={`${a.artifact_id} raw payload`} defaultWrap />
        </section>
      </div>
    </>
  )
}

export function ArtifactId({ id, onClick, className }: { id: string; onClick?: () => void; className?: string }) {
  const base = "inline-flex h-5 items-center rounded-sm border px-1.5 font-mono text-[0.7rem] tabular-nums"
  if (!onClick) return <span className={cn(base, "border-border bg-muted text-muted-foreground", className)}>{id}</span>
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        base,
        "border-border bg-background text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
    >
      {id}
    </button>
  )
}

/** Artifact chips that open the evidence drawer. */
export function ArtifactLinks({ ids, className }: { ids: string[]; className?: string }) {
  const open = useOpenArtifact()
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {ids.map((id) => (
        <ArtifactId key={id} id={id} onClick={() => open(id)} />
      ))}
    </span>
  )
}

export function ConfidenceBadge({ value }: { value: Confidence }) {
  return (
    <Badge variant={confidenceBadge(value)} size="sm" className="font-mono tracking-wide">
      {value}
    </Badge>
  )
}

export function ToneDot({ artifact, className }: { artifact: Artifact; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", TONE_CLASS[toneOf(artifact)].dot, className)} />
}

export function PathFlow({ from, to }: { from: string; to: string }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-muted-foreground">
      <span className="break-all">{from}</span>
      <ArrowRight className="size-3 shrink-0" />
      <span className="break-all text-foreground">{to}</span>
    </span>
  )
}
