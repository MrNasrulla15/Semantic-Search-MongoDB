const axios = require("axios");

async function createEmbeddings(texts) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const model = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

  const responses = await Promise.all(
    texts.map((text) =>
      axios.post(endpoint, {
        model: `models/${model}`,
        content: { parts: [{ text }] }
      })
    )
  );

  return responses.map((res) => res.data.embedding.values);
}

module.exports = { createEmbeddings };
