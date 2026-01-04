// models/ConversationMemory.ts
import mongoose from "mongoose";

const ConversationMemorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number, // 0 → 1
    },
  },
  { timestamps: true }
);

export default mongoose.models.ConversationMemory ||
  mongoose.model("ConversationMemory", ConversationMemorySchema);
