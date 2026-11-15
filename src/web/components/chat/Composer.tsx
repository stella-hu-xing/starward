import { useEffect, useRef } from 'react';

interface ComposerProps {
  value: string;
  /** While a reply streams, the composer blocks new turns (one active turn per conversation). */
  disabled: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

export default function Composer({ value, disabled, onChange, onSend }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea with the text, capped so long drafts scroll instead.
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <form
      className="chat-composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      <div className="composer-row">
        <textarea
          aria-label="Message"
          className="composer-input"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder={
            disabled
              ? 'Wait for the reply to finish…'
              : 'Message Starward (Shift+Enter for a new line)'
          }
          ref={textareaRef}
          rows={1}
          value={value}
        />
        <button
          aria-label="Send message"
          className="btn btn-send"
          disabled={disabled || value.trim().length === 0}
          type="submit"
        >
          Send
        </button>
        <button
          className="btn-icon btn-mic"
          disabled
          title="Push-to-talk voice input arrives with M2"
          type="button"
        >
          🎙
        </button>
      </div>
    </form>
  );
}
