import type { NextApiRequest, NextApiResponse } from "next";
import { ChatOpenAI } from "@langchain/openai";

import { ChatPromptTemplate } from "@langchain/core/prompts";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { question } = req.body;

  const prompt = ChatPromptTemplate.fromTemplate(
    `Answer the following question to the best of your ability:\n{question}`
  );

  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.5,
  });

  //   const chain = new LLMChain({ llm, prompt });
  const chain = prompt.pipe(llm);
  try {
    const result = await chain.invoke({ question });

    res.status(200).json({ answer: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
