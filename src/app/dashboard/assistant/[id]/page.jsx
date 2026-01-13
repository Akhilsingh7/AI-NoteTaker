"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import ResponseRenderer from "../../../../component/AssistantResponse";

function SmartAssistant() {
  const { id } = useParams();

  const [answer, setAnswer] = useState(null);
  const [question, setQuestion] = useState("");

  const questionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ai/assistant/${id}`, {
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
      console.log("ai dat is ", data.data);
      setAnswer(data.data);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to fetch anwser");
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["notes-default"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) return { data: [] };
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  console.log("data is", data);

  if (isLoading) return <p className="text-center py-8">Loading...</p>;
  if (error)
    return <p className="text-center py-8 text-red-600">Network Error</p>;

  const handleAskQuestion = () => {
    questionMutation.mutate({});
  };

  // const answer = "abibfjkaslcvd;vdsvnsvk,vdsvdvsdvsdvdsvd";
  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-8">
      <div className="max-w-full sm:max-w-2xl mx-auto">
        {/* Header */}
        {data?.data?.notes?.length > 0 ? (
          <Card className="bg-gray-50 border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-2 border-y-slate-500 rounded-full flex items-center justify-center text-2xl">
                🧠
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Smart Note Assistant
              </h2>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
              {/* Question Input */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                <Input
                  type="text"
                  placeholder="Lets have fun..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAskQuestion()}
                  disabled={questionMutation.isPending}
                  className="flex-1 w-full"
                />
                <Button
                  onClick={handleAskQuestion}
                  disabled={!question.trim() || questionMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  {questionMutation.isPending ? "Asking..." : "Ask"}
                </Button>
              </div>

              {/* Answer Display */}
              {/* {answer && (
              <div className="mt-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-gray-700 mb-3">{answer}</p>
                </div>
              </div>
            )} */}

              <div className="relative">
                {questionMutation.isPending && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin">⚙️</div>
                      <p>Loading...</p>
                    </div>
                  </div>
                )}

                {answer && <ResponseRenderer response={answer} />}
              </div>

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
                  Hii Im your smart Assistant for all your notes
                </p>
              )}
            </div>
          </Card>
        ) : (
          <div>Please Create Notes to use Smart Assistant</div>
        )}
      </div>
    </div>
  );
}

export default SmartAssistant;
