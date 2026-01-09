"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function NoteDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const router = useRouter();

  // NEW: State for summary polling
  const [summaryStatus, setSummaryStatus] = useState("pending");
  const [isPolling, setIsPolling] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: async (type) => {
      const res = await fetch(`/api/dashboard/note/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteType: type }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete note");
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to delete note");
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["note", id] });
      toast.success(data.message || "Note deleted successfully");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error("error in deleting note");
      console.error(error.message);
    },
  });

  useEffect(() => {
    if (data?.data?.summaryStatus) {
      setSummaryStatus(data.data.summaryStatus);

      // If status is "processing", start polling immediately
      if (data.data.summaryStatus === "processing") {
        setIsPolling(true);
      }
    }
  }, [data?.data?.summaryStatus]);

  const checkSummaryStatus = async () => {
    try {
      const res = await fetch(`/api/ai/summarize/${id}/summary-status`);
      const statusData = await res.json();

      if (statusData.success) {
        setSummaryStatus(statusData.status);

        // If completed or failed, stop polling and refetch note
        if (
          statusData.status === "completed" ||
          statusData.status === "failed"
        ) {
          setIsPolling(false);
          queryClient.invalidateQueries({ queryKey: ["note", id] });

          if (statusData.status === "completed") {
            toast.success("Summary generated successfully!");
          } else {
            toast.error("Summary generation failed. Please try again.");
          }
        }
      }
    } catch (error) {
      console.error("Error checking summary status:", error);
    }
  };

  useEffect(() => {
    if (isPolling && summaryStatus === "processing") {
      const interval = setInterval(checkSummaryStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isPolling, summaryStatus, id]);

  const aiMutation = useMutation({
    mutationFn: async (noteId) => {
      const res = await fetch(`/api/ai/summarize/${noteId}`, {
        method: "POST",
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
      setSummaryStatus("processing");
      setIsPolling(true);
      toast.success("Summary generation started!");
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  const handleAskQuestion = async (source) => {
    if (!question.trim()) return;

    setAnswer("");
    setIsStreaming(true);

    try {
      const noteType = source;

      const endpoint =
        noteType === "pdf"
          ? `/api/ai/notes/askPdf/${id}`
          : `/api/ai/questions/${id}`;

      console.log(`Using ${noteType} endpoint:`, endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to fetch answer");
        setIsStreaming(false);
        return;
      }

      if (noteType === "pdf") {
        const data = await res.json();
        setAnswer(data.answer);
        setQuestion(""); // Clear question
        toast.success("Answer generated!");
      } else {
        if (!res.body) {
          toast.error("No response body");
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setAnswer(fullText); // UI updates live
        }

        setQuestion(""); // Clear question
        toast.success("Answer generated!");
      }
    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Failed to get answer");
    } finally {
      setIsStreaming(false);
    }
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
        <div className="flex justify-between">
          <h1 className="text-4xl font-bold text-gray-900">
            {data?.data?.title}
          </h1>
          <div>
            <Button
              size="default"
              className="bg-red-400 hover:bg-red-500"
              onClick={() => deleteMutation.mutate(data?.data?.source)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>

        {data?.data?.source === "pdf" && (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
            PDF
          </span>
        )}

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

            {/* UPDATED: Button shows different states */}
            <Button
              onClick={() => aiMutation.mutate(id)}
              disabled={aiMutation.isPending || summaryStatus === "processing"}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {aiMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Starting...
                </>
              ) : summaryStatus === "processing" ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Processing...
                </>
              ) : (
                "Generate Summary"
              )}
            </Button>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            {/* UPDATED: Show processing state */}
            {summaryStatus === "processing" && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600 font-medium">
                  Generating summary in background...
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  This may take up to 30 seconds. You can navigate away and come
                  back.
                </p>
              </div>
            )}

            {/* UPDATED: Show failed state */}
            {summaryStatus === "failed" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 font-medium mb-2">
                  Failed to generate summary
                </p>
                <p className="text-red-500 text-sm mb-4">
                  Something went wrong. Please try again.
                </p>
                <Button
                  onClick={() => aiMutation.mutate(id)}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* UPDATED: Show completed summary */}
            {summaryStatus === "completed" && data?.data?.summary ? (
              <>
                <p className="text-gray-600 mb-4">
                  Here's the AI-generated summary of this note:
                </p>
                <div className="text-gray-700 whitespace-pre-line">
                  {data.data.summary}
                </div>
              </>
            ) : summaryStatus === "pending" ? (
              <p className="text-gray-500 text-center">
                No summary yet. Click "Generate Summary" to create one.
              </p>
            ) : null}
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
                onKeyPress={(e) =>
                  e.key === "Enter" && handleAskQuestion(data?.data?.source)
                }
                className="flex-1"
              />
              <Button
                onClick={() => handleAskQuestion(data?.data?.source)}
                disabled={isStreaming || !question.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isStreaming ? "Thinking..." : "Ask"}
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

            {/* {questionMutation.isError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">
                  {questionMutation.error?.message || "Failed to get answer"}
                </p>
              </div>
            )} */}

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
