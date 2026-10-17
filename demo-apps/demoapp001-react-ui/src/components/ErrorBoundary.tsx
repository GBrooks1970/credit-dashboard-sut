// version: 1 | created: 2026-10-18T09:00Z | project: credit-dashboard-sut | type: source | language: en-GB
// A page that throws while rendering must not leave an empty screen (CDS-38 R2-C-05): the customer is told, with a way to go on. It
// is keyed to the address (see App), so moving to another page clears it.
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Nothing personal is logged: the message and the component stack only.
    console.error('A page failed to render:', error.message, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="card" role="alert" data-testid="page-error">
        <h1>Something went wrong</h1>
        <p>This page could not be shown. Go back and try again, or choose another page from the menu.</p>
      </section>
    );
  }
}
