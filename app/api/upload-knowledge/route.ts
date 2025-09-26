// app/api/upload-knowledge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function POST(req: NextRequest) {
  try {
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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ["application/pdf", "text/plain", "text/markdown"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (
      !allowedTypes.includes(file.type) &&
      !file.name.endsWith(".md") &&
      !file.name.endsWith(".txt")
    ) {
      return NextResponse.json(
        {
          error: "Unsupported file type. Please upload PDF, TXT, or MD files.",
        },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    console.log(`Processing file: ${fileName} (${file.size} bytes)`);

    // Extract text content based on file type
    let textContent = "";

    if (file.type === "application/pdf") {
      textContent = await extractTextFromPDF(file);
    } else {
      // Handle text files (TXT, MD)
      textContent = await file.text();
    }

    if (!textContent.trim()) {
      return NextResponse.json(
        { error: "No text content found in the file" },
        { status: 400 }
      );
    }

    console.log(`Extracted ${textContent.length} characters from ${fileName}`);

    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX);

    // Initialize embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const documents = await textSplitter.createDocuments(
      [textContent],
      [
        {
          source: fileName,
          type: getFileType(fileName),
          uploadedAt: new Date().toISOString(),
          fileSize: file.size,
        },
      ]
    );

    console.log(`Created ${documents.length} chunks from ${fileName}`);

    // Add documents to vector store
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
    });

    await vectorStore.addDocuments(documents);

    console.log(`Successfully added ${documents.length} documents to Pinecone`);

    return NextResponse.json({
      success: true,
      fileName: fileName,
      chunksCreated: documents.length,
      textLength: textContent.length,
      message: `Successfully processed ${fileName} and created ${documents.length} searchable chunks`,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      {
        error: "Failed to process file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Dynamic import with proper error handling
    let pdf;
    try {
      const pdfParse = await import("pdf-parse");
      pdf = pdfParse.default || pdfParse;
    } catch (importError) {
      console.error("Failed to import pdf-parse:", importError);
      throw new Error("PDF parsing library not available");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF with pdf-parse library
    const data = await pdf(buffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error("No text content found in PDF");
    }

    console.log(
      `PDF extraction successful: ${data.numpages} pages, ${data.text.length} characters`
    );

    return data.text.trim();
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw new Error(
      `Failed to extract text from PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function getFileType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "pdf";
    case "txt":
      return "text";
    case "md":
      return "markdown";
    case "docx":
      return "word";
    default:
      return "unknown";
  }
}
