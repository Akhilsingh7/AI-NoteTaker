"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

function CreateNote() {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { userId } = useAuth();

  const router = useRouter();

  const addMutation = useMutation({
    mutationFn: async (note) => {
      const res = await fetch("/api/dashboard/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        throw new Error("Network error");
      }
      const data = await res.json();
      console.log(data);
      if (!data.success) {
        throw new Error(data.message || "Failed to create note");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notes"]);
      toast.success("New Note has been added");
      router.push("/dashboard");
      setTitle("");
      setContent("");
    },
    onError: (error) => {
      toast.error("Error in adding new note");
      // console.error(error.message);
    },
  });

  const handleFormData = (e) => {
    e.preventDefault();
    addMutation.mutate({
      title: title,
      content: content,
      userId: userId,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-4 rounded-t-lg">
          <h1 className="text-2xl font-semibold">Create a New Note</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleFormData}>
          <div className="bg-white p-6 rounded-b-lg shadow-sm">
            {/* Title Field */}
            <div className="mb-6">
              <Label
                htmlFor="title"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Title
              </Label>
              <Input
                id="title"
                type="text"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter note title"
                className="w-full"
              />
            </div>

            {/* Content Field */}
            <div className="mb-6">
              <Label
                htmlFor="content"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Content
              </Label>
              <Textarea
                id="content"
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note..."
                className="w-full min-h-[200px] resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="px-6"
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? "Adding..." : "Add Note"}
              </Button>
              {/* <Button className="bg-blue-600 hover:bg-blue-700 px-6">
                Cancel
              </Button> */}
            </div>
          </div>
        </form>
        {addMutation.isError && (
          <p className="text-red-500 pt-2">{addMutation.error.message}</p>
        )}
      </div>
    </div>
  );
}

export default CreateNote;
