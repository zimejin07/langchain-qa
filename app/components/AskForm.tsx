"use client";
import { useState } from "react";

export default function AskForm() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res?.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question"
        />
        <button type="submit">{loading ? "Thinking..." : "Ask"}</button>
      </form>
      {answer && <p>Answer: {answer}</p>}
    </div>
  );
}
