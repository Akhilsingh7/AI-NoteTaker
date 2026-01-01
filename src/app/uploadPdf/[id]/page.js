"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function uploadPdf() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();

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

      const res = await fetch("/api/ai/notes/uploadpdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccess("PDF uploaded and processed successfully ✅");
      setFile(null);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload PDF Notes</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full border p-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
        >
          {loading ? "Uploading & Processing..." : "Upload PDF"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-3">{error}</p>}

      {success && <p className="text-green-600 mt-3">{success}</p>}
    </div>
  );
}
