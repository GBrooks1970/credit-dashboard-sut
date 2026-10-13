// version: 1 | created: 2026-10-13T10:20Z | project: credit-dashboard-sut | type: source | language: en-GB
// A page in the catalogue that a later slice builds (CDS-33 to CDS-35). A signed-in customer who follows a link to it
// sees this, not the sign-in page.
import { useLocation } from 'react-router';

export function NotBuiltPage() {
  const { pathname } = useLocation();
  return (
    <section data-testid="page-not-built">
      <h1>This page is not built yet</h1>
      <p>
        <code>{pathname}</code> is part of the specification and arrives in a later release of this demonstration.
      </p>
    </section>
  );
}
