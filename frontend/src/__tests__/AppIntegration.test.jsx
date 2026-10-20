import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";
import * as api from "../api";

vi.mock("../api");

describe("App UI & Functionality Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("1. Renders application header, brand identity, lead section, and initial empty state", () => {
    render(<App />);

    // Brand and Header
    expect(screen.getByText("Semantic Search")).toBeInTheDocument();
    expect(screen.getByText("Atlas Vector DB")).toBeInTheDocument();
    expect(screen.getByText("v1.0")).toBeInTheDocument();

    // Lead section
    expect(screen.getByText("Find what you need")).toBeInTheDocument();
    expect(
      screen.getByText(/Query documents and technical notes by conceptual meaning/i)
    ).toBeInTheDocument();

    // Suggested prompt chips
    expect(screen.getByText("Suggested:")).toBeInTheDocument();
    expect(screen.getByText("How do vector embeddings work?")).toBeInTheDocument();

    // Search Controls
    expect(screen.getByPlaceholderText("Ask your query...")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Insert Sample Documents")).toBeInTheDocument();
    expect(screen.getByText("+ Add Custom Document")).toBeInTheDocument();

    // Initial empty state
    expect(screen.getByText("No results yet.")).toBeInTheDocument();
  });

  it("2. Toggles light and dark themes, updating data-theme on documentElement and persisting to localStorage", () => {
    render(<App />);

    const themeToggleBtn = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(themeToggleBtn).toBeInTheDocument();

    // Click to switch to dark mode
    fireEvent.click(themeToggleBtn);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");

    // Click to switch back to light mode
    const lightToggleBtn = screen.getByRole("button", { name: /switch to light mode/i });
    fireEvent.click(lightToggleBtn);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("3. Executes search query, displays skeleton loading state, and renders semantic matches with confidence badges", async () => {
    api.semanticSearch.mockResolvedValueOnce({
      query: "How can semantic search improve MongoDB retrieval?",
      count: 2,
      totalCandidates: 2,
      minScore: 0.8,
      results: [
        {
          id: "doc-1",
          title: "MongoDB Atlas Vector Search Architecture",
          content: "Atlas Vector Search uses HNSW graphs for approximate nearest neighbor retrieval.",
          metadata: { category: "database", topic: "vector-search" },
          score: 0.8924
        },
        {
          id: "doc-2",
          title: "Embeddings & Semantic Similarity",
          content: "Embeddings convert text into high-dimensional vectors.",
          metadata: { category: "ai", topic: "nlp" },
          score: 0.8145
        }
      ]
    });

    render(<App />);

    // Click Search
    const searchBtn = screen.getByRole("button", { name: /^Search$/i });
    fireEvent.click(searchBtn);

    // Verify loading skeletons are displayed while in-flight
    expect(screen.getByLabelText("Loading search results")).toBeInTheDocument();

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText("Semantic Matches")).toBeInTheDocument();
    });

    expect(screen.getByText("2 documents")).toBeInTheDocument();
    expect(screen.getByText("Transparent Similarity Scoring:")).toBeInTheDocument();

    // Verify first result details
    expect(screen.getByText("MongoDB Atlas Vector Search Architecture")).toBeInTheDocument();
    expect(screen.getByText("High Relevance")).toBeInTheDocument();
    expect(screen.getByText("Score: 0.8924")).toBeInTheDocument();
    expect(
      screen.getByText(/Atlas Vector Search uses HNSW graphs for approximate nearest neighbor retrieval./i)
    ).toBeInTheDocument();
    expect(screen.getByText("category: database")).toBeInTheDocument();
    expect(screen.getByText("topic: vector-search")).toBeInTheDocument();

    // Verify second result details
    expect(screen.getByText("Embeddings & Semantic Similarity")).toBeInTheDocument();
    expect(screen.getByText("Moderate Relevance")).toBeInTheDocument();
    expect(screen.getByText("Score: 0.8145")).toBeInTheDocument();
  });

  it("4. Opens DocumentPreviewModal on Inspect click, displays full details, and closes with Done button or Escape", async () => {
    api.semanticSearch.mockResolvedValueOnce({
      query: "MongoDB",
      count: 1,
      totalCandidates: 1,
      minScore: 0.8,
      results: [
        {
          id: "doc-101",
          title: "Deep Dive into Vector Indexing",
          content: "Comprehensive documentation on index partitions and Euclidean vs Cosine distance.",
          metadata: { author: "Engineering Team", version: 2 },
          score: 0.9125
        }
      ]
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

    await waitFor(() => {
      expect(screen.getByText("Deep Dive into Vector Indexing")).toBeInTheDocument();
    });

    // Click Inspect button
    const inspectBtn = screen.getByRole("button", { name: /Inspect/i });
    fireEvent.click(inspectBtn);

    // Verify Modal is opened
    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();
    expect(screen.getByText("Cosine Similarity Score:")).toBeInTheDocument();
    expect(screen.getByText("0.9125")).toBeInTheDocument();
    expect(screen.getByText("768-D")).toBeInTheDocument();
    expect(screen.getAllByText(/Comprehensive documentation on index partitions/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/"author": "Engineering Team"/i)).toBeInTheDocument();

    // Close via Done button
    const doneBtn = screen.getByRole("button", { name: /Done/i });
    fireEvent.click(doneBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Re-open and close with Escape key
    fireEvent.click(screen.getByRole("button", { name: /Inspect/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("5. Communicates honest no-results state when database has zero relevant documents", async () => {
    api.semanticSearch.mockResolvedValueOnce({
      query: "baking chocolate cake and sourdough bread",
      count: 0,
      totalCandidates: 5,
      minScore: 0.8,
      results: []
    });

    render(<App />);

    const textarea = screen.getByPlaceholderText("Ask your query...");
    fireEvent.change(textarea, { target: { value: "baking chocolate cake and sourdough bread" } });

    fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

    await waitFor(() => {
      expect(screen.getByText("No relevant documents found")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/We couldn't find information matching/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Semantic Honesty & Recommended Next Steps")).toBeInTheDocument();
    expect(screen.getByText(/Rather than returning unrelated documents as false positives/i)).toBeInTheDocument();
  });

  it("6. Handles backend/network failure gracefully and displays distinct error feedback banner", async () => {
    api.semanticSearch.mockRejectedValueOnce(new Error("Connection refused to backend API"));

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Search$/i }));

    await waitFor(() => {
      const banner = screen.getByRole("status");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent("Connection refused to backend API");
      expect(banner).toHaveClass("error");
    });
  });

  it("7. Ingests sample documents and shows success status banner", async () => {
    api.ingestDocuments.mockResolvedValueOnce({
      insertedCount: 3,
      message: "Sample documents ingested successfully"
    });

    render(<App />);

    const sampleBtn = screen.getByRole("button", { name: /Insert Sample Documents/i });
    fireEvent.click(sampleBtn);

    await waitFor(() => {
      const banner = screen.getByRole("status");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/Successfully vectorized and indexed 3 documents/i);
      expect(banner).toHaveClass("success");
    });
  });

  it("8. Expands custom knowledge item drawer, fills inputs, and submits custom document", async () => {
    api.ingestDocuments.mockResolvedValueOnce({
      insertedCount: 1,
      message: "Custom document ingested successfully"
    });

    render(<App />);

    // Open drawer
    fireEvent.click(screen.getByText("+ Add Custom Document"));
    expect(screen.getByText("Ingest Custom Knowledge Item")).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText("Document Title (optional)");
    const contentInput = screen.getByPlaceholderText(/Document Content \(required, minimum 5 characters\)\.\.\./i);
    const categoryInput = screen.getByPlaceholderText(/Topic \/ Category Tag/i);

    fireEvent.change(titleInput, { target: { value: "System Architecture Notes" } });
    fireEvent.change(contentInput, { target: { value: "Notes regarding HNSW graph indexing performance." } });
    fireEvent.change(categoryInput, { target: { value: "architecture" } });

    fireEvent.click(screen.getByRole("button", { name: /Save & Embed/i }));

    expect(api.ingestDocuments).toHaveBeenCalledWith([
      {
        title: "System Architecture Notes",
        content: "Notes regarding HNSW graph indexing performance.",
        metadata: { category: "architecture" }
      }
    ]);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/Successfully vectorized and indexed 1 document/i);
    });
  });
});
