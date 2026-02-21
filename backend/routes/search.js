const express = require("express");
const { createEmbeddings } = require("../services/embeddingService");

const router = express.Router();
const COLLECTION = "searchdocuments";

router.post("/ingest", async (req, res, next) => {
  try {
    const { documents } = req.body;

    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ message: "documents must be a non-empty array" });
    }

    const invalidDoc = documents.find(
      (doc) => !doc || typeof doc.content !== "string" || doc.content.trim() === ""
    );
    if (invalidDoc) {
      return res.status(400).json({ message: "each document needs non-empty content" });
    }

    const texts = documents.map((doc) => `${doc.title || ""}\n${doc.content || ""}`.trim());
    const embeddings = await createEmbeddings(texts);

    const payload = documents.map((doc, i) => ({
      title: doc.title || "",
      content: doc.content,
      metadata: doc.metadata || {},
      embedding: embeddings[i],
      createdAt: new Date()
    }));

    const result = await req.app.locals.db.collection(COLLECTION).insertMany(payload);
    return res.status(201).json({ insertedCount: Object.keys(result.insertedIds).length });
  } catch (error) {
    return next(error);
  }
});

router.post("/search", async (req, res, next) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "query must be a non-empty string" });
    }

    const safeLimit = Math.max(1, Math.min(20, Number(limit) || 5));
    const [queryVector] = await createEmbeddings([query]);

    const index = process.env.VECTOR_INDEX_NAME || "vector_index";
    const numCandidates = Math.max(100, safeLimit * 20);

    const results = await req.app.locals.db
      .collection(COLLECTION)
      .aggregate([
        {
          $vectorSearch: {
            index,
            path: "embedding",
            queryVector,
            numCandidates,
            limit: safeLimit
          }
        },
        {
          $project: {
            title: 1,
            content: 1,
            metadata: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ])
      .toArray();

    return res.json({
      query,
      count: results.length,
      results: results.map((item) => ({
        id: String(item._id),
        title: item.title,
        content: item.content,
        metadata: item.metadata,
        score: item.score
      }))
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
