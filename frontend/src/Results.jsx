import { useState } from "react";
import { Search, Sparkles, Info, Copy, Check, ExternalLink } from "lucide-react";

function Results({
  items,
  loading = false,
  hasSearched = false,
  searchedQuery = "",
  searchStats = null,
  onSelectDocument
}) {
  const [copiedId, setCopiedId] = useState(null);

  if (loading) {
    return (
      <div className="results-section">
        <div className="results-meta-header">
          <div className="results-title-group">
            <h2 className="results-heading">Searching Vector Index...</h2>
            <span className="results-count-tag">768-D Space</span>
          </div>
        </div>
        <div className="results-list" aria-busy="true" aria-label="Loading search results">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line" style={{ width: "32%", height: 18 }} />
              <div className="skeleton-line" style={{ width: "95%", height: 13 }} />
              <div className="skeleton-line" style={{ width: "80%", height: 13 }} />
              <div className="skeleton-line" style={{ width: "22%", height: 11, marginTop: 4 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    if (hasSearched) {
      return (
        <div className="state-box">
          <div className="state-icon-wrap" style={{ color: "var(--accent-primary)" }}>
            <Search size={22} />
          </div>
          <h3 className="state-title">No relevant documents found</h3>
          <p className="state-description">
            We couldn't find information matching{" "}
            <strong style={{ color: "var(--text-primary)" }}>"{searchedQuery}"</strong> with sufficient
            conceptual similarity in the available collection.
          </p>

          <div className="state-guidance">
            <div className="state-guidance-title">
              <Sparkles size={14} style={{ color: "var(--accent-primary)" }} />
              <span>Semantic Honesty & Recommended Next Steps</span>
            </div>
            <ul>
              <li>
                <strong>Semantic Honesty:</strong> Rather than returning unrelated documents as false positives,
                the system reports zero matches when similarity scores are below the confidence threshold.
              </li>
              <li>
                <strong>Broaden your query:</strong> Try phrasing your question with broader technical concepts
                or alternative terminology.
              </li>
              <li>
                <strong>Adjust threshold:</strong> Lower the relevance threshold selector above to{" "}
                <em>All (Raw Nearest)</em> to inspect nearest vector neighbors in high-dimensional space.
              </li>
              <li>
                <strong>Expand the knowledge base:</strong> Use the <em>+ Add Custom Document</em> button above
                to ingest notes or documentation on this topic.
              </li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="state-box">
        <div className="state-icon-wrap">
          <Search size={20} />
        </div>
        <h3 className="state-title">No results yet.</h3>
        <p className="state-description">
          Insert sample documents or add your own, then type a natural-language query to explore vector semantic search.
        </p>
      </div>
    );
  }

  const copyToClipboard = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getConfidenceInfo = (score) => {
    const num = Number(score);
    if (num >= 0.85) {
      return {
        label: "High Relevance",
        badgeClass: "confidence-high",
        fillClass: "fill-high",
        description: "Strong conceptual alignment"
      };
    }
    if (num >= 0.80) {
      return {
        label: "Moderate Relevance",
        badgeClass: "confidence-moderate",
        fillClass: "fill-moderate",
        description: "Related technical context"
      };
    }
    if (num >= 0.75) {
      return {
        label: "Weak Match",
        badgeClass: "confidence-low",
        fillClass: "fill-low",
        description: "Distant topical association"
      };
    }
    return {
      label: "Noise Floor (<0.75)",
      badgeClass: "confidence-unrelated",
      fillClass: "fill-low",
      description: "Below semantic threshold (~0.73 baseline)"
    };
  };

  return (
    <div className="results-section">
      <div className="results-meta-header">
        <div className="results-title-group">
          <h2 className="results-heading">Semantic Matches</h2>
          <span className="results-count-tag">
            {items.length} {items.length === 1 ? "document" : "documents"}
          </span>
        </div>
        {searchStats?.elapsed && (
          <span className="results-latency">
            Retrieved in {searchStats.elapsed}ms
          </span>
        )}
      </div>

      <div className="scoring-callout">
        <Info size={15} className="scoring-callout-icon" />
        <div>
          <strong>Transparent Similarity Scoring:</strong> Results are ranked by Cosine Similarity in 768-dimensional vector space (0.0000 to 1.0000). A higher score reflects semantic closeness to your query rather than keyword frequency.
        </div>
      </div>

      <ul className="results-list" role="list">
        {items.map((item, idx) => {
          const numScore = Number(item.score) || 0;
          const formattedScore = numScore.toFixed(4);
          const percentScore = Math.min(100, Math.max(0, Math.round(numScore * 100)));
          const confidence = getConfidenceInfo(numScore);
          const hasMeta = item.metadata && Object.keys(item.metadata).length > 0;
          const isUntitled = !item.title || item.title.trim() === "";
          const isContentEmpty = !item.content || item.content.trim() === "";
          const itemKey = item.id || `result-${idx}`;

          return (
            <li key={itemKey} className="result-card" role="listitem">
              <div className="result-card-header">
                <div className="result-title-area">
                  <strong className="result-title">{item.title || "Untitled"}</strong>
                  {isUntitled && (
                    <span className="meta-pill" style={{ color: "var(--text-dim)" }}>
                      No Title
                    </span>
                  )}
                </div>

                <div className="result-badges-area">
                  <span
                    className={`confidence-badge ${confidence.badgeClass}`}
                    title={confidence.description}
                  >
                    {confidence.label}
                  </span>
                  <span className="score-badge">
                    Score: {formattedScore}
                  </span>
                </div>
              </div>

              {/* Linear-style similarity meter */}
              <div
                className="sim-meter-track"
                title={`Cosine Similarity Match: ${percentScore}% (${formattedScore})`}
              >
                <div
                  className={`sim-meter-fill ${confidence.fillClass}`}
                  style={{ width: `${percentScore}%` }}
                />
              </div>

              {isContentEmpty ? (
                <p className="result-content" style={{ fontStyle: "italic", color: "var(--text-dim)" }}>
                  No textual content was provided for this document.
                </p>
              ) : (
                <p className="result-content">{item.content}</p>
              )}

              <div className="result-footer">
                <div className="result-meta-tags">
                  {hasMeta ? (
                    Object.entries(item.metadata).map(([k, v]) => (
                      <span key={k} className="meta-pill">
                        {k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </span>
                    ))
                  ) : (
                    <span className="meta-pill" style={{ color: "var(--text-dim)" }}>
                      No Metadata
                    </span>
                  )}
                </div>

                <div className="result-actions">
                  {onSelectDocument && (
                    <button
                      type="button"
                      onClick={() => onSelectDocument(item)}
                      className="btn btn-secondary"
                      style={{ padding: "0.22rem 0.6rem", fontSize: "0.75rem" }}
                      title="Inspect full document details and metadata"
                    >
                      <ExternalLink size={12} />
                      Inspect
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => copyToClipboard(itemKey, item.content || item.title || "")}
                    className="btn btn-ghost"
                    style={{ padding: "0.22rem 0.6rem", fontSize: "0.75rem" }}
                    disabled={isContentEmpty && isUntitled}
                    title="Copy document content"
                  >
                    {copiedId === itemKey ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === itemKey ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Results;
