import { NextResponse } from "next/server";
import dbConnect from "../../../../../backend/db";
import Note from "../../../../../backend/models/notes";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { currentUser } from "@clerk/nextjs/server";
import AiUsage from "../../../../../backend/models/AiUsage";
import { calculateCost, checkDailyLimit } from "@/lib/calcAiCost";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

const tools = [
  {
    functionDeclarations: [
      {
        name: "search_all_notes",
        description: "Search through all user's notes by keyword or topic",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search keyword or topic to find in notes",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "count_notes",
        description: "Count total notes or notes matching a specific topic",
        parameters: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              description:
                "Optional: topic to filter by. Leave empty to count all notes.",
            },
          },
          required: [],
        },
      },
      {
        name: "get_recent_notes",
        description: "Get the user's most recent notes",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description:
                "Number of recent notes to retrieve (default 5, max 10)",
            },
          },
          required: [],
        },
      },
    ],
  },
];

async function searchAllNotes(userId, query) {
  await dbConnect();
  const notes = await Note.find({
    userId: userId,
    $or: [
      { title: { $regex: query, $options: "i" } },
      { content: { $regex: query, $options: "i" } },
    ],
  }).limit(5);

  return {
    notes: notes,
    success: true,
  };
}

async function countNotes(userId, topic = null) {
  await dbConnect();
  let query = { userId: userId };

  if (topic) {
    query.$or = [
      { title: { $regex: topic, $options: "i" } },
      { content: { $regex: topic, $options: "i" } },
    ];
  }

  const count = await Note.countDocuments(query);
  return { count, topic: topic || "all notes" };
}

async function getRecentNotes(userId, limit = 5) {
  await dbConnect();

  const safeLimit = Math.min(Math.max(limit || 5, 1), 10);

  const notes = await Note.find({ userId: userId })
    .sort({ createdAt: -1 })
    .limit(safeLimit);

  return {
    notes,
  };
}

export async function POST(request, { params }) {
  try {
    let responseType = "text"; // Default
    await dbConnect();

    const user = await currentUser();

    const { question } = await request.json();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dailylimit = await checkDailyLimit(user.id);

    if (dailylimit >= 1) {
      return NextResponse.json(
        { success: false, message: "Daily AI usage limit reached" },
        { status: 429 }
      );
    }

    // const { id } = await params;
    // console.log("Fetching note with ID:", id);

    const startTime = Date.now();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      tools: tools,
    });

    const chat = model.startChat({
      history: [],
    });

    let result = await chat.sendMessage(question);
    let response = result.response;
    let structuredData = null;

    const functionCall = response.functionCalls()?.[0];

    const operation = functionCall ? "tool-call" : "generation";

    if (functionCall) {
      console.log("AI calling function:", functionCall.name);

      let functionResponse;

      switch (functionCall.name) {
        case "search_all_notes":
          functionResponse = await searchAllNotes(
            user.id,
            functionCall.args.query
          );
          structuredData = functionResponse;
          responseType = "search_all_notes"; // Set type

          break;

        case "count_notes":
          functionResponse = await countNotes(user.id, functionCall.args.topic);
          structuredData = functionResponse;
          responseType = "count_notes"; // Set type

          break;

        case "get_recent_notes":
          functionResponse = await getRecentNotes(
            user.id,
            functionCall.args.limit || 5
          );
          structuredData = functionResponse;
          responseType = "get_recent_notes"; // Set type

          break;

        default:
          functionResponse = { error: "Unknown function" };
      }

      console.log("Function result:", functionResponse);

      result = await chat.sendMessage([
        {
          functionResponse: {
            name: functionCall.name,
            response: functionResponse,
          },
        },
      ]);

      response = result.response;
    }

    const answer = response.text();

    console.log("responseis", answer);

    const latencyMs = Date.now() - startTime;
    const usage = response.usageMetadata || {};

    const promptTokens = usage.promptTokenCount || 0;
    const completionTokens = usage.candidatesTokenCount || 0;

    const cost = calculateCost({
      model: "gemini-2.5-flash-lite",
      promptTokens,
      completionTokens,
    });

    if (!answer) {
      return NextResponse.json(
        { success: false, message: "Failed to answer question" },
        { status: 500 }
      );
    }

    await AiUsage.create({
      userId: user.id,
      noteId: null,
      feature: "smart-assistant",
      aiMode: "agent",
      operation,
      model: "gemini-2.5-flash-lite",
      promptToken: promptTokens,
      completionToken: completionTokens,
      totalTokens: promptTokens + completionTokens,
      costUSD: cost.totalCost,
      latencyMs,
    });

    // console.log("data innn", data);
    const cleanAnswer = answer
      .replace(/<tool_code[^>]*>/g, "")
      .replace(/<\/tool_code>/g, "")
      .trim();

    return NextResponse.json({
      success: true,
      data: {
        functionCalled: responseType,
        message: cleanAnswer,
        structuredData: structuredData,
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
