import { useState } from "react";

function SearchBar({ onSearch, onIngest, loading }) {
  const [query, setQuery] = useState("How can semantic search improve MongoDB retrieval?");

  const sampleDocs = [
    {
      title: "MongoDB Aggregation",
      content: "Aggregation pipelines transform and summarize data in multiple stages.",
      metadata: { topic: "mongodb" }
    },
    {
      title: "Embeddings",
      content: "Embeddings convert text into vectors for semantic similarity search.",
      metadata: { topic: "nlp" }
    }
  ];

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <button onClick={() => onIngest(sampleDocs)} disabled={loading}>
        Insert Sample Documents
      </button>

      <textarea
        rows={4}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask your query..."
        style={{ padding: "0.5rem" }}
      />

      <button onClick={() => onSearch(query)} disabled={loading}>
        Search
      </button>
    </div>
  );
}

export default SearchBar;
