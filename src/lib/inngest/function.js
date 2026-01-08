import { inngest } from "./client";
import dbConnect from "../../backend/db";
import Note from "../../backend/models/notes";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import NoteChunk from "../../backend/models/NoteChunk";
import { chunkText } from "../chunkTest";
import { extractText } from "unpdf";
import AiUsage from "../../backend/models/AiUsage";
import { calculateCost, checkDailyLimit } from "../calcAiCost";
import { use } from "react";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const summarizeNote = inngest.createFunction(
  {
    id: "summarize-note",
    name: "Summarize Note Content",
    retries: 3,
  },
  { event: "note/summarize.requested" }, // Listens for this event
  async ({ event, step }) => {
    const { noteId, userId } = event.data;

    try {
      // Step 1: Fetch the note

      const dailylimit = await checkDailyLimit(userId);

      if (dailylimit >= 1) {
        throw new Error("Daily limit reached ");
      }

      const note = await step.run("fetch-note", async () => {
        await dbConnect();
        const fetchedNote = await Note.findById(noteId);

        if (!fetchedNote) {
          throw new Error("Note not found");
        }
        if (fetchedNote.userId !== userId) {
          throw new Error("Unauthorized");
        }

        return fetchedNote;
      });

      console.log("notes", note);

      const startTime = Date.now();

      const summary = await step.run("generate-summary", async () => {
        const model = genAI.getGenerativeModel({
          model: "gemini-flash-latest",
        });

        const result = await model.generateContent(
          `Summarize the following note in 2-3 clear bullet points:\n\n${note.content}`
        );

        const latencyMs = Date.now() - startTime;
        const usage = result.response.usageMetadata || {};

        const promptTokens = usage.promptTokenCount || 0;
        const completionTokens = usage.candidatesTokenCount || 0;

        const cost = calculateCost({
          model: "gemini-flash-latest",
          promptTokens,
          completionTokens,
        });

        await AiUsage.create({
          userId: userId,
          noteId: noteId || null,
          feature: "note-summary",
          aiMode: "direct",
          operation: "generation",
          model: "gemini-flash-latest",
          promptToken: promptTokens,
          completionToken: completionTokens,
          totalTokens: promptTokens + completionTokens,
          costUSD: cost.totalCost,
          latencyMs,
        });

        return result.response.text();
      });

      await step.run("update-note", async () => {
        await dbConnect();
        await Note.findByIdAndUpdate(noteId, {
          summary,
          summaryStatus: "completed",
          updatedAt: new Date(),
        });
      });

      return { success: true, noteId, summary };
    } catch (error) {
      await step.run("mark-summary-failed", async () => {
        await dbConnect();
        await Note.findByIdAndUpdate(noteId, {
          summaryStatus: "failed",
          updatedAt: new Date(),
        });
      });

      throw error;
    }
  }
);

