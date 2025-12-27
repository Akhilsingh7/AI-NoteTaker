import { NextResponse } from "next/server";
import dbConnect from "../../../../../backend/db";
import Note from "../../../../../backend/models/notes";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { currentUser } from "@clerk/nextjs/server";

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

    // Use Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `Based on this note:\n\n${note.content}\n\nAnswer this question: ${question}`;

    const result = await model.generateContent(prompt);

    const answer = result.response.text();
    console.log("Answer generated successfully");

    if (!answer) {
      return NextResponse.json(
        { success: false, message: "Failed to answer question" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        answer: answer,
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
