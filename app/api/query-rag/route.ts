// app/api/query-rag/route.ts
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function POST(req: Request) {
  try {
    const { embedding, question, label } = await req.json();
    console.log("Incoming request:", { question, label });
    console.log("Embedding length:", embedding?.length);

    // Validate environment variables
    if (
      !process.env.PINECONE_API_KEY ||
      !process.env.PINECONE_INDEX ||
      !process.env.OPENAI_API_KEY
    ) {
      throw new Error("Missing required environment variables");
    }

    // Init Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });

    const indexName = process.env.PINECONE_INDEX as string;

    // Check if index exists, create if it doesn't
    const existingIndexes = await pinecone.listIndexes();
    const indexExists = existingIndexes.indexes?.some(
      (idx) => idx.name === indexName
    );

    if (!indexExists) {
      console.log(`Creating index: ${indexName}`);
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536, // OpenAI embedding dimension
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
        waitUntilReady: true,
      });
      console.log(`Index ${indexName} created successfully`);
    }

    const index = pinecone.Index(indexName);

    // Init embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Wrap index with vector store
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    console.log("Connected to Pinecone index:", process.env.PINECONE_INDEX);

    // Ensure embedding is a plain number[]
    const vector = Array.isArray(embedding) ? embedding : JSON.parse(embedding);
    console.log("Vector sample:", vector.slice(0, 5));

    // Query Pinecone
    const docsWithScores = await vectorStore.similaritySearchVectorWithScore(
      vector,
      4
    );

    console.log("Docs retrieved:", docsWithScores.length);

    const context = docsWithScores
      .map(([doc, score]) => `(${score.toFixed(4)}) ${doc.pageContent}`)
      .join("\n---\n");

    const prompt = ChatPromptTemplate.fromTemplate(
      `Use the context to answer the question. If the context is irrelevant or doesn't contain the answer, say so clearly.

Context:
{context}

Question: {question}

Answer:`
    );

    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.0,
      streaming: true,
    });

    const chain = prompt.pipe(llm);

    // Streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Fix: Pass variables as object to match template placeholders
          const streamResult = await chain.stream({
            context,
            question: `${label ? label + ". " : ""}${question}`,
          });

          for await (const chunk of streamResult) {
            const token =
              typeof chunk.content === "string"
                ? chunk.content
                : JSON.stringify(chunk.content);
            controller.enqueue(new TextEncoder().encode(token));
          }
          controller.close();
        } catch (err) {
          console.error("Error during stream:", err);
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Fatal error in /api/query-rag:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
