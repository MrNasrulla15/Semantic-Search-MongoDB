import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createEmbeddings } from "../services/embeddingService.js";

describe("embeddingService", () => {
  const originalEnv = process.env;
  let mockClient;

  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-gemini-key" };
    mockClient = {
      post: vi.fn()
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns an empty array when texts array is empty", async () => {
    const res = await createEmbeddings([], mockClient);
    expect(res).toEqual([]);
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  it("throws an error when GEMINI_API_KEY is not defined", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(createEmbeddings(["test text"], mockClient)).rejects.toThrow(/GEMINI_API_KEY is missing/);
  });

  it("embeds a single text using embedContent endpoint and passes header auth", async () => {
    const mockVector = [0.12, 0.34, 0.56];
    mockClient.post.mockResolvedValueOnce({
      data: {
        embedding: { values: mockVector }
      }
    });

    const result = await createEmbeddings(["Hello world"], mockClient);

    expect(result).toEqual([mockVector]);
    expect(mockClient.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = mockClient.post.mock.calls[0];
    expect(url).toContain(":embedContent");
    expect(body.content.parts[0].text).toBe("Hello world");
    expect(config.headers["x-goog-api-key"]).toBe("test-gemini-key");
  });

  it("embeds multiple texts using batchEmbedContents endpoint", async () => {
    const mockVectors = [
      { values: [0.1, 0.2] },
      { values: [0.3, 0.4] }
    ];
    mockClient.post.mockResolvedValueOnce({
      data: {
        embeddings: mockVectors
      }
    });

    const result = await createEmbeddings(["Text 1", "Text 2"], mockClient);

    expect(result).toEqual([[0.1, 0.2], [0.3, 0.4]]);
    expect(mockClient.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = mockClient.post.mock.calls[0];
    expect(url).toContain(":batchEmbedContents");
    expect(body.requests).toHaveLength(2);
    expect(config.headers["x-goog-api-key"]).toBe("test-gemini-key");
  });

  it("wraps and propagates error message on API failure", async () => {
    mockClient.post.mockRejectedValueOnce({
      response: {
        data: {
          error: { message: "Quota exceeded" }
        }
      }
    });

    await expect(createEmbeddings(["Some query"], mockClient)).rejects.toThrow(/Gemini embedding failed: Quota exceeded/);
  });
});
