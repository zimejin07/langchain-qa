"use client";

import React, { useState, useCallback } from "react";
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// Define an interface for the file items
interface FileItem {
  id: string;
  file: File;
  status: "pending" | "processing" | "completed" | "error";
  name: string;
  size: number;
  chunksCreated?: number;
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      const validTypes = [".pdf", ".txt", ".docx", ".md"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      return (
        validTypes.includes(fileExtension) && file.size <= 10 * 1024 * 1024
      ); // 10MB limit
    });

    const filesWithId: FileItem[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "pending",
      name: file.name,
      size: file.size,
    }));

    setFiles((prev) => [...prev, ...filesWithId]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const pendingFiles = files.filter((f) => f.status === "pending");

    for (const fileItem of pendingFiles) {
      try {
        // Update file status to processing
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: "processing" } : f
          )
        );

        const formData = new FormData();
        formData.append("file", fileItem.file);
        formData.append("fileName", fileItem.name);

        const response = await fetch("/api/upload-knowledge", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? {
                    ...f,
                    status: "completed",
                    chunksCreated: result.chunksCreated,
                  }
                : f
            )
          );
        } else {
          const error = await response.json();
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, status: "error", error: error.error }
                : f
            )
          );
        }
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "error", error: error.message }
              : f
          )
        );
      }
    }

    setUploading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  const completedFiles = files.filter((f) => f.status === "completed").length;
  const totalChunks = files.reduce((sum, f) => sum + (f.chunksCreated || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Knowledge Base
          </h1>
          <p className="text-gray-600">
            Upload documents to expand your AI's knowledge. Supported formats:
            PDF, TXT, DOCX, MD (max 10MB each)
          </p>
        </div>

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors bg-white"
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drag and drop files here, or click to browse
          </h3>
          <p className="text-gray-500 mb-4">
            PDF, TXT, DOCX, MD files up to 10MB each
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.docx,.md"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
          >
            Select Files
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Files ({files.length})
              </h3>
              <button
                onClick={uploadFiles}
                disabled={
                  uploading ||
                  files.filter((f) => f.status === "pending").length === 0
                }
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                Process Files
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="p-4 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(fileItem.status)}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {fileItem.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(fileItem.size)}
                          {fileItem.chunksCreated && (
                            <span className="ml-2">
                              • {fileItem.chunksCreated} chunks created
                            </span>
                          )}
                        </p>
                        {fileItem.error && (
                          <p className="text-sm text-red-600 mt-1">
                            {fileItem.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      disabled={fileItem.status === "processing"}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Stats */}
        {completedFiles > 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-800">
                Successfully processed {completedFiles} file
                {completedFiles !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-green-700 mt-1">
              Created {totalChunks} knowledge chunks in your vector database
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>1. Upload your documents using the area above</li>
            <li>2. Files are automatically split into searchable chunks</li>
            <li>3. Content is embedded and stored in your vector database</li>
            <li>4. Your AI can now answer questions based on this content</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
