// version: 1 | created: 2026-10-13T13:50Z | project: credit-dashboard-sut | type: source | language: en-GB
// Pagination for lists (UI specification 6.7): `pager-prev`, `pager-next`, `pager-status`. With one page there is no next page.
interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}

export function Pager({ page, pageSize, total, onPage }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav aria-label="Pages" className="pager">
      <button type="button" data-testid="pager-prev" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span data-testid="pager-status" aria-live="polite">
        Page {page} of {pages}
      </span>
      <button type="button" data-testid="pager-next" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  );
}
