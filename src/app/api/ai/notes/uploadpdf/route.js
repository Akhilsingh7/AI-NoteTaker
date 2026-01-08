import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import dbConnect from "../../../../../backend/db";
import { chunkText } from "../../../../../lib/chunkTest";
import NoteChunk from "../../../../../backend/models/NoteChunk";
import Note from "../../../../../backend/models/notes";
import { inngest } from "@/lib/inngest/client";
import OpenAI from "openai";
// import pdf from "pdf-parse";
import { extractText } from "unpdf";
import { checkDailyLimit } from "@/lib/calcAiCost";

// ✅ FIX: Import pdf-parse correctly for Node.js

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    await dbConnect();

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No PDF uploaded" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files allowed" },
        { status: 400 }
      );
    }

    // ✅ Add file size validation (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Check daily AI usage limit before processing
    const dailyLimit = await checkDailyLimit(user.id);
    if (dailyLimit >= 1) {
      return NextResponse.json(
        { error: "Daily AI usage limit reached" },
        { status: 429 }
      );
    }

    console.log("📄 Processing PDF:", file.name);

    // 1️⃣ Read PDF
    // 1️⃣ Read PDF correctly for unpdf
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const note = await Note.create({
      title: file.name.replace(".pdf", ""),
      content: "",
      source: "pdf",
      userId: user.id,
      processingStatus: "processing",
      summaryStatus: "pending",
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
      },
    });

    await inngest.send({
      name: "pdf/process.requested",
      data: {
        noteId: note._id.toString(),
        userId: user.id,
        fileName: file.name,
        fileSize: file.size,
        pdfBuffer: buffer.toString("base64"),
      },
    });

    return NextResponse.json({
      success: true,
      noteId: note._id,
      message: "PDF uploaded. Processing in background...",
      status: "processing",
    });

    // const uint8Array = new Uint8Array(arrayBuffer);

    // const { text, totalPages } = await extractText(uint8Array);

    // const fullText = Array.isArray(text) ? text.join(" ") : text;
    // const cleanedText = fullText.replace(/\s+/g, " ").trim();

    // console.log(`📝 Extracted ${cleanedText.length} characters`);

    // if (!cleanedText || cleanedText.length < 50) {
    //   return NextResponse.json(
    //     { error: "PDF contains no readable text" },
    //     { status: 400 }
    //   );
    // }

    // // 2️⃣ Save NOTE
    // const note = await Note.create({
    //   title: file.name.replace(".pdf", ""),
    //   content: cleanedText,
    //   source: "pdf",
    //   userId,
    //   metadata: {
    //     pageCount: totalPages,
    //     fileSize: file.size,
    //   },
    // });

    // console.log("✅ Note created:", note._id);

    // // 3️⃣ Chunk text
    // const chunks = chunkText(cleanedText);
    // console.log(`🔪 Created ${chunks.length} chunks`);

    // // 4️⃣ Create embeddings + insert noteChunks
    // console.log("🧠 Generating embeddings...");

    // for (let i = 0; i < chunks.length; i++) {
    //   const chunk = chunks[i];

    //   console.log(`Embedding chunk ${i + 1}/${chunks.length}`);

    //   const embeddingRes = await openai.embeddings.create({
    //     model: "text-embedding-3-small",
    //     input: chunk,
    //   });

    //   await NoteChunk.create({
    //     noteId: note._id,
    //     userId,
    //     text: chunk,
    //     embedding: embeddingRes.data[0].embedding,
    //   });

    //   // Rate limiting: wait 100ms between API calls
    //   if (i < chunks.length - 1) {
    //     await new Promise((resolve) => setTimeout(resolve, 100));
    //   }
    // }

    // console.log("✅ All embeddings created");

    // return NextResponse.json({
    //   success: true,
    //   noteId: note._id,
    //   chunkCount: chunks.length,
    //   pageCount: totalPages,
    // });
  } catch (error) {
    console.error("❌ PDF Upload Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to process PDF",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
