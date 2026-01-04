import { NextResponse } from "next/server";
import dbConnect from "../../../../../backend/db";
import Note from "../../../../../backend/models/notes";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { currentUser } from "@clerk/nextjs/server";
import ConversationMemory from "../../../../../backend/models/ConversationMemory";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export async function POST(request, { params }) {
  try {
    await dbConnect();

    const user = await currentUser();

    const { question } = await request.json();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    console.log("Fetching note with ID:", id);

    const note = await Note.findById(id);

    if (!note) {
      return NextResponse.json(
        { success: false, message: "Note not found" },
        { status: 404 }
      );
    }

    if (note.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You don't own this note" },
        { status: 403 }
      );
    }

    if (!note.content || note.content.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Note has no content to answer question" },
        { status: 400 }
      );
    }

    console.log("Calling Google Gemini API...");
    console.log("Content length:", note.content.length);

    // const models = await genAI.listModels();
    // console.log(models);

    const memories = await ConversationMemory.find({
      userId: user.id,
      noteId: id,
    })
      .sort({ createdAt: -1 })
      .limit(5);

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

    // Use Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // const prompt = `Based on this note:\n\n${note.content}\n\nAnswer this question: ${question}`;

    const prompt = `
      You are a helpful assistant answering questions about a note.

      CONVERSATION CONTEXT (memory):
      ${memoryContext}

      NOTE CONTENT:
      ${note.content.slice(0, 4000)} 

      INSTRUCTIONS:
      - Use the conversation context if relevant
      - Stay consistent with previous answers
      - If the answer is not in the note, say "I don't know"

      USER QUESTION:
      ${question}
      `;

    const stream = await model.generateContentStream(prompt);

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let fullAnswer = "";
          for await (const chunk of stream.stream) {
            const text = chunk.text();
            if (text) {
              fullAnswer += text;
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close(); // ✅ FIX: Close the stream!
          await ConversationMemory.create({
            userId: user.id,
            noteId: id,
            question,
            answer: fullAnswer,
          });
        } catch (error) {
          controller.error(error); // ✅ Handle errors in stream
        }
      },
    });

    // const answer = readableStream;
    console.log("Answer generated successfully");

    // if (!answer) {
    //   return NextResponse.json(
    //     { success: false, message: "Failed to answer question" },
    //     { status: 500 }
    //   );
    // }

    // return NextResponse.json({
    //   success: true,
    //   data: {
    //     answer: answer,
    //   },
    // });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("=== ERROR DETAILS ===");
    console.error("Error message:", error.message);
    console.error("Error type:", error.constructor.name);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
