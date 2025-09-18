"use client";

import React, { useState } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "@tensorflow/tfjs";

async function askLangChain(question: string, setAnswer: (s: string) => void) {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let answer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    answer += decoder.decode(value, { stream: true });
    setAnswer(answer);
  }
}

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setAnswer("");
    setLoading(true);
    await askLangChain(question, setAnswer);
    setLoading(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      setLoading(true);
      setAnswer("");

      const model = await mobilenet.load();
      const results = await model.classify(img);
      const label = results[0].className;

      const q = `I have an image of ${label}. Tell me something interesting about it.`;

      await askLangChain(q, setAnswer);
      setLoading(false);
    };
  }

  return (
    <div className="max-w-xl mx-auto p-4 border rounded">
      <h1 className="text-xl font-bold mb-4">AI Chat (Text + Image)</h1>

      <form onSubmit={handleSubmit} className="flex mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 border px-2 py-1 rounded-l"
          placeholder="Ask a question..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded-r"
        >
          Ask
        </button>
      </form>

      <div className="mb-4">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      {loading && <p>Thinking...</p>}
      {answer && (
        <div className="mt-4 p-2 text-black border rounded bg-gray-50">
          <strong>AI says:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
