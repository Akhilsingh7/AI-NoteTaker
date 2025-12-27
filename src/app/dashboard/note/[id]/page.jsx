"use client";
import { Card } from "@/components/ui/card";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function NoteDetail() {
  const { id } = useParams();

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/note/${id}`);
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch note");
      return res.json();
    },
    enabled: !!id,
  });

  const aiMutation = useMutation({
    mutationFn: async (noteId) => {
      const res = await fetch(`/api/ai/summarize/${noteId}`, {
        method: "PATCH",
      });
      if (!res.ok) {
        throw new Error("Failed to generate summary");
      }
      const data = await res.json();
      console.log(data);
      if (!data.success) {
        throw new Error(data.message || "Failed to summarize note");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["note", id]);
    },
    onError: (error) => {
      toast.error("Error in Generating summary");
      console.error(error.message);
    },
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading Notes</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {data?.data?.title}
        </h1>

        {/* Content */}
        <div className="mb-8">
          <p className="text-gray-700 text-lg leading-relaxed">
            {data?.data?.content}
          </p>
        </div>

        {/* AI Summary Section */}
        <Card className="bg-gray-50 border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">AI Summary</h2>
            <Button
              onClick={() => aiMutation.mutate(id)}
              disabled={aiMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {aiMutation.isPending ? "Generating..." : "Generate Summary"}
            </Button>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            {/* Show summary if it exists */}
            {data?.data?.summary ? (
              <>
                <p className="text-gray-600 mb-4">
                  Here's the AI-generated summary of this note:
                </p>
                <div className="text-gray-700 whitespace-pre-line">
                  {data.data.summary}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center">
                No summary yet. Click "Generate Summary" to create one.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default NoteDetail;
