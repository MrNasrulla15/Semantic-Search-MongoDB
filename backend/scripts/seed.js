const dotenv = require("dotenv");
dotenv.config();

const { MongoClient } = require("mongodb");
const { createEmbeddings } = require("../services/embeddingService");

const SAMPLE_DOCUMENTS = [
  {
    title: "MongoDB Aggregation Pipelines",
    content:
      "MongoDB aggregation framework processes documents through multi-stage pipelines. Stages like $match, $group, $project, and $lookup allow developers to transform, filter, and summarize complex analytical data efficiently in the database layer.",
    metadata: { category: "database", topic: "mongodb", difficulty: "intermediate" }
  },
  {
    title: "Vector Embeddings & Semantic Similarity",
    content:
      "Embeddings are high-dimensional vector representations of words, sentences, or documents that capture semantic relationships and conceptual meaning. Similarity between vectors is calculated using geometric distance metrics such as cosine similarity or Euclidean distance.",
    metadata: { category: "ai", topic: "nlp", difficulty: "beginner" }
  },
  {
    title: "MongoDB Atlas Vector Search Architecture",
    content:
      "MongoDB Atlas Vector Search enables native vector indexing alongside transactional operational data. It uses Hierarchical Navigable Small World (HNSW) graph algorithms to perform approximate nearest neighbor (ANN) search at scale without requiring a separate vector database.",
    metadata: { category: "database", topic: "vector-search", difficulty: "advanced" }
  },
  {
    title: "React 18 Concurrent Rendering",
    content:
      "React 18 introduced concurrent rendering capabilities, including automatic batching of state updates, Transitions with useTransition for non-urgent UI updates, and Suspense for data fetching, dramatically reducing main-thread blocking and improving user responsiveness.",
    metadata: { category: "frontend", topic: "react", difficulty: "intermediate" }
  },
  {
    title: "RESTful API Security Best Practices",
    content:
      "Production-grade Node.js and Express APIs require layered defense-in-depth security: secure HTTP headers with Helmet, strict Cross-Origin Resource Sharing (CORS) whitelists, rate limiting to mitigate denial-of-service, and schema validation with Zod to sanitize incoming payloads.",
    metadata: { category: "backend", topic: "security", difficulty: "intermediate" }
  },
  {
    title: "Large Language Models & RAG Architecture",
    content:
      "Retrieval-Augmented Generation (RAG) pairs external knowledge retrieval from vector databases with generative LLMs. By retrieving semantically relevant context chunks and injecting them into prompts, systems avoid hallucinations and provide grounded, up-to-date answers.",
    metadata: { category: "ai", topic: "llm", difficulty: "advanced" }
  }
];

const ATLAS_INDEX_DEFINITION = {
  fields: [
    {
      type: "vector",
      path: "embedding",
      numDimensions: 768,
      similarity: "cosine"
    }
  ]
};

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Error: MONGODB_URI is not set in backend/.env");
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY is not set in backend/.env");
    process.exit(1);
  }

  console.log("🚀 Connecting to MongoDB...");
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const dbName = process.env.DB_NAME || "semantic_search";
    const db = client.db(dbName);
    const collection = db.collection("searchdocuments");

    console.log(`📡 Generating Gemini embeddings for ${SAMPLE_DOCUMENTS.length} sample documents...`);
    const texts = SAMPLE_DOCUMENTS.map((doc) => `${doc.title}\n${doc.content}`.trim());
    const embeddings = await createEmbeddings(texts);

    const payload = SAMPLE_DOCUMENTS.map((doc, idx) => ({
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata,
      embedding: embeddings[idx],
      createdAt: new Date()
    }));

    console.log("💾 Inserting documents into 'searchdocuments' collection...");
    const result = await collection.insertMany(payload);
    console.log(`✅ Successfully seeded ${result.insertedCount} documents!`);

    console.log("\n=======================================================");
    console.log("📌 REQUIRED ATLAS VECTOR SEARCH INDEX CONFIGURATION");
    console.log("=======================================================");
    console.log("In MongoDB Atlas > Database > Browse Collections > 'searchdocuments' > Atlas Search > Create Search Index > JSON Editor:");
    console.log(`Index Name: ${process.env.VECTOR_INDEX_NAME || "vector_index"}`);
    console.log(JSON.stringify(ATLAS_INDEX_DEFINITION, null, 2));
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await client.close();
  }
}

seed();
