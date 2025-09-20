import Link from "next/link";
import {
  Brain,
  MessageCircle,
  Database,
  Zap,
  Upload,
  Info,
} from "lucide-react";
import Chat from "./components/Chat";
import ImageClassifier from "./components/ImageClassifier";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Assistant Platform
                </h1>
                <p className="text-sm text-gray-600">
                  Powered by Advanced RAG Technology
                </p>
              </div>
            </div>

            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload Knowledge
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Technology Explanation Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Info className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Understanding Our AI Technologies
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="bg-white/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">
                      Image Classifier (RAG-Powered)
                    </span>
                  </div>
                  <p className="text-gray-700">
                    Uses <strong>Retrieval-Augmented Generation (RAG)</strong>{" "}
                    technology. When you upload an image, it searches through
                    your custom knowledge base to provide contextual, accurate
                    answers based on your uploaded documents and manuals.
                  </p>
                </div>
                <div className="bg-white/60 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-700">
                      Chat Assistant (General AI)
                    </span>
                  </div>
                  <p className="text-gray-700">
                    Standard conversational AI using pre-trained knowledge.
                    Great for general questions but doesn't access your custom
                    knowledge base or uploaded documents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Image Classifier */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Feature Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      RAG-Powered Image Analysis
                    </h2>
                    <p className="text-blue-100 text-sm">
                      Upload images and get answers from your custom knowledge
                      base
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      <Zap className="h-3 w-3" />
                      RAG Enabled
                    </span>
                  </div>
                </div>
              </div>

              {/* Image Classifier Component */}
              <div className="p-0">
                <ImageClassifier />
              </div>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Chat Assistant */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">
                    Chat Assistant
                  </h3>
                  <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    General AI
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  General conversation & questions
                </p>
              </div>
              <div className="p-4 max-h-96 overflow-hidden">
                <Chat />
              </div>
            </div>

            {/* Knowledge Upload Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Expand Knowledge</h3>
                  <p className="text-emerald-100 text-sm">
                    Power up your RAG system
                  </p>
                </div>
              </div>

              <p className="text-emerald-50 text-sm mb-6 leading-relaxed">
                Upload PDFs, documents, and manuals to enhance the image
                classifier's ability to provide detailed, contextual answers
                about your images.
              </p>

              <Link
                href="/upload"
                className="inline-flex items-center justify-center w-full px-4 py-3 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium transition-colors group"
              >
                <Upload className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Upload Documents
              </Link>
            </div>

            {/* Stats/Info Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                How RAG Works
              </h3>

              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Image Analysis</p>
                    <p className="text-xs">
                      AI identifies objects and creates embeddings
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      Knowledge Search
                    </p>
                    <p className="text-xs">
                      Searches your uploaded documents for relevant info
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      Contextual Answer
                    </p>
                    <p className="text-xs">
                      Combines AI analysis with your knowledge base
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
