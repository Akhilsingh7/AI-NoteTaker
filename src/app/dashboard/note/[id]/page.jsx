"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function NoteDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

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
      if (!data.success) {
        throw new Error(data.message || "Failed to summarize note");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["note", id],
      });
      toast.success("Summary generated successfully!");
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  const questionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ai/questions/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        throw new Error("Failed to generate answer");
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to get answer");
      }
      return data;
    },
    onSuccess: (data) => {
      setAnswer(data.data?.answer);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to fetch anwser");
    },
  });
  const handleAskQuestion = () => {
    if (!question.trim()) return;
    questionMutation.mutate();
  };

  // Handler to save answer (placeholder)
  const handleSaveAnswer = () => {
    console.log("Answer saved:", answer);
    alert("Answer saved! (Feature coming soon)");
  };

  if (isLoading) return <p className="text-center py-8">Loading...</p>;
  if (error)
    return <p className="text-center py-8 text-red-600">Error loading Notes</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900">
          {data?.data?.title}
        </h1>

        {/* Content */}
        <div>
          <p className="text-gray-700 text-lg leading-relaxed">
            {data?.data?.content}
          </p>
        </div>

        {/* AI Summary Section */}
        <Card className="bg-gray-50 border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
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
            </div>
            <Button
              onClick={() => aiMutation.mutate(id)}
              disabled={aiMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {aiMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Generating...
                </>
              ) : (
                "Generate Summary"
              )}
            </Button>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
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

        {/* Ask About This Note Section */}
        <Card className="bg-gray-50 border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
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
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Ask About This Note
            </h2>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            {/* Question Input */}
            <div className="flex gap-3 mb-4">
              <Input
                type="text"
                placeholder="Ask about this note..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAskQuestion()}
                disabled={questionMutation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleAskQuestion}
                disabled={!question.trim() || questionMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {questionMutation.isPending ? "Asking..." : "Ask"}
              </Button>
            </div>

            {/* Answer Display */}
            {answer && (
              <div className="mt-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-gray-700 mb-3">{answer}</p>
                  <Button
                    onClick={handleSaveAnswer}
                    variant="outline"
                    size="sm"
                    className="text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    <span className="mr-1">⭐</span>
                    Save Answer
                  </Button>
                </div>
              </div>
            )}

            {questionMutation.isError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">
                  {questionMutation.error?.message || "Failed to get answer"}
                </p>
              </div>
            )}

            {/* Placeholder when no answer */}
            {!answer && (
              <p className="text-gray-400 text-sm text-center mt-2">
                Ask a question about your note to get AI-powered answers
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default NoteDetail;
