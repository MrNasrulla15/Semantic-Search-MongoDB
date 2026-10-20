import { Layers } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-group">
          <div className="brand-logo" title="Semantic Search Engine">
            <Layers size={17} />
          </div>
          <span className="brand-title">Semantic Search</span>
          <span className="brand-tag">Atlas Vector DB</span>
        </div>

        <div className="header-actions">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginRight: "0.5rem"
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block"
              }}
            />
            <span>v1.0</span>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
