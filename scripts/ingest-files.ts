// scripts/ingest-files.ts
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import dotenv from "dotenv";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

dotenv.config();

async function ingestFiles() {
  try {
    console.log("Starting file ingestion...");

    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY as string,
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX as string);

    // Initialize embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // Load documents from a directory
    const loader = new DirectoryLoader("./documents", {
      ".txt": (path) => new TextLoader(path),
      ".pdf": (path) => new PDFLoader(path),
    });

    console.log("Loading documents from ./documents directory...");
    const documents = await loader.load();
    console.log(`Loaded ${documents.length} documents`);

    // Split documents into chunks
    const splitDocuments = await textSplitter.splitDocuments(documents);
    console.log(`Created ${splitDocuments.length} document chunks`);

    if (splitDocuments.length === 0) {
      console.log(
        "No documents found. Make sure you have files in the ./documents directory"
      );
      return;
    }

    // Create vector store and add documents
    console.log("Adding documents to Pinecone...");
    const vectorStore = await PineconeStore.fromDocuments(
      splitDocuments,
      embeddings,
      {
        pineconeIndex: index,
      }
    );

    console.log("Documents successfully ingested into Pinecone!");
    console.log(`Total chunks added: ${splitDocuments.length}`);

    // Test query
    console.log("\nTesting with a sample query...");
    const results = await vectorStore.similaritySearch("test query", 3);
    console.log("Sample results:");
    results.forEach((doc, i) => {
      console.log(`${i + 1}. Source: ${doc.metadata.source}`);
      console.log(`   Content: ${doc.pageContent.substring(0, 100)}...\n`);
    });
  } catch (error) {
    console.error("Error during file ingestion:", error);
    process.exit(1);
  }
}

ingestFiles();
