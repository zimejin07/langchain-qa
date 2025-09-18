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
  });

  const chain = prompt.pipe(llm);
  const result = await chain.invoke({ question });

  return NextResponse.json({ answer: result.content });
}
