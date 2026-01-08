import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import dbConnect from "../../../../../../backend/db";
import Note from "../../../../../../backend/models/notes";
import NoteChunk from "../../../../../../backend/models/NoteChunk";
import OpenAI from "openai";
import mongoose from "mongoose";
import ConversationMemory from "../../../../../../backend/models/ConversationMemory";
import AiUsage from "../../../../../../backend/models/AiUsage";
import { calculateCost, checkDailyLimit } from "@/lib/calcAiCost";

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

    const dailylimit = await checkDailyLimit(user.id);

    if (dailylimit >= 1) {
      return NextResponse.json(
        { success: false, message: "Daily AI usage limit reached" },
        { status: 429 }
      );
    }

    const startTime1 = Date.now();

    // 1️⃣ Generate question embedding
    console.log("🧠 Generating question embedding...");
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    const latencyMs = Date.now() - startTime1;

    const embeddingUsage = embeddingRes.usage || {};
    const embeddingTokens = embeddingUsage.total_tokens || 0;

    const embeddingCost = calculateCost({
      model: "text-embedding-3-small",
      promptTokens: embeddingTokens,
    });

    await AiUsage.create({
      userId: user.id,
      noteId: id,

      feature: "pdf-question",
      aiMode: "rag",
      operation: "embedding",

      model: "text-embedding-3-small",

      promptToken: embeddingTokens,
      completionToken: 0,
      totalTokens: embeddingTokens,

      costUSD: embeddingCost.totalCost,
      latencyMs,
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

    const topScore = chunks[0]?.score ?? 0;

    if (topScore < 0.2) {
      return NextResponse.json({
        answer:
          "I don’t have enough information in this document to answer that",
      });
    }

    // Build context from chunks
    const context = chunks
      .map((c, i) => `[Chunk ${i + 1}]\n${c.text}`)
      .join("\n\n---\n\n");

    // 3️⃣ Ask OpenAI with context
    console.log("💬 Generating answer with OpenAI...");

    const memories = await ConversationMemory.find({
      userId: user.id,
      noteId: id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const memoryContext =
      memories.length > 0
        ? memories
            .map(
              (m, i) =>
                `${i + 1}. User asked: "${m.question}" → AI answered: "${
                  m.answer
                }"`
            )
            .join("\n")
        : "No prior conversation.";

    const startTime2 = Date.now();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Answer questions using the document context and prior conversation if relevant. If the answer is not present, say you don't have enough information.",
        },
        {
          role: "user",
          content: `
      CONVERSATION MEMORY:
      ${memoryContext}
      
      DOCUMENT CONTEXT:
      ${context}
      
      QUESTION:
      ${question}
      `,
        },
      ],

      max_tokens: 500,
      temperature: 0.7,
    });

    // const topScore = chunks[0]?.score ?? 0;

    // if (topScore < 0.2) {
    //   answer =
    //     "I don’t have enough information in this document to answer that.";
    // }

    const generationLatencyMs = Date.now() - startTime2;

    const usage = completion.usage || {};

    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;

    const generationCost = calculateCost({
      model: "gpt-4o-mini",
      promptTokens,
      completionTokens,
    });

    await AiUsage.create({
      userId: user.id,
      noteId: id,

      feature: "pdf-question",
      aiMode: "rag",
      operation: "generation",

      model: "gpt-4o-mini",

      promptToken: promptTokens,
      completionToken: completionTokens,
      totalTokens: promptTokens + completionTokens,

      costUSD: generationCost.totalCost,
      latencyMs: generationLatencyMs,
    });

    const answer = completion.choices[0].message.content;

    await ConversationMemory.create({
      userId: user.id,
      noteId: id,
      question,
      answer,
    });

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
