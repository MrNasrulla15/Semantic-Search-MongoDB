const axios = require("axios");

/**
 * Generates embeddings for an array of strings using the Google Gemini embedding API.
 * Uses secure x-goog-api-key header authentication, timeouts, and batching.
 *
 * @param {string[]} texts - Array of text strings to embed
 * @returns {Promise<number[][]>} Array of embedding vector arrays
 */
async function createEmbeddings(texts, client = axios) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment variables");
  }

  let model = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
  if (model === "text-embedding-004") {
    model = "gemini-embedding-001";
  }
  const dimensions = Number(process.env.EMBEDDING_DIMENSIONS || 768);
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || 15000);

  // If single text, we can use the direct embedContent endpoint
  if (texts.length === 1) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`;
      const response = await client.post(
        endpoint,
        {
          model: `models/${model}`,
          content: { parts: [{ text: texts[0] }] },
          outputDimensionality: dimensions
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          timeout: timeoutMs
        }
      );

      const vector = response.data?.embedding?.values;
      if (!vector) {
        throw new Error("Invalid response format from Gemini Embedding API");
      }
      return [vector];
    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message;
      throw new Error(`Gemini embedding failed: ${msg}`);
    }
  }

  // For multiple texts, use batchEmbedContents in chunks of up to 50
  const CHUNK_SIZE = 50;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
    const chunk = texts.slice(i, i + CHUNK_SIZE);
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents`;
      const requests = chunk.map((text) => ({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        outputDimensionality: dimensions
      }));

      const response = await client.post(
        endpoint,
        { requests },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          timeout: timeoutMs
        }
      );

      const embeddings = response.data?.embeddings;
      if (!Array.isArray(embeddings)) {
        throw new Error("Invalid batch response format from Gemini Embedding API");
      }

      for (const item of embeddings) {
        allEmbeddings.push(item.values);
      }
    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message;
      throw new Error(`Gemini batch embedding failed: ${msg}`);
    }
  }

  return allEmbeddings;
}

module.exports = { createEmbeddings };
