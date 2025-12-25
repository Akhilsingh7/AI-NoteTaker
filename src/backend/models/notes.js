import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Note || mongoose.model("Note", NoteSchema);
