"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function UploadPdf() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedNoteId, setUploadedNoteId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState("pending");

  const router = useRouter();

  // Check upload status (polling)
  const checkUploadStatus = async (noteId) => {
    try {
      console.log("🔍 Checking status for note:", noteId);

      const res = await fetch(
        `/api/ai/notes/uploadpdf/uploadpdf-status/${noteId}`
      );

      if (!res.ok) {
        console.error("Failed to check status");
        return;
      }

      const statusData = await res.json();
      console.log("📊 Status data:", statusData);

      if (statusData.success) {
        setProcessingStatus(statusData.status);

        if (
          statusData.status === "processing" ||
          statusData.status === "embedding"
        ) {
          setIsProcessing(true);
        } else if (statusData.status === "failed") {
          setIsProcessing(false);
          setError("PDF processing failed. Please try again.");
        } else if (statusData.status === "completed") {
          setIsProcessing(false);
          setSuccess("✅ PDF uploaded and processed successfully!");

          // Redirect to the note after 2 seconds
          setTimeout(() => {
            router.push(`/dashboard/note/${noteId}`);
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error checking upload status:", error);
      setError("Failed to check processing status");
    }
  };

  // Poll for status when processing
  useEffect(() => {
    if (isProcessing && uploadedNoteId) {
      console.log("🔄 Starting polling for note:", uploadedNoteId);

      // Poll every 3 seconds
      const interval = setInterval(() => {
        checkUploadStatus(uploadedNoteId);
      }, 3000);

      // Cleanup on unmount or when processing stops
      return () => {
        console.log("🛑 Stopping polling");
        clearInterval(interval);
      };
    }
  }, [isProcessing, uploadedNoteId]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("📤 Uploading PDF...");

      const res = await fetch("/api/ai/notes/uploadpdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("📥 Upload response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (data.success) {
        // Save the note ID for polling
        setUploadedNoteId(data.noteId);

        // Start processing state
        setIsProcessing(true);
        setProcessingStatus("processing");

        // Clear the file input
        setFile(null);

        console.log("✅ Upload started, noteId:", data.noteId);
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload PDF Notes</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select PDF File
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full border border-gray-300 rounded p-2 cursor-pointer"
            disabled={loading || isProcessing}
          />
          {file && (
            <p className="text-sm text-gray-600 mt-1">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || isProcessing || !file}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Uploading..."
            : isProcessing
            ? "Processing..."
            : "Upload PDF"}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">❌ {error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <p className="font-medium text-blue-800">Processing PDF...</p>
              <p className="text-sm text-blue-600">
                {processingStatus === "processing" &&
                  "Extracting text from PDF"}
                {processingStatus === "embedding" &&
                  "Creating embeddings for search"}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                This may take 1-2 minutes depending on PDF size
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-medium text-gray-900 mb-2">ℹ️ How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. Upload your PDF (max 10MB)</li>
          <li>2. Text is extracted automatically</li>
          <li>3. Content is processed for AI search</li>
          <li>4. You'll be redirected when complete</li>
        </ul>
      </div>
    </div>
  );
}
