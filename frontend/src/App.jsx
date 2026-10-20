import { useState } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import AppHeader from "./AppHeader";
import SearchBar from "./SearchBar";
import Results from "./Results";
import DocumentPreviewModal from "./DocumentPreviewModal";
import { ingestDocuments, semanticSearch } from "./api";

function App() {
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState({ text: "", type: "info" });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [searchStats, setSearchStats] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  async function handleIngest(documents) {
    setLoading(true);
    setStatus({
      text: "Generating 768-D vector embeddings and writing to MongoDB Atlas...",
      type: "info"
    });
    const startTime = performance.now();
    try {
      const data = await ingestDocuments(documents);
      const elapsed = Math.round(performance.now() - startTime);
      setStatus({
        text: `Successfully vectorized and indexed ${data.insertedCount} ${data.insertedCount === 1 ? "document" : "documents"} in MongoDB Atlas (${elapsed}ms).`,
        type: "success"
      });
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Document ingestion failed.";
      setStatus({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(query, minScore = 0.80, limit = 5) {
    setLoading(true);
    setStatus({
      text: "Vectorizing query and executing MongoDB $vectorSearch...",
      type: "info"
    });
    const startTime = performance.now();
    try {
      const data = await semanticSearch(query, limit, minScore);
      const elapsed = Math.round(performance.now() - startTime);
      setResults(data.results || []);
      setHasSearched(true);
      setSearchedQuery(query);
      setSearchStats({
        count: data.count,
        totalCandidates: data.totalCandidates,
        minScore: data.minScore,
        elapsed
      });

      if (data.count === 0) {
        setStatus({
          text: `Zero relevant documents found matching "${query}" (${elapsed}ms). Try broader concepts or lower the threshold.`,
          type: "info"
        });
      } else {
        const topScore = Number(data.results[0]?.score) || 0;
        if (topScore < 0.80) {
          setStatus({
            text: `Retrieved ${data.count} candidate(s) in ${elapsed}ms, but similarity is below the relevance threshold (top score: ${topScore.toFixed(4)}).`,
            type: "info"
          });
        } else {
          setStatus({
            text: `Found ${data.count} semantically relevant ${data.count === 1 ? "document" : "documents"} in ${elapsed}ms.`,
            type: "success"
          });
        }
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Vector search failed. Check your network or backend connection.";
      setStatus({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="main-content">
        <section className="lead-section">
          <h1 className="lead-title">Find what you need</h1>
          <p className="lead-subtitle">
            Query documents and technical notes by conceptual meaning and contextual similarity rather than brittle keyword matching.
          </p>
        </section>

        <SearchBar onSearch={handleSearch} onIngest={handleIngest} loading={loading} />

        {status.text && (
          <div className={`feedback-banner ${status.type}`} role="status">
            {status.type === "success" && <CheckCircle2 size={16} style={{ flexShrink: 0 }} />}
            {status.type === "error" && <AlertTriangle size={16} style={{ flexShrink: 0 }} />}
            {status.type === "info" && <Info size={16} style={{ flexShrink: 0 }} />}
            <span>{status.text}</span>
          </div>
        )}

        <Results
          items={results}
          loading={loading}
          hasSearched={hasSearched}
          searchedQuery={searchedQuery}
          searchStats={searchStats}
          onSelectDocument={(doc) => setSelectedDocument(doc)}
        />
      </main>

      {selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
}

export default App;
