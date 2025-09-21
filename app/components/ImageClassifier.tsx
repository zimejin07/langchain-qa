"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  Brain,
  Search,
  Loader2,
  Camera,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";

export default function ImageClassifier() {
  const [model, setModel] = useState<any>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [preds, setPreds] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadModel();
  }, []);

  async function loadModel() {
    try {
      setModelLoading(true);
      setError(null);

      // Try load cached model from IndexedDB first
      try {
        const loaded = await tf.loadLayersModel("indexeddb://mobilenet-v1");
        setModel({ model: loaded });
        console.log("Loaded cached model from IndexedDB");
        return;
      } catch {
        console.log("No cached model found, loading fresh model...");
      }

      const m = await mobilenet.load({ version: 2, alpha: 1.0 });

      // Attempt to save underlying layers model to IndexedDB for later reuse
      try {
        // @ts-ignore mobilenet returns an object with .model (tf.LayersModel)
        if (m?.model?.save) {
          // @ts-ignore mobilenet returns an object with .model (tf.LayersModel)
          await m.model.save("indexeddb://mobilenet-v1");
          console.log("Model cached to IndexedDB");
        }
      } catch (cacheError) {
        console.warn("Failed to cache model:", cacheError);
      }

      setModel(m);
    } catch (error) {
      console.error("Failed to load model:", error);
      setError(
        "Failed to load AI model. Please refresh the page to try again."
      );
    } finally {
      setModelLoading(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError(
        "Image file is too large. Please select a file smaller than 10MB."
      );
      return;
    }

    setError(null);
    setPreds([]);
    setAnswer("");

    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  // async function classifyAndQuery() {
  //   if (!model || !imgRef.current || !question.trim()) return;

  //   setIsProcessing(true);
  //   setError(null);

  //   try {
  //     const topk = 3;
  //     const classifications = await model.classify(imgRef.current, topk);
  //     setPreds(classifications);

  //     // Get embedding via infer
  //     const activation = model.infer(imgRef.current, "conv_preds");
  //     const arr = await activation.data();
  //     const embedding = Array.from(arr as Float32Array);

  //     // Clean up tensor
  //     activation.dispose();

  //     const resp = await fetch("/api/query-rag", {
  //       method: "POST",
  //       body: JSON.stringify({
  //         embedding,
  //         question: question.trim(),
  //         label: classifications[0]?.className,
  //       }),
  //       headers: { "Content-Type": "application/json" },
  //     });

  //     if (!resp.ok) {
  //       throw new Error(
  //         `API request failed: ${resp.status} ${resp.statusText}`
  //       );
  //     }

  //     if (!resp.body) {
  //       throw new Error("No response body received");
  //     }

  //     const reader = resp.body.getReader();
  //     const decoder = new TextDecoder();
  //     let partial = "";

  //     while (true) {
  //       const { done, value } = await reader.read();
  //       if (done) break;
  //       partial += decoder.decode(value, { stream: true });
  //       setAnswer(partial);
  //     }
  //   } catch (error) {
  //     console.error("Classification/Query error:", error);
  //     setError(
  //       error instanceof Error
  //         ? error.message
  //         : "Failed to process image and query"
  //     );
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // }
  // Replace your classifyAndQuery function with this:

  async function classifyAndQuery() {
    if (!model || !imgRef.current || !question.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const topk = 3;
      const classifications = await model.classify(imgRef.current, topk);
      setPreds(classifications);

      // Get the top classification
      const topClassification =
        classifications[0]?.className || "unknown object";

      // FIXED: Generate OpenAI-compatible embedding instead of TensorFlow embedding
      const compatibleEmbedding = await generateCompatibleEmbedding(
        topClassification,
        question.trim()
      );

      console.log(
        "Generated compatible embedding with dimensions:",
        compatibleEmbedding.length
      );

      const resp = await fetch("/api/query-rag", {
        method: "POST",
        body: JSON.stringify({
          embedding: compatibleEmbedding, // Now using 1536-dimensional embedding
          question: question.trim(),
          label: topClassification,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!resp.ok) {
        throw new Error(
          `API request failed: ${resp.status} ${resp.statusText}`
        );
      }

      if (!resp.body) {
        throw new Error("No response body received");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let partial = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partial += decoder.decode(value, { stream: true });
        setAnswer(partial);
      }
    } catch (error) {
      console.error("Classification/Query error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process image and query"
      );
    } finally {
      setIsProcessing(false);
    }
  }

  // Add this helper function to your component:
  async function generateCompatibleEmbedding(
    imageClassification: string,
    questionText: string
  ): Promise<number[]> {
    try {
      // Combine image classification with question for better context
      const combinedText = `Image contains: ${imageClassification}. Question: ${questionText}`;

      // Call OpenAI embeddings API to get 1536-dimensional embedding
      const response = await fetch("/api/generate-embedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: combinedText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Embedding API failed: ${response.status}`
        );
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error("Error generating compatible embedding:", error);
      throw new Error("Failed to generate embedding for RAG search");
    }
  }

  async function handleSubmit(e?: React.FormEvent | React.KeyboardEvent) {
    if (e) {
      e.preventDefault();
    }

    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    if (!imagePreview) {
      setError("Please upload an image first.");
      return;
    }

    if (!model) {
      setError("AI model is not loaded yet. Please wait and try again.");
      return;
    }

    // Ensure image is loaded before processing
    if (imgRef.current?.complete) {
      await classifyAndQuery();
    } else {
      // Wait for image to load
      const handleLoad = () => {
        classifyAndQuery();
        imgRef.current?.removeEventListener("load", handleLoad);
      };
      imgRef.current?.addEventListener("load", handleLoad);
    }
  }

  const handleClearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setPreds([]);
    setAnswer("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="h-8 w-8" />
            <h1 className="text-3xl font-bold">AI Image Analyzer</h1>
          </div>
          <p className="text-blue-100">
            Upload an image and ask questions about it using advanced AI vision
            and knowledge retrieval
          </p>
        </div>

        <div className="p-6 md:p-8">
          {/* Model Loading State */}
          {modelLoading && (
            <div className="flex items-center justify-center p-8 bg-blue-50 rounded-lg mb-6">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-3" />
              <span className="text-blue-800 font-medium">
                Loading AI model...
              </span>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* File Upload Section */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Camera className="inline h-4 w-4 mr-2" />
              Upload an Image
            </label>

            <div className="flex gap-4">
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="flex-1 block w-full text-sm text-gray-500
                           file:mr-4 file:py-3 file:px-4
                           file:rounded-lg file:border-0
                           file:text-sm file:font-medium
                           file:bg-blue-50 file:text-blue-700
                           hover:file:bg-blue-100 cursor-pointer
                           border border-gray-200 rounded-lg p-2"
              />

              {imagePreview && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-8">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
                <img
                  ref={imgRef}
                  src={imagePreview}
                  alt="Uploaded preview"
                  className="max-w-full h-auto max-h-96 mx-auto rounded-lg shadow-lg"
                  onLoad={() => console.log("Image loaded")}
                  onError={() => setError("Failed to load image")}
                />
              </div>
            </div>
          )}

          {/* Question Input */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Search className="inline h-4 w-4 mr-2" />
              Ask a Question
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit(e)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What do you want to know about this image?"
                disabled={isProcessing || modelLoading}
              />
              <button
                onClick={handleSubmit}
                disabled={
                  isProcessing ||
                  modelLoading ||
                  !imagePreview ||
                  !question.trim()
                }
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isProcessing ? "Processing..." : "Analyze"}
              </button>
            </div>
          </div>

          {/* Prediction Results */}
          {preds && preds.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Image Classification Results
                </h3>
              </div>

              <div className="grid gap-3">
                {preds.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
                        {i + 1}
                      </span>
                      <span className="text-gray-800 font-medium">
                        {p.className}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">
                        {(p.probability * 100).toFixed(1)}%
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${p.probability * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Answer Section */}
          {answer && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-800">
                  AI Response
                </h3>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {answer.split("\n").map((line, i) => (
                  <p key={i} className="mb-2">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!imagePreview && !modelLoading && (
            <div className="text-center p-8 bg-gray-50 rounded-xl">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Get Started
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Upload an image to begin. The AI will classify what it sees and
                answer any questions you have about it using advanced knowledge
                retrieval.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
