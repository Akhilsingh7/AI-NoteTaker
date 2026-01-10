import dbConnect from "@/backend/db";
import { NextResponse } from "next/server";
import Note from "@/backend/models/notes";
import { auth } from "@clerk/nextjs/server";

export async function GET(request) {
  try {
    await dbConnect();
    const { userId } = await auth();

    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);

    const skip = (page - 1) * limit;

    console.log("user id is ", userId);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const notes = await Note.find({ userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Note.countDocuments({ userId: userId });

    console.log(notes);

    return NextResponse.json({
      success: true,
      data: {
        notes,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("API Error:", error);

    // Check if it's a MongoDB connection error
    if (
      error.message?.includes("MongoDB") ||
      error.message?.includes("Atlas") ||
      error.message?.includes("whitelist")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Database connection failed. Please check your MongoDB connection string and IP whitelist settings.",
          details: error.message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
