import dbConnect from "../../../../../backend/db";
import { NextResponse } from "next/server";
import Note from "../../../../../backend/models/notes";

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
