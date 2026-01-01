import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import dbConnect from "../../../../../../backend/db";
import Note from "../../../../../../backend/models/notes";
import NoteChunk from "../../../../../../backend/models/NoteChunk";
import OpenAI from "openai";
import mongoose from "mongoose";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req, { params }) {
  try {
    await dbConnect();

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question } = await req.json();
    const { id } = await params;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Verify note exists and belongs to user
    const note = await Note.findById(id);
    if (!note || note.userId !== user.id) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    console.log("📝 RAG Query for note:", note.title);
    console.log("❓ Question:", question);

    // 1️⃣ Generate question embedding
    console.log("🧠 Generating question embedding...");
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    const questionEmbedding = embeddingRes.data[0].embedding;

    // 2️⃣ Vector search using MongoDB aggregation
    console.log("🔍 Performing vector search...");

    const chunks = await NoteChunk.aggregate([
      {
        $vectorSearch: {
          index: "noteChunksVectorIndex",
          path: "embedding",
          queryVector: questionEmbedding,
          numCandidates: 50,
          limit: 5,
          filter: {
            noteId: new mongoose.Types.ObjectId(id),
            userId: user.id,
          },
        },
      },
      {
        $project: {
          text: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    console.log(`✅ Found ${chunks.length} relevant chunks`);

    if (chunks.length === 0) {
      return NextResponse.json({
        answer:
          "I couldn't find relevant information in this document to answer your question. Please try rephrasing or asking something else about the document.",
      });
    }

    // Build context from chunks
    const context = chunks
      .map((c, i) => `[Chunk ${i + 1}]\n${c.text}`)
      .join("\n\n---\n\n");

    // 3️⃣ Ask OpenAI with context
    console.log("💬 Generating answer with OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Answer questions based ONLY on the provided context. If the answer is not in the context, say 'I don't have enough information in this document to answer that question.'",
        },
        {
          role: "user",
          content: `CONTEXT:\n${context}\n\nQUESTION:\n${question}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const answer = completion.choices[0].message.content;

    console.log("✅ Answer generated successfully");

    return NextResponse.json({
      success: true,
      answer: answer,
      chunksUsed: chunks.length,
    });
  } catch (error) {
    console.error("❌ RAG Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to answer question",
      },
      { status: 500 }
    );
  }
}
