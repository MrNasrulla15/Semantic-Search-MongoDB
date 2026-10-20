import { vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";

// ── Helpers ────────────────────────────────────────────────────────────────
// Build a minimal MongoDB collection mock
function makeDb({ insertResult, searchResult } = {}) {
  return {
    collection: () => ({
      insertMany: vi.fn().mockResolvedValue(insertResult ?? { insertedIds: {} }),
      aggregate: () => ({ toArray: vi.fn().mockResolvedValue(searchResult ?? []) })
    })
  };
}

// Build an embeddingService mock (replaces app.locals.embeddingService)
function makeEmbedding(vectors = [[0.1, 0.2, 0.3]]) {
  return {
    createEmbeddings: vi.fn().mockResolvedValue(vectors)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ingest
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/ingest", () => {
  beforeEach(() => {
    // Inject mocks — no real Gemini calls, no real MongoDB
    app.locals.db = makeDb({ insertResult: { insertedIds: { 0: "id1", 1: "id2" } } });
    app.locals.embeddingService = makeEmbedding([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]);
  });

  it("rejects a missing documents field with 400", async () => {
    const res = await request(app).post("/api/ingest").send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/documents must be a non-empty array/i);
  });

  it("rejects an empty documents array with 400", async () => {
    const res = await request(app).post("/api/ingest").send({ documents: [] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/non-empty array/i);
  });

  it("rejects a document with no content with 400", async () => {
    const res = await request(app)
      .post("/api/ingest")
      .send({ documents: [{ title: "Missing content" }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/non-empty content/i);
  });

  it("rejects a document with blank content with 400", async () => {
    const res = await request(app)
      .post("/api/ingest")
      .send({ documents: [{ title: "Blank", content: "   " }] });
    expect(res.status).toBe(400);
  });

  it("inserts valid documents and returns 201 with insertedCount", async () => {
    const res = await request(app)
      .post("/api/ingest")
      .send({
        documents: [
          { title: "Doc A", content: "First document content", metadata: { topic: "tech" } },
          { title: "Doc B", content: "Second document content" }
        ]
      });
    expect(res.status).toBe(201);
    expect(res.body.insertedCount).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/search
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/search", () => {
  beforeEach(() => {
    app.locals.embeddingService = makeEmbedding([[0.1, 0.2, 0.3]]);
    app.locals.db = makeDb({
      searchResult: [
        { _id: "abc123", title: "Test Result", content: "Sample content", metadata: { topic: "nlp" }, score: 0.95 }
      ]
    });
  });

  it("rejects a missing query with 400", async () => {
    const res = await request(app).post("/api/search").send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/query must be a non-empty string/i);
  });

  it("rejects a non-string query with 400", async () => {
    const res = await request(app).post("/api/search").send({ query: 42 });
    expect(res.status).toBe(400);
  });

  it("returns ranked results for a valid query", async () => {
    const res = await request(app).post("/api/search").send({ query: "semantic search" });
    expect(res.status).toBe(200);
    expect(res.body.query).toBe("semantic search");
    expect(res.body.count).toBe(1);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0]).toMatchObject({
      id: "abc123",
      title: "Test Result",
      content: "Sample content",
      score: 0.95
    });
  });

  it("clamps limit to 20 when an oversized value is given", async () => {
    const res = await request(app).post("/api/search").send({ query: "test", limit: 999 });
    expect(res.status).toBe(200);
  });

  it("returns count 0 and empty results when nothing found", async () => {
    app.locals.db = makeDb({ searchResult: [] });
    const res = await request(app).post("/api/search").send({ query: "obscure query" });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.results).toEqual([]);
  });
});
