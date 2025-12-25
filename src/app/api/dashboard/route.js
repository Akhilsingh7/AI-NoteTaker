import dbConnect from "@/backend/db";
import { NextResponse } from "next/server";
import Note from "@/backend/models/notes";
import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    await dbConnect();

    const { userId } = await auth();

    console.log("user id is ", userId);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const notes = await Note.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
