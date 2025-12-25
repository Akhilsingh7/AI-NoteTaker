"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Router from "next/router";

// Sample notes data - replace with actual data later
const notes = [
  {
    id: 1,
    title: "React Hooks Overview",
    preview:
      "Let ing bounfra veiod the maliga from where you te creating your notes from degative a yet Premeselny.",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    title: "Next.js Routing Tips",
    preview:
      "Next js bieous somse the mo eficy from the bauce of importence. React s from ontaoled and Contrarles.",
    timestamp: "2 hours ago",
  },
  {
    id: 3,
    title: "API Best Practices",
    preview:
      "Daint the tomaveilon assail In chedy maga and ascrenings pooking from pinaties the times To implocations.",
    timestamp: "2 hours ago",
  },
];

function Dashboard() {
  const router = new useRouter();
  const queryClient = useQueryClient();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/dashboard/new")}
          >
            New Note
          </Button>
        </div>

        {/* Notes List */}
        <div className="space-y-4">
          {notes.map((note) => (
            <Card
              key={note.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {note.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {note.preview}
                  </p>
                </div>
                <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">
                  {note.timestamp}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
