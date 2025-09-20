import Link from "next/link";
import Chat from "./components/Chat"; // Assuming this is your Chat UI
import ImageClassifier from "./components/ImageClassifier"; // Assuming this is your Image Classifier UI

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header/Hero Section */}
        <header className="text-center mb-12 py-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Welcome to T3 AI Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Interact with our AI Chat, classify images, and expand its knowledge
            base.
          </p>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Chat Component */}
          <section className="md:col-span-1 lg:col-span-2 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              AI Chat Assistant
            </h2>
            <p className="text-gray-600 mb-6">
              Ask questions, get information, and have a conversation.
            </p>
            <div className="flex-grow">
              <Chat />
            </div>
          </section>

          {/* Side Panel / Action Items */}
          <aside className="md:col-span-1 flex flex-col gap-8">
            {/* Upload Knowledge Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col justify-between h-auto">
              <div>
                <h2 className="text-2xl font-bold mb-3">Upload Knowledge</h2>
                <p className="text-blue-100 mb-6">
                  Help the AI learn more by uploading new information and
                  documents.
                </p>
              </div>
              <Link
                href="/upload"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Go to Upload
              </Link>
            </div>

            {/* Image Classifier Card */}
            <section className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col h-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Image Classifier
              </h2>
              <p className="text-gray-600 mb-6">
                Upload an image and get instant predictions.
              </p>
              <div className="flex-grow">
                <ImageClassifier />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
