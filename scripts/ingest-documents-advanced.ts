// scripts/ingest-documents.ts
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { Document } from "@langchain/core/documents";
import fs from "fs";
import path from "path";

// Load environment variables
import dotenv from "dotenv";

// Try to load from different possible locations
dotenv.config(); // Loads .env
dotenv.config({ path: ".env.local" }); // Also try .env.local

const DOCUMENTS_FOLDER = "./documents";
const EXPECTED_EMBEDDING_DIMENSION = 1536; // OpenAI text-embedding-ada-002

async function ingestDocuments() {
  try {
    console.log("🚀 Starting document ingestion...");
    console.log(
      "📊 Expected embedding dimension:",
      EXPECTED_EMBEDDING_DIMENSION
    );

    // Validate environment variables first
    if (
      !process.env.PINECONE_API_KEY ||
      !process.env.PINECONE_INDEX ||
      !process.env.OPENAI_API_KEY
    ) {
      console.error("❌ Missing required environment variables:");
      console.error("   PINECONE_API_KEY, PINECONE_INDEX, OPENAI_API_KEY");
      console.error("   Please check your .env file");
      return;
    }

    // Initialize Pinecone early to check index compatibility
    console.log("🔌 Connecting to Pinecone...");
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const indexName = process.env.PINECONE_INDEX;
    console.log(`📋 Checking index: ${indexName}`);

    // Check if index exists and validate dimensions
    let index;
    try {
      const existingIndexes = await pinecone.listIndexes();
      const currentIndex = existingIndexes.indexes?.find(
        (idx) => idx.name === indexName
      );

      if (currentIndex) {
        console.log(`📊 Current index dimension: ${currentIndex.dimension}`);

        if (currentIndex.dimension !== EXPECTED_EMBEDDING_DIMENSION) {
          console.error(`❌ DIMENSION MISMATCH!`);
          console.error(`   Index dimension: ${currentIndex.dimension}`);
          console.error(
            `   Expected dimension: ${EXPECTED_EMBEDDING_DIMENSION}`
          );
          console.error(
            `   This will cause compatibility issues with the RAG query API.`
          );
          console.error(
            `\n🔧 To fix this, run: npx tsx scripts/fix-pinecone-dimensions.ts`
          );
          return;
        }

        console.log("✅ Index dimensions are compatible!");
        index = pinecone.Index(indexName);
      } else {
        console.log(`📝 Index ${indexName} does not exist. Creating...`);
        await pinecone.createIndex({
          name: indexName,
          dimension: EXPECTED_EMBEDDING_DIMENSION,
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
          waitUntilReady: true,
        });
        console.log(
          `✅ Index created with ${EXPECTED_EMBEDDING_DIMENSION} dimensions`
        );
        index = pinecone.Index(indexName);
      }
    } catch (error) {
      console.error("❌ Error checking/creating Pinecone index:", error);
      return;
    }

    // Initialize embeddings with explicit model to ensure consistency
    console.log("🤖 Initializing OpenAI embeddings...");
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-ada-002", // Explicit model specification
    });

    // Test embedding to verify dimensions
    console.log("🧪 Testing embedding dimensions...");
    try {
      const testEmbedding = await embeddings.embedQuery("test");
      console.log(`📏 Actual embedding dimension: ${testEmbedding.length}`);

      if (testEmbedding.length !== EXPECTED_EMBEDDING_DIMENSION) {
        console.error(`❌ EMBEDDING DIMENSION MISMATCH!`);
        console.error(`   Generated: ${testEmbedding.length}`);
        console.error(`   Expected: ${EXPECTED_EMBEDDING_DIMENSION}`);
        return;
      }

      console.log("✅ Embedding dimensions are correct!");
    } catch (error) {
      console.error("❌ Error testing embeddings:", error);
      return;
    }

    // Check if documents folder exists
    if (!fs.existsSync(DOCUMENTS_FOLDER)) {
      console.log(`📁 Creating documents folder: ${DOCUMENTS_FOLDER}`);
      fs.mkdirSync(DOCUMENTS_FOLDER, { recursive: true });

      // Create a sample document
      const sampleContent = `# Sample Document

This is a sample document for testing the RAG system.

## About Pencil Sharpeners

A pencil sharpener is a tool used to sharpen pencils by shaving the wood and graphite tip to create a fine point.

### Types of Sharpeners:
- Manual handheld sharpeners
- Desktop manual sharpeners  
- Electric sharpeners

### Maintenance Tips:
- Empty the shavings regularly
- Replace dull blades
- Clean the mechanism monthly

### Troubleshooting:
- If pencil won't sharpen, check if blade is dull
- If motor stops on electric models, allow cooling time
- Ensure shavings tray is properly seated

### Common Problems and Solutions:
- Pencil gets stuck: Check for wood chips blocking the mechanism
- Uneven sharpening: Blade may need replacement or cleaning
- Excessive noise: Lubricate moving parts or check for loose components
- Poor point quality: Clean the pencil guide hole and check blade sharpness

You can replace this file with your own documents and run the script again.`;

      fs.writeFileSync(
        path.join(DOCUMENTS_FOLDER, "sample-document.md"),
        sampleContent
      );
      console.log("📝 Created sample document: sample-document.md");
    }

    // Check for files in the folder
    const files = fs.readdirSync(DOCUMENTS_FOLDER);
    const supportedFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".pdf", ".txt", ".md"].includes(ext);
    });

    if (supportedFiles.length === 0) {
      console.log(`❗ No supported files found in ${DOCUMENTS_FOLDER}`);
      console.log("   Supported formats: PDF, TXT, MD");
      return;
    }

    console.log(`📄 Found ${supportedFiles.length} supported files:`);
    supportedFiles.forEach((file) => {
      const filePath = path.join(DOCUMENTS_FOLDER, file);
      const stats = fs.statSync(filePath);
      console.log(`   - ${file} (${formatFileSize(stats.size)})`);
    });

    // Initialize text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    // Load documents using DirectoryLoader
    console.log("\n📚 Loading documents...");
    const loader = new DirectoryLoader(DOCUMENTS_FOLDER, {
      ".txt": (path) => new TextLoader(path),
      ".md": (path) => new TextLoader(path),
      ".pdf": (path) => new PDFLoader(path),
    });

    let documents;
    try {
      documents = await loader.load();
      console.log(`✅ Loaded ${documents.length} documents`);
    } catch (error) {
      console.error("❌ Error loading documents:", error);
      return;
    }

    if (documents.length === 0) {
      console.log("❗ No documents were loaded");
      console.log("   Check file permissions and formats");
      return;
    }

    // Split documents into chunks
    console.log("✂️  Splitting documents into chunks...");
    const splitDocuments = await textSplitter.splitDocuments(documents);
    console.log(`✅ Created ${splitDocuments.length} document chunks`);

    // Add enhanced metadata for better tracking
    const documentsWithMetadata = splitDocuments.map((doc, index) => {
      return new Document({
        pageContent: doc.pageContent,
        metadata: {
          ...doc.metadata,
          chunkIndex: index,
          ingestedAt: new Date().toISOString(),
          totalChunks: splitDocuments.length,
          embeddingModel: "text-embedding-ada-002",
          embeddingDimension: EXPECTED_EMBEDDING_DIMENSION,
          scriptVersion: "1.0.0",
        },
      });
    });

    // Create vector store and add documents
    console.log("🔗 Adding documents to Pinecone...");
    console.log("   This may take a few moments for large document sets...");

    try {
      const vectorStore = await PineconeStore.fromDocuments(
        documentsWithMetadata,
        embeddings,
        {
          pineconeIndex: index,
        }
      );

      console.log("✅ Documents successfully ingested into Pinecone!");
    } catch (error) {
      console.error("❌ Error adding documents to Pinecone:", error);
      return;
    }

    console.log(`📊 Ingestion Summary:`);
    console.log(`   - Files processed: ${supportedFiles.length}`);
    console.log(`   - Total chunks created: ${splitDocuments.length}`);
    console.log(
      `   - Average chunks per file: ${Math.round(
        splitDocuments.length / supportedFiles.length
      )}`
    );
    console.log(`   - Embedding model: text-embedding-ada-002`);
    console.log(`   - Embedding dimensions: ${EXPECTED_EMBEDDING_DIMENSION}`);

    // Test the ingestion with multiple queries
    console.log("\n🔍 Testing ingestion with sample queries...");

    try {
      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
      });

      const testQueries = [
        "pencil sharpener",
        "troubleshooting",
        "maintenance tips",
      ];

      for (const query of testQueries) {
        const results = await vectorStore.similaritySearch(query, 2);
        console.log(`📝 Query "${query}": ${results.length} results found`);

        if (results.length > 0) {
          console.log(
            `   Best match: ${results[0].pageContent.substring(0, 80)}...`
          );
        }
      }

      console.log("✅ All test queries completed successfully!");
    } catch (error) {
      console.error("❌ Error during testing:", error);
    }

    console.log("\n🎉 Ingestion completed successfully!");
    console.log("💡 Your documents are now ready for RAG queries!");
    console.log(
      `🔗 Compatible with RAG API using ${EXPECTED_EMBEDDING_DIMENSION}-dimensional embeddings`
    );
  } catch (error) {
    console.error("❌ Fatal error during ingestion:", error);
    process.exit(1);
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Run the ingestion
ingestDocuments();
