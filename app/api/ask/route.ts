import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function POST(req: Request) {
  const { question } = await req.json();

  const prompt = ChatPromptTemplate.fromTemplate(
    `Answer the following question:\n{question}`
  );

  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.5,
    streaming: true,
  });

  const chain = prompt.pipe(llm);

  // chain.stream() gives you an async iterable
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of await chain.stream({ question })) {
          // Each chunk is a BaseMessage
          const token = chunk.content ?? "";
          controller.enqueue(token);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
