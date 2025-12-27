import { NextResponse } from "next/server";
import dbConnect from "../../../../../backend/db";
import Note from "../../../../../backend/models/notes";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { currentUser } from "@clerk/nextjs/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export async function PATCH(request, { params }) {
  try {
    await dbConnect();

    const user = await currentUser();

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
        { success: false, message: "Note has no content to summarize" },
        { status: 400 }
      );
    }

    console.log("Calling Google Gemini API...");
    console.log("Content length:", note.content.length);

    // Use Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent(
      `Summarize the following note in 2-3 clear bullet points:\n\n${note.content}`
    );

    const summary = result.response.text();
    console.log("Summary generated successfully");

    if (!summary) {
      return NextResponse.json(
        { success: false, message: "Failed to generate summary" },
        { status: 500 }
      );
    }

    console.log("Updating note in database...");
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      { summary, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedNote) {
      return NextResponse.json(
        { success: false, message: "Failed to update note" },
        { status: 500 }
      );
    }

    console.log("Note updated successfully");
    return NextResponse.json({
      success: true,
      data: {
        id: updatedNote._id,
        summary: updatedNote.summary,
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
