import React, { useState } from "react";

type ApiResponseStart = { reply: string; done: false };
type ApiResponseContinue = { reply: string; done: false } | { reply: string; done: true; feedback: { summary: string; strengths: string[]; gaps: string[]; next: string[] } };

const apiBase = (import.meta.env as any).VITE_API_BASE_URL ?? ""; // empty string uses same origin (Vite dev server) which the proxy will forward to backend

export default function App() {
  const [sessionId, setSessionId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [question, setQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<ApiResponseContinue | null>(null);

  async function startInterview() {
    setError(null);
    if (!sessionId.trim()) {
      setError("Please enter a sessionId");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.trim(), candidate: { displayName: displayName.trim() } }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to start interview");
      } else {
        setQuestion(data.reply ?? null);
        setDone(false);
        setFeedback(null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer() {
    setError(null);
    if (!sessionId.trim()) {
      setError("sessionId missing");
      return;
    }
    if (!message.trim()) {
      setError("Please enter your answer");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId.trim(), message: message.trim() }),
      });
      const data: ApiResponseContinue = await res.json();
      if (!res.ok) {
        setError(data?.(data as any).error || "Failed to submit answer");
      } else {
        if ((data as any).done === true) {
          setDone(true);
          setFeedback(data as ApiResponseContinue);
          setQuestion(null);
        } else {
          setQuestion(data.reply);
        }
        setMessage("");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1>AI Interview Agent</h1>

      <section style={{ marginBottom: 20 }}>
        <h2>Session</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input placeholder="sessionId" value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
          <input placeholder="Your display name (optional)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <button onClick={startInterview} disabled={loading}>Start</button>
        </div>
      </section>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {!done && question && (
        <section style={{ marginTop: 20 }}>
          <h2>Interviewer</h2>
          <div style={{ background: "#f7f7f8", padding: 12, borderRadius: 6 }}>{question}</div>

          <h3 style={{ marginTop: 12 }}>Your answer</h3>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} style={{ width: "100%" }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={submitAnswer} disabled={loading}>Submit Answer</button>
          </div>
        </section>
      )}

      {done && feedback && (
        <section style={{ marginTop: 20 }}>
          <h2>Interview completed</h2>
          <div>
            <strong>Summary</strong>
            <p>{feedback.feedback?.summary ?? (feedback as any).summary}</p>
            <strong>Strengths</strong>
            <ul>{(feedback as any).strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
            <strong>Gaps</strong>
            <ul>{(feedback as any).gaps?.map((g: string, i: number) => <li key={i}>{g}</li>)}</ul>
            <strong>Next</strong>
            <ul>{(feedback as any).next?.map((n: string, i: number) => <li key={i}>{n}</li>)}</ul>
          </div>
        </section>
      )}

      <footer style={{ marginTop: 40, color: "#666" }}>
        <small>Development UI — connects to {apiBase}/api/interview</small>
      </footer>
    </div>
  );
}
