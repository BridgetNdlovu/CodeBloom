import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import type { AIMessage } from "../../types";
import { sendAIMessage } from "../../services/aiService";
import { Button } from "../ui/Button";

const SUGGESTED_PROMPTS = [
  "Give me a hint.",
  "Explain this coding idea.",
  "What could I try next?",
];

interface AIHelperPanelProps {
  open: boolean;
  onClose: () => void;
  missionKey?: string;
  programJson?: string;
  initialMessages?: AIMessage[];
}

export function AIHelperPanel({
  open,
  onClose,
  missionKey,
  programJson,
  initialMessages = [],
}: AIHelperPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setError(undefined);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking, open]);

  if (!open) {
    return null;
  }

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking) return;
    setInput("");
    setError(undefined);
    const learnerMessage: AIMessage = {
      id: `learner-${Date.now()}`,
      sender: "learner",
      text,
      at: new Date().toISOString(),
    };
    setMessages((current) => [...current, learnerMessage]);
    setThinking(true);
    try {
      const reply = await sendAIMessage(text, missionKey, programJson);
      setMessages((current) => [...current, reply]);
    } catch {
      setError("The coach could not reply right now. Please try again in a moment.");
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="cb-ai-panel" data-open={open}>
      <div className="cb-ai-panel-header">
        <span className="cb-ai-avatar" aria-hidden>
          <Bot size={20} />
        </span>
        <div>
          <strong>Bloom's Coach</strong>
          <small className="cb-muted">Friendly coding helper</small>
        </div>
        <button
          type="button"
          className="cb-icon-btn"
          onClick={onClose}
          aria-label="Close AI helper"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="cb-chat-messages" aria-live="polite">
        {messages.length === 0 ? (
          <p
            className="cb-body-text"
            style={{ textAlign: "center", marginTop: "var(--cb-space-6)" }}
          >
            Hi! I'm Bloom's Coach. Ask me anything about your mission.
          </p>
        ) : null}
        {messages.map((m) => (
          <div key={m.id} className={`cb-chat-message ${m.sender}`}>
            {m.text}
          </div>
        ))}
        {thinking ? (
          <div className="cb-chat-message assistant" data-thinking>
            Bloom's Coach is thinking…
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="cb-field-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="cb-chat-input-row">
        <input
          className="cb-input"
          style={{ borderRadius: "var(--cb-radius-pill)", minHeight: 44 }}
          placeholder="Ask for help…"
          value={input}
          aria-label="Ask Bloom's Coach a question"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => void send()}
          disabled={thinking || !input.trim()}
          aria-label="Send message"
        >
          <Send size={16} aria-hidden />
        </Button>
      </div>

      <div className="cb-chat-suggestions">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            className="cb-chip"
            onClick={() => void send(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
