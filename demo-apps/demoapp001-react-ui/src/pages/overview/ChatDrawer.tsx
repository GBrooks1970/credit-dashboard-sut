// version: 2 | created: 2026-10-13T10:20Z | project: credit-dashboard-sut | type: source | language: en-GB
// The chat drawer (UI specification section 7): a dialog with a focus trap, closed by Escape, that returns focus to the
// button that opened it. The assistant is a mock with canned replies and always carries its disclaimer.
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useLatest } from '../../useLatest.ts';
import { useSession } from '../../session.tsx';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChatDrawer({ open, onClose }: Props) {
  const { client } = useSession();
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [exchange, setExchange] = useState<{ asked: string; reply: string; disclaimer: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const latest = useLatest();

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  // `aria-modal` is only a hint; a screen reader's virtual cursor can still leave the dialog. While the drawer is open every
  // element outside it is made inert, level by level up to the body, and put back when it closes (CDS-38 C-25).
  useEffect(() => {
    if (!open || !panel.current) return;
    const made: Element[] = [];
    for (let node: Element = panel.current; node.parentElement && node !== document.body; node = node.parentElement) {
      for (const sibling of Array.from(node.parentElement.children)) {
        if (sibling !== node && !sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '');
          made.push(sibling);
        }
      }
    }
    return () => made.forEach((element) => element.removeAttribute('inert'));
  }, [open]);

  if (!open) return null;

  async function send(event: FormEvent) {
    event.preventDefault();
    const asked = message.trim();
    if (!asked) return;
    setFailed(false);
    // A slow answer to an earlier question must not replace the answer to the one asked last (CDS-38 R2-C-02).
    const current = latest();
    try {
      const { data } = await client.POST('/assistant/messages', { body: { message: asked } });
      if (!current()) return;
      if (data) {
        setExchange({ asked, reply: data.reply, disclaimer: data.disclaimer });
        setMessage('');
      } else {
        setFailed(true);
      }
    } catch {
      if (current()) setFailed(true);
    }
  }

  function keys(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panel.current) return;
    // Keep focus inside the dialog.
    const focusable = panel.current.querySelectorAll<HTMLElement>('button, input, [href]');
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="chat-title" data-testid="chat-drawer" className="chat-drawer" ref={panel} onKeyDown={keys}>
      <h2 id="chat-title">Ask about your report</h2>
      <form onSubmit={send}>
        <label htmlFor="chat-input">Your question</label>
        <input id="chat-input" data-testid="chat-input" ref={input} value={message} maxLength={500} onChange={(e) => setMessage(e.target.value)} />
        <button type="submit" data-testid="chat-send">
          Send
        </button>
      </form>
      {exchange && (
        <div data-testid="chat-exchange" aria-live="polite">
          <p>You asked: {exchange.asked}</p>
          <p data-testid="chat-reply">{exchange.reply}</p>
          <p data-testid="chat-disclaimer" className="muted">
            {exchange.disclaimer}
          </p>
        </div>
      )}
      {failed && <p role="alert">The assistant could not answer. Try again.</p>}
      <button type="button" data-testid="chat-close" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
