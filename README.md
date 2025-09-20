# AI Assistant Platform with RAG Technology

A sophisticated Next.js 15 application showcasing advanced AI capabilities through **Retrieval-Augmented Generation (RAG)** technology. The platform combines real-time image classification with intelligent document retrieval to provide contextual, knowledge-based responses.

## 🚀 Key Features

### RAG-Powered Image Analysis
- **Smart Image Classification**: Upload images for instant AI-powered object recognition
- **Knowledge-Enhanced Responses**: Automatically searches your custom knowledge base for relevant information
- **Contextual Intelligence**: Combines computer vision with document retrieval for comprehensive answers
- **Real-time Processing**: Live streaming responses as the AI processes and retrieves information

### 💬 Dual AI Experience
- **RAG-Enabled Image Classifier**: Advanced system that searches uploaded documents for contextual answers
- **General Chat Assistant**: Standard conversational AI for general questions and interactions
- **Clear Technology Distinction**: Users understand when they're using RAG vs. standard AI

### 📚 Custom Knowledge Management
- **Document Upload System**: Drag-and-drop interface for PDFs, TXT, DOCX, and Markdown files
- **Intelligent Chunking**: Automatic text splitting and embedding generation for optimal retrieval
- **Vector Database**: Powered by Pinecone for fast, semantic document search
- **Progress Tracking**: Real-time upload status and chunk creation feedback

## 🛠️ Technology Stack

### Core Technologies
- **Next.js 15** (App Router) - Modern React framework with server-side capabilities
- **React** (Client Components) - Interactive user interface components
- **TypeScript** - Type-safe development experience

### AI & Machine Learning
- **LangChain** - Orchestrates LLM interactions and RAG workflows
- **OpenAI API** - Powers text generation and embeddings
- **TensorFlow.js + MobileNet** - Client-side image classification
- **Pinecone** - Vector database for semantic search

### UI/UX
- **Tailwind CSS** - Modern, responsive styling
- **Lucide React** - Beautiful icon library
- **Gradient Designs** - Modern visual aesthetics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- OpenAI API key
- Pinecone account and API key

### Environment Setup
Create a `.env.local` file in the root directory:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=your_pinecone_index_name
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-assistant-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up your vector database**
   ```bash
   # Run the Pinecone setup script
   npx tsx scripts/setup-pinecone.ts
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Use

### 1. RAG-Powered Image Analysis
1. Navigate to the main homepage
2. Upload an image using the drag-and-drop interface
3. Ask any question about the image
4. The system will:
   - classify the image using TensorFlow.js
   - search your knowledge base for relevant information
   - provide contextual, intelligent responses

### 2. Upload Custom Knowledge
1. Click "Upload Knowledge" or navigate to `/upload`
2. Drag and drop or select your documents (PDF, TXT, DOCX, MD)
3. Click "Process Files" to add them to your knowledge base
4. Documents are automatically chunked and embedded for optimal retrieval

### 3. General Chat
- Use the sidebar chat for general AI conversations
- This uses standard AI without accessing your custom knowledge base
- Great for general questions and casual interaction

## 🔧 Advanced Features

### RAG System Architecture
```
User Image + Question → Image Classification → Vector Search → Context Retrieval → Enhanced Response
```

1. **Image Processing**: TensorFlow.js classifies uploaded images
2. **Embedding Generation**: Creates vector representations for semantic search
3. **Knowledge Retrieval**: Searches vector database for relevant document chunks
4. **Context Integration**: Combines image analysis with retrieved knowledge
5. **Response Generation**: LangChain orchestrates the final AI response

### Performance Optimizations
- **Model Caching**: TensorFlow.js models cached in IndexedDB
- **Streaming Responses**: Real-time AI response streaming
- **Vector Database**: Fast semantic search with Pinecone
- **Memory Management**: Proper tensor cleanup and resource management

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your repository to [Vercel](https://vercel.com)
2. Add your environment variables in the Vercel dashboard
3. Deploy with automatic CI/CD

### Other Platforms
This Next.js application can be deployed on any platform supporting Node.js:
- Railway
- Render
- AWS Amplify
- Netlify (with serverless functions)

## 📚 Learn More

### Documentation
- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [LangChain Documentation](https://docs.langchain.com/) - RAG and LLM orchestration
- [Pinecone Documentation](https://docs.pinecone.io/) - Vector database setup
- [OpenAI API Documentation](https://platform.openai.com/docs) - AI model integration

### Key Concepts
- **RAG (Retrieval-Augmented Generation)**: Enhances AI responses with relevant document retrieval
- **Vector Embeddings**: Mathematical representations enabling semantic search
- **Semantic Search**: Finding relevant information based on meaning, not just keywords

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔍 Troubleshooting

### Common Issues
- **Model Loading**: Ensure stable internet connection for initial TensorFlow.js model download
- **Pinecone Connection**: Verify API keys and index names in environment variables
- **Upload Failures**: Check file sizes (max 10MB) and supported formats (PDF, TXT, DOCX, MD)
- **Memory Issues**: Refresh page if experiencing performance degradation

### Support
For issues and questions:
1. Check the [Issues](../../issues) page
2. Review documentation links above
3. Create a new issue with detailed reproduction steps

---

**Built with ❤️ by Zimuzo Ejinkeonye**