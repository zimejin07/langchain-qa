"use client";
import React, { useEffect, useRef, useState } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";

export default function ImageClassifier() {
  const [model, setModel] = useState<any>(null);
  const [preds, setPreds] = useState<any[]>([]);
  const [answer, setAnswer] = useState("");
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    (async () => {
      // Try load cached model from IndexedDB first
      try {
        const loaded = await tf.loadLayersModel("indexeddb://mobilenet-v1");
        // @ts-ignore
        setModel({ model: loaded });
        return;
      } catch {}
      const m = await mobilenet.load({ version: 2, alpha: 1.0 });
      // attempt to save underlying layers model to IndexedDB for later reuse
      try {
        // @ts-ignore mobilenet returns an object with .model (tf.LayersModel)
        if (m?.model?.save) await m.model.save("indexeddb://mobilenet-v1");
      } catch {}
      setModel(m);
    })();
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    if (imgRef.current) imgRef.current.src = url;
    // small delay to ensure img loaded
    await new Promise((r) => setTimeout(r, 200));
    await classifyAndQuery();
  }

  async function classifyAndQuery() {
    if (!model || !imgRef.current) return;
    const topk = 3;
    const classifications = await model.classify(imgRef.current, topk);
    setPreds(classifications); // each has className and probability
    // get embedding via infer (activation). mobilenet supports infer(image, 'conv_preds') or boolean flag.
    // convert tensor to Float32Array
    // @ts-ignore
    const activation = model.infer(imgRef.current, "conv_preds");
    const arr = await activation.data();
    const embedding = Array.from(arr as Float32Array);

    // send to backend and stream the response
    const question = `What can you tell me about this ${
      classifications[0]?.className ?? "object"
    }?`;
    const resp = await fetch("/api/query-rag", {
      method: "POST",
      body: JSON.stringify({
        embedding,
        question,
        label: classifications[0]?.className,
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (!resp.body) return;
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let partial = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      partial += decoder.decode(value, { stream: true });
      setAnswer(partial);
    }
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFile} />
      <img ref={imgRef} alt="upload" style={{ maxWidth: 400 }} />
      <div>
        {preds.map((p, i) => (
          <div key={i}>
            {i + 1}. {p.className} — {(p.probability * 100).toFixed(1)}%
          </div>
        ))}
      </div>
      <pre>{answer}</pre>
    </div>
  );
}
