# AI Smart Notes

An AI-powered note-taking application that helps you organize your notes and get intelligent answers using Google Gemini and OpenAI.

## Features

- **Create & Manage Notes** - Write and organize your notes with a clean interface
- **PDF Upload** - Upload PDF files and extract text automatically
- **AI Q&A** - Ask questions about your notes and get AI-powered answers
- **AI Assistant** - Chat with an AI assistant that can search across all your notes
- **Auto Summarization** - Automatically generate summaries for your notes
- **MongoDB Storage** - All notes are stored securely in MongoDB
- **Clerk Authentication** - Secure user authentication and authorization

## AI Functions

### Summarize

Automatically generates concise summaries of your notes using Google Gemini AI. Runs as a background Inngest job (non-streaming) and saves the result to each note.

### Question Answer

Ask questions about a specific note and get streaming responses using Google Gemini's `generateContentStream`. Uses the note content as context and streams answers in real-time to the frontend. If the answer is not present in the note content, the AI responds with "I don't know" to prevent hallucination.

### Upload PDF

Upload PDF files, extract text with OpenAI, then chunk and ingest it into MongoDB for later retrieval. Uses RAG (Retrieval Augmented Generation) with vector embeddings and similarity scores. When asking questions about PDFs, it performs vector search and filters results using a similarity score threshold (0.2) to ensure only relevant chunks are used for answering.

### Smart Assistant

Uses agentic AI with function calling tools (search_all_notes, count_notes, get_recent_notes). The AI decides which tools to call based on your question, executes them, and provides intelligent responses. This is a non-streaming agent-based approach.

## Tech Stack

- **Framework**: Next.js 16
- **Database**: MongoDB (Mongoose)
- **Authentication**: Clerk
- **AI Services**:
  - Google Gemini API
  - OpenAI API
- **Background Jobs**: Inngest
- **UI**: Tailwind CSS, Radix UI
- **State Management**: TanStack Query

## Setup

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Clerk account for authentication
- Google AI API key
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd ai-notetaker
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory and add the following environment variables:

```env
# MongoDB Connection
MONGODB_URL=your_mongodb_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI APIs
GOOGLE_AI_API_KEY=your_google_ai_api_key
OPENAI_API_KEY=your_openai_api_key

# Inngest (optional, for background jobs)
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign Up/Login** - Create an account or sign in using Clerk authentication
2. **Create Notes** - Click "New Note" to create a text note
3. **Upload PDFs** - Use the "Upload-Pdf" button to upload and process PDF files
4. **Ask Questions** - Open any note and ask questions about its content
5. **Use Assistant** - Access the AI Assistant to search across all your notes

## Project Structure

```
src/
├── app/              # Next.js app router pages and API routes
├── backend/          # Database models and connection
├── component/         # React components
├── components/        # UI components
└── lib/              # Utility functions and AI integrations
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
