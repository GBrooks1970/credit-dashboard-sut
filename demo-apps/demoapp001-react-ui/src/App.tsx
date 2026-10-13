// version: 1 | created: 2026-10-13T10:45Z | project: credit-dashboard-sut | type: source | language: en-GB
// Routes (UI specification section 5). A page that needs a session sends an anonymous visitor to /login, which is what
// a reload does: the token is in memory only.
import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './layout/Layout.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { NotBuiltPage } from './pages/NotBuiltPage.tsx';
import { ReportOverviewPage } from './pages/ReportOverviewPage.tsx';
import { useSession } from './session.tsx';

function RequireSession() {
  const { signedIn } = useSession();
  return signedIn ? <Layout /> : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireSession />}>
        <Route path="/credit-health/report/:bureauId" element={<ReportOverviewPage />} />
        {/* Pages that later slices build. An anonymous visitor never reaches this: RequireSession sends them to /login. */}
        <Route path="*" element={<NotBuiltPage />} />
      </Route>
    </Routes>
  );
}
