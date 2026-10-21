import { useEffect, useState, type ReactNode } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  Beaker,
  ClipboardList,
  Clock3,
  FileText,
  FolderSearch,
  Gauge,
  GitMerge,
  HardDrive,
  Moon,
  Scale,
  Settings2,
  ShieldCheck,
  Sun,
  TriangleAlert,
  Usb,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { EvidenceDrawerProvider } from "@/components/evidence"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useCase, type CaseData } from "@/lib/case-data"

type NavItem = { to: string; label: string; icon: typeof Gauge; count?: (d: CaseData) => number }

const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Case", items: [{ to: "/", label: "Overview", icon: Gauge }] },
  {
    group: "Evidence",
    items: [
      { to: "/artifacts", label: "Artifacts", icon: FolderSearch, count: (d) => d.artifacts.length },
      { to: "/devices", label: "USB devices", icon: Usb, count: (d) => d.devices.length },
      { to: "/files", label: "Sensitive files", icon: HardDrive, count: (d) => d.files.length },
      { to: "/timeline", label: "Timeline", icon: Clock3 },
    ],
  },
  {
    group: "Analysis",
    items: [
      { to: "/correlations", label: "Correlations", icon: GitMerge, count: (d) => d.correlations.length },
      { to: "/hypotheses", label: "Hypotheses", icon: Scale, count: (d) => d.hypotheses.length },
      { to: "/experiments", label: "Experiments A/B", icon: Beaker },
    ],
  },
  {
    group: "Integrity & output",
    items: [
      { to: "/custody", label: "Chain of custody", icon: ShieldCheck },
      { to: "/reports", label: "Reports", icon: FileText, count: (d) => d.reports.length },
      { to: "/settings", label: "Method & settings", icon: Settings2 },
    ],
  },
]

function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("forensics-theme")
      if (saved) return saved === "dark"
    } catch {
      /* storage can be unavailable; fall back to the system preference */
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
  })
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    try {
      localStorage.setItem("forensics-theme", dark ? "dark" : "light")
    } catch {
      /* ignore */
    }
  }, [dark])
  return [dark, () => setDark((d) => !d)] as const
}

export function AppShell() {
  const { data, error, reload } = useCase()
  const [dark, toggleTheme] = useTheme()
  const { pathname } = useLocation()

  useEffect(() => window.scrollTo(0, 0), [pathname])

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="inset">
          <SidebarHeader>
            <div className="flex items-center gap-2.5 px-1.5 py-1">
              <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                <ClipboardList className="size-4" />
              </div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="truncate text-sm font-semibold">USB Insider Forensics</div>
                <div className="truncate font-mono text-[0.7rem] text-muted-foreground">{data?.case.case_id ?? "Loading case"}</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {NAV.map((section) => (
              <SidebarGroup key={section.group}>
                <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)
                      return (
                        <SidebarMenuItem key={item.to}>
                          <SidebarMenuButton isActive={active} tooltip={item.label} render={<NavLink to={item.to} end={item.to === "/"} />}>
                            <item.icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                          {data && item.count && <SidebarMenuBadge className="font-mono tabular-nums">{item.count(data)}</SidebarMenuBadge>}
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <div className="rounded-md border border-dashed border-clue/50 bg-clue/5 px-2.5 py-2 text-[0.7rem] leading-snug text-muted-foreground group-data-[collapsible=icon]:hidden">
              Educational exercise. All company files and data are fictional.
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-backdrop-filter:bg-background/70">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <div className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {data ? (
                <>
                  {/* Real evidence names its own host and user; the scenario dataset uses the configured fictional ones. */}
                  <span className="text-foreground">{data.artifacts.find((a) => a.host)?.host ?? data.settings.victim.hostname}</span> ·{" "}
                  {data.artifacts.find((a) => a.user)?.user ?? data.settings.victim.username} · USB{" "}
                  <span className="font-mono text-xs">
                    {data.devices.find((d) => !d.name.includes(" "))?.name ?? data.devices[0]?.name ?? data.settings.usb.expected_label}
                  </span>
                </>
              ) : (
                "Loading case…"
              )}
            </div>
            {data?.evidence.some((e) => e.evidence_id.startsWith("EVD-DEMO")) ? (
              <Badge variant="warning-light" className="hidden sm:inline-flex">
                Synthetic demonstration data
              </Badge>
            ) : data ? (
              <Badge variant="success-light" className="hidden sm:inline-flex">
                Real collected evidence
              </Badge>
            ) : null}
            <Button variant="ghost" size="icon-sm" onClick={toggleTheme} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
              {dark ? <Sun /> : <Moon />}
            </Button>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
            {error ? (
              <Alert variant="destructive" className="max-w-xl">
                <TriangleAlert />
                <AlertTitle>The case data could not be loaded</AlertTitle>
                <AlertDescription>
                  {error} Make sure the Flask server is running (<code className="font-mono">.\start_demo.ps1</code>), then{" "}
                  <button type="button" className="underline" onClick={reload}>
                    try again
                  </button>
                  .
                </AlertDescription>
              </Alert>
            ) : data ? (
              <EvidenceDrawerProvider>
                <Outlet />
              </EvidenceDrawerProvider>
            ) : (
              <LoadingState />
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-3xl flex-col gap-1.5">
        <span className="font-mono text-[0.7rem] font-medium tracking-[0.14em] text-primary uppercase">{eyebrow}</span>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-[1.75rem]">{title}</h1>
        {children && <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{children}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}
