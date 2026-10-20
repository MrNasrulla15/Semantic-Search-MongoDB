import { useState } from "react";
import { Search as SearchIcon, X, Plus } from "lucide-react";

const SAMPLE_DOCS = [
  {
    title: "MongoDB Aggregation",
    content: "Aggregation pipelines transform and summarize data in multiple stages.",
    metadata: { topic: "mongodb" }
  },
  {
    title: "Embeddings",
    content: "Embeddings convert text into vectors for semantic similarity search.",
    metadata: { topic: "nlp" }
  },
  {
    title: "Vector Indexing",
    content: "Atlas Vector Search uses HNSW graphs for high-speed approximate nearest neighbor queries.",
    metadata: { topic: "database" }
  }
];

const PROMPT_SUGGESTIONS = [
  "How can semantic search improve MongoDB retrieval?",
  "How do vector embeddings work?",
  "Tell me about aggregation pipelines"
];

export function SearchBar({ onSearch, onIngest, loading }) {
  const [query, setQuery] = useState("How can semantic search improve MongoDB retrieval?");
  const [minScore, setMinScore] = useState(0.80);
  const [limit, setLimit] = useState(5);
  const [showCustomIngest, setShowCustomIngest] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && query.trim()) {
        onSearch(query.trim(), minScore, limit);
      }
    }
  };

  const handleSearchSubmit = () => {
    if (!loading && query.trim()) {
      onSearch(query.trim(), minScore, limit);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customContent.trim()) return;
    onIngest([
      {
        title: customTitle.trim() || "Untitled Note",
        content: customContent.trim(),
        metadata: { category: customCategory.trim() || "general" }
      }
    ]);
    setCustomTitle("");
    setCustomContent("");
    setCustomCategory("");
    setShowCustomIngest(false);
  };

  return (
    <div className="search-container">
      <div className="chips-row">
        <span className="chips-label">Suggested:</span>
        {PROMPT_SUGGESTIONS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            className="chip-btn"
            onClick={() => {
              setQuery(prompt);
              onSearch(prompt, minScore, limit);
            }}
            disabled={loading}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="search-input-wrapper">
        <SearchIcon size={17} className="search-icon" aria-hidden="true" />
        <textarea
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your query..."
          className="query-textarea"
          disabled={loading}
          aria-label="Search query"
        />
        {query && !loading && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="query-clear-btn"
            title="Clear query"
            aria-label="Clear query"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="actions-row">
        <div className="actions-left">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSearchSubmit}
            disabled={loading || !query.trim()}
          >
            {loading && <span className="spinner" style={{ width: 13, height: 13 }} />}
            Search
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onIngest(SAMPLE_DOCS)}
            disabled={loading}
          >
            Insert Sample Documents
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <select
              className="select-control"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              disabled={loading}
              title="Filter results by minimum semantic confidence threshold"
              aria-label="Relevance threshold"
            >
              <option value={0.80}>Threshold: Relevant (≥ 0.80)</option>
              <option value={0.85}>Threshold: High Precision (≥ 0.85)</option>
              <option value={0}>Threshold: All (Raw Nearest)</option>
            </select>

            <select
              className="select-control"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              disabled={loading}
              title="Number of results to retrieve"
              aria-label="Result limit"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          </div>
        </div>

        <div className="actions-right">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowCustomIngest(!showCustomIngest)}
            disabled={loading}
          >
            <Plus size={14} />
            {showCustomIngest ? "Close Custom" : "+ Add Custom Document"}
          </button>
        </div>
      </div>

      {showCustomIngest && (
        <form onSubmit={handleCustomSubmit} className="custom-ingest-drawer">
          <div className="drawer-header">
            <span className="drawer-title">Ingest Custom Knowledge Item</span>
            <button
              type="button"
              className="query-clear-btn"
              onClick={() => setShowCustomIngest(false)}
            >
              <X size={15} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Document Title (optional)"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="form-control-input"
          />

          <textarea
            placeholder="Document Content (required, minimum 5 characters)..."
            rows={3}
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            className="form-control-input"
            required
          />

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Topic / Category Tag (e.g. architecture)"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="form-control-input"
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !customContent.trim()}
            >
              Save & Embed
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default SearchBar;
