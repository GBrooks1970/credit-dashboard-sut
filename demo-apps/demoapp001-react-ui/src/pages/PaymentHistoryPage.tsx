// version: 1 | created: 2026-10-13T13:50Z | project: credit-dashboard-sut | type: source | language: en-GB
// Payment history (UI specification 6.3), for a whole report.
import { useParams } from 'react-router';
import { PaymentHistoryWidget } from '../components/PaymentHistoryWidget.tsx';

export function PaymentHistoryPage() {
  const { bureauId = '' } = useParams();
  return <PaymentHistoryWidget bureauId={bureauId} />;
}
