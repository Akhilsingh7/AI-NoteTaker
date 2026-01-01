import mongoose from "mongoose";

const NoteChunkSchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number], // vector embedding
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.NoteChunk ||
  mongoose.model("NoteChunk", NoteChunkSchema);
