// # CLI ingest (node)
import fs from "fs";
import path from "path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

async function main() {
  const FILE = process.argv[2]; // path to pdf / txt
  const loader = new PDFLoader(FILE);
  const docs = await loader.load(); // array of Documents
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = await splitter.splitDocuments(docs);

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
    maxRetries: 5,
  });

  await PineconeStore.fromDocuments(chunks, embeddings, {
    pineconeIndex: pinecone.Index(process.env.PINECONE_INDEX as string),
  });

  console.log("uploaded", chunks.length, "chunks");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
