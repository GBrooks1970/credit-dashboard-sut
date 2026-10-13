// version: 1 | created: 2026-10-13T10:45Z | project: credit-dashboard-sut | type: source | language: en-GB
// The page frame (UI specification 4.4 and the header of 6.2): the demo banner above the header on every page, one
// primary navigation (a bottom tab bar below 768px, never both at once), and the account button labelled with the
// customer's greeting name (PR-03, DR-036).
import { useEffect, useState, type ReactNode } from 'react';
import { Link, Outlet } from 'react-router';
import { useSession } from '../session.tsx';

const MOBILE_QUERY = '(max-width: 767px)';

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
}

export function DemoBanner() {
  return (
    <div data-testid="demo-banner" className="demo-banner" role="note">
      Demo application: all data is fictional
    </div>
  );
}

function PrimaryNav({ mobile, reportPath }: { mobile: boolean; reportPath: string }) {
  const items: { key: string; label: string; to: string }[] = [{ key: 'report', label: 'Report', to: reportPath }];
  return (
    <nav aria-label="Primary" className={mobile ? 'nav-mobile' : 'nav-primary'}>
      {items.map((item) => (
        <Link key={item.key} to={item.to} data-testid={mobile ? `nav-mobile-${item.key}` : `nav-primary-${item.key}`}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function Header({ children }: { children?: ReactNode }) {
  const { user } = useSession();
  const mobile = useIsMobile();
  const reportPath = user ? `/credit-health/report/${user.defaultBureauId}` : '/login';
  return (
    <header className="app-header">
      <Link to={reportPath} data-testid="nav-logo" className="logo">
        ScoreHarbour
      </Link>
      {!mobile && <PrimaryNav mobile={false} reportPath={reportPath} />}
      <button type="button" data-testid="btn-account" className="account">
        {user?.greetingName}
      </button>
      {children}
    </header>
  );
}

/** The frame for every signed-in page. */
export function Layout() {
  const { user } = useSession();
  const mobile = useIsMobile();
  const reportPath = user ? `/credit-health/report/${user.defaultBureauId}` : '/login';
  return (
    <>
      <DemoBanner />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      {mobile && <PrimaryNav mobile reportPath={reportPath} />}
    </>
  );
}
