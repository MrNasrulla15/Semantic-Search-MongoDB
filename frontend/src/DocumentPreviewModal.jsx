import { useEffect, useState } from "react";
import { X, Copy, Check, FileText } from "lucide-react";

export function DocumentPreviewModal({ document, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!document) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(document.content || document.title || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreNum = Number(document.score) || 0;
  const hasMeta = document.metadata && Object.keys(document.metadata).length > 0;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={17} style={{ color: "var(--accent-primary)" }} />
            <h3 className="modal-title">{document.title || "Untitled Document"}</h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close document modal"
            style={{ border: "none" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {document.score !== undefined && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid var(--border-subtle)"
              }}
            >
              <span>
                Cosine Similarity Score: <strong>{scoreNum.toFixed(4)}</strong>
              </span>
              <span>•</span>
              <span>Vector Dimensions: <strong>768-D</strong></span>
            </div>
          )}

          <div>
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "0.4rem"
              }}
            >
              Document Content
            </label>
            <div className="modal-text">
              {document.content || "No detailed textual content provided for this document."}
            </div>
          </div>

          <div>
            <label
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "0.4rem"
              }}
            >
              Metadata Attributes
            </label>
            {hasMeta ? (
              <pre className="modal-meta-box">
                {JSON.stringify(document.metadata, null, 2)}
              </pre>
            ) : (
              <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontStyle: "italic" }}>
                No metadata attached to this document.
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy Text"}
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentPreviewModal;
