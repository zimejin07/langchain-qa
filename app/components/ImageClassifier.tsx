"use client";
import React, { useEffect, useRef, useState } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";

export default function ImageClassifier() {
  const [model, setModel] = useState<any>(null);
  const [preds, setPreds] = useState<any[]>([]);
  const [answer, setAnswer] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url); // React will render <img> with this src
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
    <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 md:p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Image Uploader & Predictor
          </h2>

          {/* File Input */}
          <div className="mb-8">
            <label
              htmlFor="file-upload"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload an image:
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-8 border-2 border-dashed border-gray-300 rounded-lg p-4 flex justify-center items-center overflow-hidden">
              <img
                ref={imgRef}
                src={imagePreview}
                alt="Uploaded preview"
                className="max-w-full h-auto max-h-96 rounded-md shadow-md"
                onLoad={() => {
                  classifyAndQuery();
                  URL.revokeObjectURL(imagePreview);
                }} // Trigger classification upon load
              />
            </div>
          )}

          {/* Prediction Results */}
          {preds && preds.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Prediction Results:
              </h3>
              <ul className="space-y-3">
                {preds.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg shadow-sm"
                  >
                    <span className="text-blue-800 font-medium">
                      {i + 1}. {p.className}
                    </span>
                    <span className="text-blue-600 font-bold">
                      {(p.probability * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Answer/Additional Info */}
          {answer && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-gray-800 text-sm overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Additional Information:
              </h3>
              <pre className="whitespace-pre-wrap font-mono">{answer}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
