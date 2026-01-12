import React, { useState } from "react";
import { Button } from "@/components/ui/button";

function ReadMore({ text = "", max = 300 }) {
  const [expanded, setExpanded] = useState(false);

  if (text?.length <= max) {
    return <p className="text-gray-700 text-lg leading-relaxed">{text}</p>;
  }
  return (
    <>
      <p className="text-gray-700 text-lg leading-relaxed">
        {expanded ? text : text.slice(0, max) + "...  "}
        <span
          className="text-red-300 hover:cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? " read less" : " read more"}
        </span>
      </p>
    </>
  );
}

export default ReadMore;
