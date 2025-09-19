// # streaming RAG endpoint
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function POST(req: Request) {
  const { embedding, question, label } = await req.json();

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
    assistantRegion: process.env.PINECONE_ENVIRONMENT,
  });

  const index = pinecone.Index(process.env.PINECONE_INDEX as string);

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
    textKey: process.env.PINECONE_INDEX,
  });

  // nearest docs by vector
  const docsWithScores = await vectorStore.similaritySearchVectorWithScore(
    embedding,
    4
  );
  const context = docsWithScores
    .map(([doc, score]) => `(${score.toFixed(4)}) ${doc.pageContent}`)
    .join("\n---\n");

  const prompt = ChatPromptTemplate.fromTemplate(
    `Use the context to answer. If context is irrelevant say so.\n\nContext:\n{context}\n\nQuestion:\n{question}`
  );

  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.0,
    streaming: true,
  });

  const chain = prompt.pipe(llm);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await chain.stream(
          { context, question: `${label ? label + ". " : ""}${question}` },
          {
            callbacks: [
              {
                handleLLMNewToken(token: string) {
                  // must enqueue Uint8Array for Next stream; encode token
                  controller.enqueue(new TextEncoder().encode(token));
                },
                handleLLMEnd() {
                  controller.close();
                },
                handleLLMError(err: Error) {
                  controller.error(err);
                },
              },
            ],
          }
        );
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
