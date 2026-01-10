import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
    },
    summaryStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "embedding", "completed", "failed"],
      default: "completed", // Text notes start as "completed"
    },
    source: {
      type: String,
      enum: ["manual", "pdf"],
      default: "manual",
    },
    metadata: {
      fileName: {
        type: String,
        default: null,
      },
      fileSize: {
        type: Number,
        default: null,
      },
      pageCount: {
        type: Number,
        default: null,
      },
      uploadedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Note || mongoose.model("Note", NoteSchema);
