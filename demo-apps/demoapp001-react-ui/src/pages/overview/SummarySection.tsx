// version: 1 | created: 2026-10-13T10:20Z | project: credit-dashboard-sut | type: source | language: en-GB
// The summary (UI specification 6.2): the generated text, a route to the chat drawer and the impact section, and the
// like and dislike buttons. Feedback is stored by the service, so it survives a new visit (BR-10).
import { useRef, useState } from 'react';
import type { components } from '@credit-dashboard-sut/api-client';
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

  async function choose(value: 'like' | 'dislike') {
    // Pressing the chosen button again clears it.
    const next: Feedback = feedback === value ? 'none' : value;
    setProblem(false);
    try {
      const { data } = await client.PUT('/reports/{bureauId}/summary/feedback', { params: { path: { bureauId } }, body: { value: next } });
      if (data) setFeedback(data.value);
      else setProblem(true);
    } catch {
      setProblem(true);
    }
  }

  function closeChat() {
    setChatOpen(false);
    chatButton.current?.focus();
  }

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
        <button type="button" data-testid="btn-like" aria-pressed={feedback === 'like'} onClick={() => void choose('like')}>
          Helpful
        </button>
        <button type="button" data-testid="btn-dislike" aria-pressed={feedback === 'dislike'} onClick={() => void choose('dislike')}>
          Not helpful
        </button>
      </div>
      {problem && <p role="alert">Your feedback could not be saved. Try again.</p>}
      <ChatDrawer open={chatOpen} onClose={closeChat} />
    </section>
  );
}
