import { NextResponse } from "next/server";
import dbConnect from "../../../../../../backend/db";
import Note from "../../../../../../backend/models/notes";
import { currentUser } from "@clerk/nextjs/server";

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { id } = await params;
    const note = await Note.findById(id);

    if (!note || note.userId !== user.id) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: note.summaryStatus,
      summary: note.summary,
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
