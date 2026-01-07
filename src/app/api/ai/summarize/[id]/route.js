import { NextResponse } from "next/server";
import dbConnect from "../../../../../backend/db";
import Note from "../../../../../backend/models/notes";
import { currentUser } from "@clerk/nextjs/server";
import { inngest } from "@/lib/inngest/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export async function POST(request, { params }) {
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

    await Note.findByIdAndUpdate(id, {
      summaryStatus: "processing",
    });

    if (!note.content || note.content.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Note has no content to summarize" },
        { status: 400 }
      );
    }

    await inngest.send({
      name: "note/summarize.requested",
      data: {
        noteId: id,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Summary generation started",
      status: "processing",
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
