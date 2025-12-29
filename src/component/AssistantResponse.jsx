import { Card } from "@/components/ui/card";
import { format } from "path";

function ResponseRenderer({ response }) {
  // console.log("response is", response);
  const { message, functionCalled, structuredData } = response;

  console.log("message isss", message);
  console.log("functionCalled isss", functionCalled);
  console.log("structuredData isss", structuredData);

  return (
    <div className="space-y-4">
      {/* Always show AI's message */}
      <Card className="p-4 bg-purple-50">
        <p className="text-gray-700">{message}</p>
      </Card>

      {/* Show structured data if available */}
      {functionCalled === "search_all_notes" && structuredData && (
        <div className="space-y-2">
          {structuredData.notes.map((note) => (
            <Card
              key={note._id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {note.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {note.content}
                  </p>
                </div>
                <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">
                  {format(new Date(note.updatedAt), "dd MMM yyyy")}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {functionCalled === "count_notes" && structuredData && (
        <Card className="p-6 bg-blue-50 text-center">
          <div className="text-5xl font-bold text-blue-600">
            {structuredData.count}
          </div>
          <p className="text-gray-600 mt-2">
            notes about {structuredData.topic}
          </p>
        </Card>
      )}

      {functionCalled === "get_recent_notes" && structuredData && (
        <div className="space-y-2">
          {structuredData.notes.map((note) => (
            <Card
              key={note._id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {note.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {note.content}
                  </p>
                </div>
                <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">
                  {format(new Date(note.updatedAt), "dd MMM yyyy")}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResponseRenderer;
