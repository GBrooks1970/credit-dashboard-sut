// version: 2 | created: 2026-10-13T10:20Z | project: credit-dashboard-sut | type: source | language: en-GB
// The summary (UI specification 6.2): the generated text, a route to the chat drawer and the impact section, and the
// like and dislike buttons. Feedback is stored by the service, so it survives a new visit (BR-10).
import { useEffect, useRef, useState } from 'react';
import type { components } from '@credit-dashboard-sut/api-client';
import { TEST_BUILD, flagOn } from '../../flags.tsx';
import { useLatest } from '../../useLatest.ts';
import { useSession } from '../../session.tsx';
import { ChatDrawer } from './ChatDrawer.tsx';

type Summary = components['schemas']['Summary'];
type Feedback = Summary['feedback'];

export function SummarySection({ bureauId, summary }: { bureauId: string; summary: Summary }) {
  const { client } = useSession();
  const [feedback, setFeedback] = useState<Feedback>(summary.feedback);
  const [chatOpen, setChatOpen] = useState(false);
  const [problem, setProblem] = useState(false);
  const chatButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const latest = useLatest();

  async function choose(value: 'like' | 'dislike') {
    // Pressing the chosen button again clears it.
    const next: Feedback = feedback === value ? 'none' : value;
    setProblem(false);
    // An answer to an earlier press must not replace what the customer pressed last (CDS-38 R2-C-02).
    const current = latest();
    try {
      const { data } = await client.PUT('/reports/{bureauId}/summary/feedback', { params: { path: { bureauId } }, body: { value: next } });
      if (!current()) return;
      if (data) setFeedback(data.value);
      else setProblem(true);
    } catch {
      if (current()) setProblem(true);
    }
  }

  // Focus goes back to the button that opened the drawer only after the drawer has gone: while it is open the rest of the page is
  // inert, and the drawer lifts that when its effect is cleaned up, which happens in the commit after the one that closes it. Focusing
  // in the click handler would try to focus an inert button, and a browser refuses (CDS-38 R2-C-01).
  function closeChat() {
    returnFocus.current = true;
    setChatOpen(false);
  }
  useEffect(() => {
    if (!chatOpen && returnFocus.current) {
      returnFocus.current = false;
      chatButton.current?.focus();
    }
  }, [chatOpen]);

  return (
    <section aria-labelledby="summary-heading" className="card">
      <h2 id="summary-heading">Summary</h2>
      <p data-testid="summary-text">{summary.text}</p>
      <p data-testid="ai-disclaimer" className="muted">
        This summary is generated for demonstration and is not financial advice.
      </p>
      <div className="actions">
        <button type="button" data-testid="btn-chat" ref={chatButton} onClick={() => setChatOpen(true)} aria-haspopup="dialog">
          Ask a question
        </button>
        <a href="#impact" data-testid="link-impact">
          See what affects your score
        </a>
        {/* The `like-both` bug flag (test build only; UI specification 8): once either is chosen, both read as pressed. */}
        <button type="button" data-testid="btn-like" aria-pressed={feedback === 'like' || (TEST_BUILD && flagOn('like-both') && feedback === 'dislike')} onClick={() => void choose('like')}>
          Helpful
        </button>
        <button type="button" data-testid="btn-dislike" aria-pressed={feedback === 'dislike' || (TEST_BUILD && flagOn('like-both') && feedback === 'like')} onClick={() => void choose('dislike')}>
          Not helpful
        </button>
      </div>
      {problem && <p role="alert">Your feedback could not be saved. Try again.</p>}
      <ChatDrawer open={chatOpen} onClose={closeChat} />
    </section>
  );
}
