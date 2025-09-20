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

    // Validate required inputs
    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      return NextResponse.json(
        { error: "Valid embedding array is required" },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (
      !process.env.PINECONE_API_KEY ||
      !process.env.PINECONE_INDEX ||
      !process.env.OPENAI_API_KEY
    ) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    // Init Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });

    const indexName = process.env.PINECONE_INDEX as string;

    // Get the index (don't create it here - should be created during setup)
    let index;
    try {
      index = pinecone.Index(indexName);
      
      // Test if index exists by trying to get stats
      await index.describeIndexStats();
    } catch (indexError) {
      console.error("Index connection error:", indexError);
      return NextResponse.json(
        { 
          error: "Vector database connection failed", 
          details: "Please ensure your Pinecone index exists and is accessible"
        },
        { status: 500 }
      );
    }

    // Init embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Wrap index with vector store
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    console.log("Connected to Pinecone index:", indexName);

    // Validate and clean embedding vector
    const vector = Array.isArray(embedding) ? embedding : JSON.parse(embedding);
    
    // Validate embedding dimensions
    if (vector.length !== 1536) {
      return NextResponse.json(
        { 
          error: `Embedding dimension mismatch. Expected 1536, got ${vector.length}` 
        },
        { status: 400 }
      );
    }

    // Ensure all values are numbers
    const cleanVector = vector.map((val: any) => {
      const num = Number(val);
      if (isNaN(num)) {
        throw new Error("Embedding contains non-numeric values");
      }
      return num;
    });

    console.log("Vector sample:", cleanVector.slice(0, 5));

    // Query Pinecone
    let docsWithScores;
    try {
      docsWithScores = await vectorStore.similaritySearchVectorWithScore(
        cleanVector,
        4
      );
    } catch (searchError) {
      console.error("Vector search error:", searchError);
      return NextResponse.json(
        { 
          error: "Vector search failed", 
          details: "Could not search the knowledge base"
        },
        { status: 500 }
      );
    }

    console.log("Docs retrieved:", docsWithScores.length);

    // Handle empty results
    if (docsWithScores.length === 0) {
      const stream = new ReadableStream({
        start(controller) {
          const message = "I couldn't find any relevant information in the knowledge base to answer your question. Please try rephrasing your question or upload more relevant documents.";
          controller.enqueue(new TextEncoder().encode(message));
          controller.close();
        },
      });

      return new NextResponse(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Build context from retrieved documents
    const context = docsWithScores
      .map(([doc, score]) => {
        // Filter out very low relevance scores
        if (score < 0.3) return null;
        return `(Score: ${score.toFixed(4)}) ${doc.pageContent.trim()}`;
      })
      .filter(Boolean)
      .join("\n---\n");

    if (!context) {
      const stream = new ReadableStream({
        start(controller) {
          const message = "I found some documents but they don't seem relevant enough to your question. Please try rephrasing or asking about something more specific.";
          controller.enqueue(new TextEncoder().encode(message));
          controller.close();
        },
      });

      return new NextResponse(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const prompt = ChatPromptTemplate.fromTemplate(
      `You are a helpful AI assistant. Use the provided context to answer the user's question accurately and thoroughly.

Context from knowledge base:
{context}

Question: {question}

Instructions:
- Answer based primarily on the provided context
- If the context doesn't fully answer the question, acknowledge what you can and cannot answer
- Be specific and detailed when the context provides sufficient information
- If the context is insufficient, explain what additional information would be helpful

Answer:`
    );

    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.1, // Keep it low for factual responses
      streaming: true,
      modelName: "gpt-3.5-turbo", // Explicit model specification
    });

    const chain = prompt.pipe(llm);

    // Streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const fullQuestion = label ? `${label}. ${question}` : question;
          
          const streamResult = await chain.stream({
            context: context,
            question: fullQuestion.trim(),
          });

          let hasContent = false;
          for await (const chunk of streamResult) {
            if (chunk.content) {
              hasContent = true;
              const token = typeof chunk.content === "string" 
                ? chunk.content 
                : JSON.stringify(chunk.content);
              controller.enqueue(new TextEncoder().encode(token));
            }
          }

          if (!hasContent) {
            controller.enqueue(new TextEncoder().encode(
              "I apologize, but I couldn't generate a proper response. Please try rephrasing your question."
            ));
          }

          controller.close();
        } catch (err) {
          console.error("Error during streaming:", err);
          
          // Send error message to client
          controller.enqueue(new TextEncoder().encode(
            "I encountered an error while processing your request. Please try again."
          ));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (err) {
    console.error("Fatal error in /api/query-rag:", err);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: process.env.NODE_ENV === 'development' ? String(err) : "Please try again later"
      },
      { status: 500 }
    );
  }
}