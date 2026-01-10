import dbConnect from "../../../../../backend/db";
import { NextResponse } from "next/server";
import Note from "../../../../../backend/models/notes";
import { currentUser } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import ConversationMemory from "../../../../../backend/models/ConversationMemory";
import AiUsage from "../../../../../backend/models/AiUsage";
import NoteChunk from "../../../../../backend/models/NoteChunk";
import { title } from "process";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    await dbConnect();

    const note = await Note.findById(id);

    if (!note) {
      return NextResponse.json(
        { success: false, message: "note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: note }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "you are not authorized to delete the note",
        },
        {
          status: 401,
        }
      );
    }

    const { noteType } = await request.json();

    const noteToDelete = await Note.findById(id);

    if (!noteToDelete) {
      return NextResponse.json(
        {
          success: false,
          message: "Note not found",
        },
        {
          status: 404,
        }
      );
    }

    if (noteToDelete.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to delete this note",
        },
        {
          status: 403,
        }
      );
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      await Note.deleteOne({ _id: noteToDelete._id }, { session });

      await ConversationMemory.deleteMany(
        { noteId: noteToDelete._id },
        { session }
      );

      await AiUsage.deleteMany({ noteId: noteToDelete._id }, { session });

      if (noteType === "pdf") {
        await NoteChunk.deleteMany({ noteId: noteToDelete._id }, { session });
      }

      await session.commitTransaction();
      session.endSession();

      return NextResponse.json(
        { success: true, message: "Note deleted successfully" },
        { status: 200 }
      );
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "you are not authorized to edit the note",
        },
        {
          status: 401,
        }
      );
    }

    const data = await request.json();

    const title = data.title?.trim();
    const content = data.content?.trim();

    if (!title || title.length === 0) {
      return NextResponse.json(
        { success: false, message: "Title is required" },
        { status: 400 }
      );
    }

    if (!content || content.length === 0) {
      return NextResponse.json(
        { success: false, message: "Content is required" },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { success: false, message: "Title too long (max 200 characters)" },
        { status: 400 }
      );
    }

    const note = await Note.findById(id);

    if (!note) {
      return NextResponse.json(
        {
          success: false,
          message: "No such note exist ",
        },
        {
          status: 401,
        }
      );
    }

    if (note.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You don't own this note" },
        { status: 403 }
      );
    }

    const titleChanged = note.title !== title;
    const contentChanged = note.content !== content;

    // If nothing changed, return early
    if (!titleChanged && !contentChanged) {
      return NextResponse.json(
        { success: true, message: "No changes detected" },
        { status: 200 }
      );
    }

    const updateData = {};

    if (titleChanged) {
      updateData.title = title;
    }

    if (contentChanged) {
      updateData.content = content;
      updateData.summary = null;
      updateData.summaryStatus = "pending";
    }

    const updatedNote = await Note.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (contentChanged) {
      await ConversationMemory.deleteMany({ noteId: id });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Note updated successfully",
        data: updatedNote,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(" Error updating note:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
