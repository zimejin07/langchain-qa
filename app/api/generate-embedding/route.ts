import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid request: 'text' must be a string." },
        { status: 400 }
      );
    }

    // Call OpenAI embeddings API
    const embeddingResp = await openai.embeddings.create({
      model: "text-embedding-3-small", // 1536-dim
      input: text,
    });

    const embedding = embeddingResp.data[0].embedding;

    return NextResponse.json({ embedding });
  } catch (err: any) {
    console.error("Embedding error:", err);
    return NextResponse.json(
      { error: "Failed to generate embedding", details: err.message },
      { status: 500 }
    );
  }
}
