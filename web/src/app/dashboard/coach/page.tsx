"use client";

import { useEffect, useState, useRef } from "react";
import api, { ChatHistoryMessage } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  source?: string;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! I'm your AI Market Coach powered by Gemini.\n\nI can help you understand:\n\u2022 Market trends & analysis\n\u2022 Technical indicators (RSI, MACD, etc.)\n\u2022 Investment concepts & strategies\n\u2022 Risk management principles\n\u2022 Portfolio diversification\n\nWhat would you like to learn about today?",
      timestamp: new Date(),
      source: "system",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "AI Coach — VedoraAI"; }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const quickQuestions = [
    "What is RSI?",
    "Explain P/E ratio",
    "How to read candlestick charts?",
    "What is dollar cost averaging?",
    "Risk management tips",
    "What is MACD?",
  ];

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    const userMessage: Message = { role: "user", content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Build history for the API (exclude system welcome message)
      const history: ChatHistoryMessage[] = messages
        .filter((m) => m.source !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await api.chatWithCoach(msg, history);

      if (result.ok && result.data?.response) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.data.response,
            timestamp: new Date(),
            source: result.data.source,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I apologize, but I encountered an error: ${result.error || "Unknown error"}.\n\nPlease make sure the backend is running and try again.`,
            timestamp: new Date(),
            source: "error",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error — please check that the backend server is running at localhost:8000.",
          timestamp: new Date(),
          source: "error",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Format markdown-like content to simple HTML
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 className="dash-welcome-title">AI Market Coach</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--bullish)",
            animation: "pulse-glow 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Powered by Gemini</span>
        </div>
      </div>

      {/* Chat Area */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          paddingBottom: 16,
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              style={{
                maxWidth: "78%",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                  : "var(--surface)",
                border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                color: "var(--text-primary)",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
              {msg.role === "assistant" && msg.source && msg.source !== "system" && (
                <div style={{
                  marginTop: 8,
                  paddingTop: 6,
                  borderTop: "1px solid var(--border)",
                  fontSize: 10,
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: msg.source === "gemini" ? "var(--bullish)" : msg.source === "error" ? "var(--bearish)" : "var(--neutral-color)",
                    display: "inline-block",
                  }} />
                  {msg.source === "gemini" ? "Gemini AI" : msg.source === "fallback" ? "Built-in Knowledge" : msg.source}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "12px 20px",
                borderRadius: "16px 16px 16px 4px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                fontSize: 14,
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "var(--primary)",
                      animation: `pulse-glow 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            disabled={isTyping}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 500,
              cursor: isTyping ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isTyping ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { if (!isTyping) { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary-light)"; }}}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 14,
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask me anything about markets..."
          disabled={isTyping}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: 14,
            fontFamily: "var(--font-body)",
            opacity: isTyping ? 0.6 : 1,
          }}
        />
        <button
          onClick={() => handleSend()}
          className="btn btn-primary btn-sm"
          disabled={!input.trim() || isTyping}
          style={{
            padding: "6px 16px",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {isTyping ? "..." : "Send"}
        </button>
      </div>

      <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", marginTop: 8, paddingBottom: 4 }}>
        AI Coach provides educational content only — not financial advice
      </div>
    </div>
  );
}
