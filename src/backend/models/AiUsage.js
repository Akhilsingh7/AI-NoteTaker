import mongoose from "mongoose";

const AiUsageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
    },

    feature: {
      type: String,
      enum: [
        "pdf-upload",
        "note-summary",
        "note-question",
        "pdf-question",
        "smart-assistant",
      ],
      required: true,
    },

    aiMode: {
      type: String,
      enum: ["direct", "rag", "agent"],
      required: true,
    },

    operation: {
      type: String,
      enum: ["embedding", "generation", "retrieval", "tool-call"],
    },

    model: String,

    promptToken: Number,
    completionToken: Number,
    totalTokens: Number,

    costUSD: Number,
    latencyMs: Number,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AiUsage ||
  mongoose.model("AiUsage", AiUsageSchema);
