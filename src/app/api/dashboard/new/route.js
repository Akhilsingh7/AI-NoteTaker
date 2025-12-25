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
    // const note = await Note.create({
    //   title: data.todo,
    //   userId: user.id,
    // });

    // console.log(note);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