export const processPdf = inngest.createFunction(
  {
    id: "process-pdf",
    name: "Process Pdf",
    retries: 3,
  },
  {
    event: "pdf/process.requested",
  },
  async ({ event, step }) => {
    const { noteId, userId, fileName, fileSize, pdfBuffer } = event.data;

    const dailylimit = await checkDailyLimit(userId);

    if (dailylimit >= 1) {
      throw new Error("Daily Limit reached of AI");
    }

    const { fullText, totalPages } = await step.run(
      "extract-pdf-text",
      async () => {
        try {
          console.log("📄 Starting PDF extraction...");

          const buffer = Buffer.from(pdfBuffer, "base64");
          const uint8Array = new Uint8Array(buffer);

          const { text, totalPages } = await extractText(uint8Array);

          const fullText = Array.isArray(text) ? text.join(" ") : text;
          const cleanedText = fullText.replace(/\s+/g, " ").trim();

          console.log(
            `📝 Extracted ${cleanedText.length} characters from ${totalPages} pages`
          );

          if (!cleanedText || cleanedText.length < 50) {
            throw new Error(
              "PDF contains no readable text or text is too short"
            );
          }

          return { fullText: cleanedText, totalPages };
        } catch (error) {
          console.error("❌ PDF extraction failed:", error);

          await dbConnect();
          await Note.findByIdAndUpdate(noteId, {
            processingStatus: "failed",
          });

          throw error; // Re-throw so Inngest can retry
        }
      }
    );

    await step.run("save-extracted-text", async () => {
      try {
        console.log("💾 Saving extracted text to database...");

        await dbConnect();
        await Note.findByIdAndUpdate(noteId, {
          content: fullText,
          processingStatus: "embedding",
          "metadata.pageCount": totalPages,
        });

        console.log("✅ Text saved successfully");
      } catch (error) {
        console.error("❌ Failed to save text:", error);
        throw error;
      }
    });

    const chunks = await step.run("chunk-text", async () => {
      try {
        console.log("🔪 Chunking text...");

        const chunks = chunkText(fullText);

        console.log(`✅ Created ${chunks.length} chunks`);
        return chunks;
      } catch (error) {
        console.error("❌ Chunking failed:", error);
        throw error;
      }
    });

    await step.run("generate-embeddings", async () => {
      try {
        await dbConnect();

        console.log(`🧠 Generating embeddings for ${chunks.length} chunks...`);

        const BATCH_SIZE = 10; // Process 10 at a time
        let processedCount = 0;

        let total_tokens = 0;
        let totalLatency = 0;

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
          const batch = chunks.slice(i, i + BATCH_SIZE);

          console.log(
            `📊 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
              chunks.length / BATCH_SIZE
            )}`
          );

          // Create embeddings for this batch in parallel
          const embeddingPromises = batch.map(async (chunk, batchIdx) => {
            const chunkIndex = i + batchIdx;

            try {
              const startTime = Date.now();

              const embeddingRes = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk,
              });

              const embeddingTokens =
                embeddingRes.usage.total_tokens ??
                embeddingRes.usage.prompt_tokens ??
                0;

              total_tokens += embeddingTokens;
              totalLatency += Date.now() - startTime;

              return {
                noteId,
                userId,
                text: chunk,
                embedding: embeddingRes.data[0].embedding,
                chunkIndex,
              };
            } catch (error) {
              console.error(
                `❌ Failed to create embedding for chunk ${chunkIndex}:`,
                error
              );
              throw error;
            }
          });

          // Wait for all embeddings in this batch
          const embeddingData = await Promise.all(embeddingPromises);

          // Save batch to database
          await NoteChunk.insertMany(embeddingData);

          processedCount += batch.length;
          console.log(`✅ Embedded ${processedCount}/${chunks.length} chunks`);

          // Rate limiting: wait 200ms between batches
          if (i + BATCH_SIZE < chunks.length) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
        const cost = calculateCost({
          model: "text-embedding-3-small",
          promptTokens: total_tokens,
        });

        await AiUsage.create({
          userId,
          noteId,
          feature: "pdf-upload",
          aiMode: "rag",
          operation: "embedding",
          model: "text-embedding-3-small",
          promptToken: total_tokens,
          completionToken: 0,
          totalTokens: total_tokens,
          costUSD: cost.totalCost,
          latencyMs: totalLatency,
        });

        console.log("✅ All embeddings created successfully");
      } catch (error) {
        console.error("❌ Embedding generation failed:", error);

        // Mark as failed
        await dbConnect();
        await Note.findByIdAndUpdate(noteId, {
          processingStatus: "failed",
        });

        throw error;
      }
    });

    await step.run("mark-completed", async () => {
      try {
        console.log("✅ Marking PDF processing as complete...");

        await dbConnect();
        await Note.findByIdAndUpdate(noteId, {
          processingStatus: "completed",
          summaryStatus: "pending", // Ready for summarization
        });

        console.log("✅ PDF processing completed successfully");
      } catch (error) {
        console.error("❌ Failed to update completion status:", error);
        throw error;
      }
    });

    return {
      success: true,
      noteId,
      chunkCount: chunks.length,
      totalPages,
      textLength: fullText.length,
    };
  }
);
export default [summarizeNote, processPdf];
