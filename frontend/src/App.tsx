/**
 * App root — SIRAGU Trace.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/auth';
import { DemoDataProvider } from '@/context/DemoDataContext';
import { RequireAuth, RequirePerm } from '@/router/guards';
import { AppShell } from './components/layout/AppShell';

import { LoginPage } from './pages/Login';
import { UnauthorizedPage } from './pages/Unauthorized';
import { RoleDashboard } from './role-homes/RoleDashboard';
import { Lots } from './workflows/processing/LotsPage';
import { TracePage } from './traceability/TracePage';
import { ReceivingPage } from './workflows/receiving/ReceivingPage';
import { ReleaseQueuePage } from './workflows/quality/ReleaseQueuePage';
import { PackagingPage } from './workflows/packaging/PackagingPage';
import { IotPage } from './environment/IotPage';
import { PublicQrPage } from './consumer/PublicQrPage';
import { LandingPage } from './pages/LandingPage';

// New architecture pages
import { BuyerAccessPage } from './buyer/BuyerAccessPage';
import { WarehouseInspectionPage } from './inventory/WarehouseInspectionPage';
import { CertificatesVaultPage } from './settings/CertificatesVaultPage';
import { SupplierAnalyticsPage } from './reports/SupplierAnalyticsPage';
import { DistributionPage } from './workflows/distribution/DistributionPage';
import { SharedDossierPage } from './buyer/SharedDossierPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DemoDataProvider>
          <Router>
            <Routes>
            {/* ── Public routes ── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/403" element={<UnauthorizedPage />} />
            <Route path="/verify/:serial" element={<PublicQrPage />} />
            <Route path="/shared-dossier/:token" element={<SharedDossierPage />} />

            {/* ── Protected routes — must be authenticated ── */}
            <Route element={<RequireAuth />}>
              <Route path="/app" element={<AppShell />}>
                
                {/* Home / Dashboards */}
                <Route element={<RequirePerm permission="view:dashboard" />}>
                  <Route path="dashboard" element={<RoleDashboard />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Operations & Processing */}
                <Route element={<RequirePerm permission="view:receiving" />}>
                  <Route path="operations/receiving" element={<ReceivingPage />} />
                </Route>
                <Route element={<RequirePerm permission="view:lots" />}>
                  <Route path="lots" element={<Lots />} />
                </Route>
                <Route element={<RequirePerm permission="view:packaging" />}>
                  <Route path="operations/packaging" element={<PackagingPage />} />
                </Route>
                <Route element={<RequirePerm permission="view:distribution" />}>
                  <Route path="distribution" element={<DistributionPage />} />
                </Route>
                
                {/* Quality & Inspections */}
                <Route element={<RequirePerm permission="trigger:release" />}>
                  <Route path="operations/release" element={<ReleaseQueuePage />} />
                </Route>
                <Route element={<RequirePerm permission="manage:inspections" />}>
                  <Route path="inventory/inspections" element={<WarehouseInspectionPage />} />
                </Route>

                {/* Traceability & IoT */}
                <Route element={<RequirePerm permission="view:trace" />}>
                  <Route path="trace" element={<TracePage />} />
                </Route>
                <Route element={<RequirePerm permission="view:iot" />}>
                  <Route path="iot" element={<IotPage />} />
                </Route>

                {/* Management & Reports */}
                <Route element={<RequirePerm permission="manage:buyers" />}>
                  <Route path="buyers" element={<BuyerAccessPage />} />
                </Route>
                <Route element={<RequirePerm permission="manage:certificates" />}>
                  <Route path="settings/certificates" element={<CertificatesVaultPage />} />
                </Route>
                <Route element={<RequirePerm permission="view:reports" />}>
                  <Route path="reports/suppliers" element={<SupplierAnalyticsPage />} />
                </Route>

              </Route>
            </Route>

            {/* ── 404 catch-all ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </DemoDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
