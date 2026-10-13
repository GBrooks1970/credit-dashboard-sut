// version: 1 | created: 2026-10-13T10:45Z | project: credit-dashboard-sut | type: source | language: en-GB
// Routes (UI specification section 5). A page that needs a session sends an anonymous visitor to /login, which is what
// a reload does: the token is in memory only.
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { Layout } from './layout/Layout.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { AccountDetailPage } from './pages/AccountDetailPage.tsx';
import { AccountListPage } from './pages/AccountListPage.tsx';
import { ClosedAccountsPage } from './pages/ClosedAccountsPage.tsx';
import { EmailPage } from './pages/profile/EmailPage.tsx';
import { MobilePage } from './pages/profile/MobilePage.tsx';
import { ProfilePage } from './pages/profile/ProfilePage.tsx';
import { DetailFormPage } from './pages/DetailFormPage.tsx';
import { DebtOverviewPage } from './pages/DebtOverviewPage.tsx';
import { NotBuiltPage } from './pages/NotBuiltPage.tsx';
import { PaymentHistoryPage } from './pages/PaymentHistoryPage.tsx';
import { PersonalDetailsPage } from './pages/PersonalDetailsPage.tsx';
import { ReportChangesPage } from './pages/ReportChangesPage.tsx';
import { SearchesPage } from './pages/SearchesPage.tsx';
import { ReportOverviewPage } from './pages/ReportOverviewPage.tsx';
import { useSession } from './session.tsx';

function RequireSession() {
  const { signedIn } = useSession();
  const location = useLocation();
  // An anonymous visitor signs in, then is taken to the address they asked for (a narrowed list opened again from its address).
  return signedIn ? <Layout /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireSession />}>
        <Route path="/credit-health/report/:bureauId" element={<ReportOverviewPage />} />
        <Route path="/credit-health/report/:bureauId/payment-history" element={<PaymentHistoryPage />} />
        <Route path="/credit-health/report/:bureauId/searches/:kind" element={<SearchesPage />} />
        <Route path="/credit-health/report/:bureauId/personal-details" element={<PersonalDetailsPage />} />
        <Route path="/credit-health/debt-overview" element={<DebtOverviewPage />} />
        <Route path="/insights/updates" element={<ReportChangesPage />} />
        <Route path="/credit-health/report/:bureauId/accounts/:type" element={<AccountListPage />} />
        <Route path="/credit-health/report/:bureauId/account/:accountId" element={<AccountDetailPage />} />
        <Route path="/credit-health/report/:bureauId/closed-accounts" element={<ClosedAccountsPage />} />
        <Route path="/data-capture/:field" element={<DetailFormPage />} />
        <Route path="/my-account/profile" element={<ProfilePage />} />
        <Route path="/my-account/profile/email" element={<EmailPage />} />
        <Route path="/my-account/profile/mobile" element={<MobilePage />} />
        {/* Pages that later slices build. An anonymous visitor never reaches this: RequireSession sends them to /login. */}
        <Route path="*" element={<NotBuiltPage />} />
      </Route>
    </Routes>
  );
}
