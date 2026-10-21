import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppShell } from "@/components/app-shell"
import { CaseDataProvider } from "@/lib/case-data"
import { CorrelationsPage, ExperimentsPage, HypothesesPage } from "@/pages/analysis"
import { ArtifactsPage } from "@/pages/artifacts"
import { DevicesPage, FilesPage } from "@/pages/evidence"
import { CustodyPage, ReportsPage, SettingsPage } from "@/pages/integrity"
import { OverviewPage } from "@/pages/overview"
import { TimelinePage } from "@/pages/timeline"

// Routes mirror the Flask page URLs, so links from the docs and the classic dashboard keep working.
export default function App() {
  return (
    <CaseDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="artifacts" element={<ArtifactsPage />} />
            <Route path="artifact/:id" element={<ArtifactsPage />} />
            <Route path="devices" element={<DevicesPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="correlations" element={<CorrelationsPage />} />
            <Route path="hypotheses" element={<HypothesesPage />} />
            <Route path="experiments" element={<ExperimentsPage />} />
            <Route path="custody" element={<CustodyPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CaseDataProvider>
  )
}
