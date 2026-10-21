import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useEffect } from "react"
import { Search } from "lucide-react"
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table"
import { useTable } from "@tanstack/react-table"

import { PageHeader } from "@/components/app-shell"
import { ArtifactId, ConfidenceBadge, ToneDot, useOpenArtifact } from "@/components/evidence"
import { Badge } from "@/components/reui/badge"
import { DataGrid, DataGridContainer, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCaseData, type Artifact } from "@/lib/case-data"
import { ARTIFACT_LABEL, clock, humanize, isDestination } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ArtifactsPage() {
  const d = useCaseData()
  const open = useOpenArtifact()
  const { id } = useParams()
  const [query, setQuery] = useState("")
  const [experiment, setExperiment] = useState("all")
  const [type, setType] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  // /artifact/<id> deep links open the record straight away.
  useEffect(() => {
    if (id) open(id)
  }, [id, open])

  const types = useMemo(() => Array.from(new Set(d.artifacts.map((a) => a.artifact_type))), [d.artifacts])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return d.artifacts.filter(
      (a) =>
        (experiment === "all" || a.experiment === experiment) &&
        (!type || a.artifact_type === type) &&
        (!q || JSON.stringify(a).toLowerCase().includes(q))
    )
  }, [d.artifacts, query, experiment, type])

  const columns = useMemo<ColumnDef<DataGridFeatures, Artifact>[]>(
    () => [
      {
        accessorKey: "artifact_id",
        header: ({ column }) => <DataGridColumnHeader title="ID" column={column} />,
        cell: ({ row }) => <ArtifactId id={row.original.artifact_id} />,
        size: 90,
      },
      {
        id: "time",
        accessorFn: (a) => a.timestamp ?? "",
        header: ({ column }) => <DataGridColumnHeader title="Time" column={column} />,
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{row.original.timestamp ? clock(row.original.timestamp) : "unknown"}</span>
        ),
        size: 80,
      },
      {
        accessorKey: "artifact_type",
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <ToneDot artifact={row.original} />
            {ARTIFACT_LABEL[row.original.artifact_type] ?? humanize(row.original.artifact_type)}
          </span>
        ),
        size: 160,
      },
      {
        accessorKey: "action",
        header: "Activity",
        cell: ({ row }) => humanize(row.original.action),
        size: 110,
      },
      {
        id: "subject",
        header: "File or device",
        accessorFn: (a) => a.filename ?? a.device ?? "",
        cell: ({ row }) => {
          const a = row.original
          return (
            <div className="min-w-0">
              <div className="truncate">{a.filename ?? a.device ?? "—"}</div>
              {a.path && (
                <div className={cn("truncate font-mono text-[0.7rem]", isDestination(a) ? "text-usb" : "text-muted-foreground")}>{a.path}</div>
              )}
            </div>
          )
        },
        size: 280,
      },
      {
        accessorKey: "experiment",
        header: ({ column }) => <DataGridColumnHeader title="Exp." column={column} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.experiment?.replace("EXP-", "") ?? "—"}</span>,
        size: 70,
      },
      {
        accessorKey: "classification",
        header: ({ column }) => <DataGridColumnHeader title="Class" column={column} />,
        cell: ({ row }) =>
          row.original.classification === "NORMAL" ? (
            <span className="text-xs text-muted-foreground">Normal</span>
          ) : (
            <Badge variant="destructive-light" size="sm">{humanize(row.original.classification)}</Badge>
          ),
        size: 140,
      },
      {
        accessorKey: "confidence",
        header: "Confidence",
        cell: ({ row }) => <ConfidenceBadge value={row.original.confidence} />,
        size: 100,
      },
    ],
    []
  )

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    pageCount: Math.ceil(rows.length / pagination.pageSize),
    getRowId: (a: Artifact) => a.artifact_id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })

  return (
    <>
      <PageHeader eyebrow="Evidence" title="Normalized artifacts">
        Every record imported from the forensic exports, in one common format. Select a row to compare the normalized fields with the untouched raw record.
      </PageHeader>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="artifact-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPagination((p) => ({ ...p, pageIndex: 0 }))
            }}
            placeholder="Search IDs, files, paths, sources…"
            className="pl-8"
            aria-label="Search artifacts"
          />
        </div>
        <Tabs value={experiment} onValueChange={(v) => setExperiment(String(v))}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="EXP-A">Experiment A</TabsTrigger>
            <TabsTrigger value="EXP-B">Experiment B</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType((cur) => (cur === t ? null : t))}
              className={cn(
                "h-7 rounded-full border px-2.5 text-xs transition-colors",
                type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={type === t}
            >
              {ARTIFACT_LABEL[t] ?? humanize(t)}
            </button>
          ))}
        </div>
      </div>

      <DataGrid
        table={table}
        recordCount={rows.length}
        onRowClick={(a: Artifact) => open(a.artifact_id)}
        emptyMessage="No artifacts match these filters."
        tableLayout={{ headerSticky: true, rowBorder: true, headerBackground: true }}
      >
        <div className="w-full space-y-2.5">
          <DataGridContainer>
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
          <DataGridPagination />
        </div>
      </DataGrid>

      <p className="mt-4 text-xs text-muted-foreground">
        Blue paths are destination-side records on the USB drive (<span className="font-mono">E:\</span>). Metadata rows describe the simulation and are not forensic evidence.
      </p>
    </>
  )
}
