import dbConnect from "../../../../backend/db";
import { NextResponse } from "next/server";
import Note from "../../../../backend/models/notes";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    await dbConnect();

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    console.log(data);
    // console.log(data);
    const note = await Note.create({
      title: data.note.title,
      content: data.note.content,
      userId: data.note.userId,
    });

    if (!note) {
      return NextResponse.json(
        { success: false, message: "Error in adding new note" },
        { status: 401 }
      );
    }

    // console.log(note);
    return NextResponse.json({ success: true }, { data: note, status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
