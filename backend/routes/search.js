const express = require("express");
const { validate, ingestSchema, searchSchema } = require("../middleware/validate");
const { searchLimiter, ingestLimiter } = require("../middleware/rateLimiter");

const router = express.Router();
const COLLECTION = "searchdocuments";

// POST /api/ingest
router.post("/ingest", ingestLimiter, validate(ingestSchema), async (req, res, next) => {
  try {
    const { documents } = req.body;

    const texts = documents.map((doc) => `${doc.title}\n${doc.content}`.trim());
    const embeddings = await req.app.locals.embeddingService.createEmbeddings(texts);

    const payload = documents.map((doc, i) => ({
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata,
      embedding: embeddings[i],
      createdAt: new Date()
    }));

    const result = await req.app.locals.db.collection(COLLECTION).insertMany(payload);
    return res.status(201).json({ insertedCount: Object.keys(result.insertedIds).length });
  } catch (error) {
    return next(error);
  }
});

// POST /api/search
router.post("/search", searchLimiter, validate(searchSchema), async (req, res, next) => {
  try {
    const { query, limit, minScore } = req.body;

    const [queryVector] = await req.app.locals.embeddingService.createEmbeddings([query]);

    const index = process.env.VECTOR_INDEX_NAME || "vector_index";
    const numCandidates = Math.max(100, limit * 20);

    const rawResults = await req.app.locals.db
      .collection(COLLECTION)
      .aggregate([
        {
          $vectorSearch: {
            index,
            path: "embedding",
            queryVector,
            numCandidates,
            limit
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

    // Respect relevance threshold: only return results meeting minScore
    const results = minScore > 0
      ? rawResults.filter((item) => (Number(item.score) || 0) >= minScore)
      : rawResults;

    return res.json({
      query,
      count: results.length,
      totalCandidates: rawResults.length,
      minScore,
      results: results.map((item) => {
        const score = Number(item.score) || 0;
        let confidence = "unrelated";
        if (score >= 0.85) confidence = "high";
        else if (score >= 0.80) confidence = "moderate";
        else if (score >= 0.75) confidence = "low";

        return {
          id: String(item._id),
          title: item.title?.trim() || "Untitled",
          content: item.content?.trim() || "",
          metadata: item.metadata || {},
          score: item.score,
          confidence
        };
      })
    });
  } catch (error) {
    if (
      error.message &&
      (error.message.includes("$vectorSearch") ||
        error.message.includes("Search Index") ||
        error.message.includes("index not found"))
    ) {
      error.status = 503;
      error.message = `Atlas Vector Search index '${process.env.VECTOR_INDEX_NAME || "vector_index"}' is not configured or still indexing. Please verify your Atlas Search index.`;
    }
    return next(error);
  }
});

module.exports = router;
