# LangChain + TensorFlow.js + Next.js Demo

This project showcases an innovative AI workflow using LangChain, TensorFlow.js, and Next.js to integrate language processing and image classification within a unified interface.

## Key Technologies

- **LangChain**: Manages prompt orchestration and LLM (OpenAI) interactions.
- **TensorFlow.js**: Performs browser-based image classification using MobileNet.
- **Next.js (App Router)**: Facilitates a seamless frontend and backend environment with streaming AI responses.

## Features

- **Text Interaction**: Pose questions in text form and receive LLM-generated responses that stream live.
- **Image Analysis**: Upload images for real-time classification via TensorFlow.js; results are automatically converted into questions for the LLM.
- **Integrated Chat Interface**: Enjoy a cohesive platform for both text and image inputs, with responses dynamically updating the UI.

---

## Tech Stack

- **Next.js 15 (App Router)**
- **React (Client Components)**
- **LangChain**
- **OpenAI API**
- **TensorFlow.js + MobileNet**

---

## Getting Started

To initiate the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Once started, access the application at [http://localhost:3000](http://localhost:3000).

## Learning Resources

Enhance your understanding of Next.js through these resources:

- [Next.js Documentation](https://nextjs.org/docs) - Explore features and API details.
- [Learn Next.js](https://nextjs.org/learn) - Engage in an interactive tutorial.

For further involvement, contribute to [the Next.js GitHub repository](https://github.com/vercel/next.js).

## Deployment on Vercel

Quickly deploy your Next.js app using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme), the official platform by Next.js creators.

Consult the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for detailed instructions.

## Usage

1. **Text Interaction**:

   - Enter a question into the provided text input field.
   - The answer is streamed live and appears directly in the user interface.

2. **Image Upload**:
   - Upload an image via the designated interface.
   - TensorFlow.js processes the image and classifies it (e.g., "Labrador retriever").
   - The classification result is converted into a descriptive query, such as "I have an image of Labrador retriever. Tell me something interesting about it," which is then sent to the LangChain backend for processing.
