"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Router from "next/router";
import { format } from "date-fns";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId, isLoaded, isSignedIn } = useAuth();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["notes"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/dashboard?page=${pageParam}`);
      if (res.status === 401) return { data: [] };
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage?.data?.hasMore ? allPages.length + 1 : undefined;
    },
  });

  console.log("data is ", data);

  const notes = data?.pages.flatMap((page) => page.data.notes) ?? [];

  if (isLoading) return <p className="text-center py-8">Loading...</p>;
  if (error)
    return <p className="text-center py-8 text-red-600">Error loading Notes</p>;

  console.log("user id is", userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>

          <div className="flex items-center justify-between gap-2">
            <Link href={`/uploadPdf/${userId ?? ""}`}>
              <Button variant="outline" size="default" disabled={!userId}>
                ➜ Upload-Pdf
              </Button>
            </Link>

            <Link href={`/dashboard/assistant/${userId ?? ""}`}>
              <Button variant="outline" size="default" disabled={!userId}>
                🧠 ASSISTANT
              </Button>
            </Link>

            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push("/dashboard/new")}
            >
              New Note
            </Button>
          </div>
        </div>

        {/* Notes List */}

        <div>
          {!isLoading && notes.length === 0 ? (
            <div>No notes are available please create notes</div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <Link
                  href={`/dashboard/note/${note._id}`}
                  className="block"
                  key={note._id}
                >
                  <Card
                    key={note._id}
                    className="p-6 hover:shadow-md transition-shadow cursor-pointer bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {note.title}
                        </h3>
                        {note?.source === "pdf" && (
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
                            📄 PDF
                          </span>
                        )}
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                          {note.content}
                        </p>
                      </div>
                      <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">
                        {format(new Date(note.updatedAt), "dd MMM yyyy")}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          {hasNextPage && (
            <Button
              className="mt-4"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading..." : "Load More"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
