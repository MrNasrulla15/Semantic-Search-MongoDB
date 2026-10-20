const dotenv = require("dotenv");
dotenv.config();

const { MongoClient } = require("mongodb");
const app = require("./app");

const PORT = Number(process.env.PORT || 5000);

async function start() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ Critical: MONGODB_URI is not set in backend/.env.");
    console.error("   Copy .env.example to .env and configure your MongoDB Atlas connection string.");
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ Warning: GEMINI_API_KEY is not set. Embedding generation will fail until configured.");
  }

  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(mongoUri);
  await client.connect();
  const dbName = process.env.DB_NAME || "semantic_search";
  app.locals.db = client.db(dbName);
  console.log(`Connected to MongoDB Atlas database '${dbName}' successfully.`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\nShutting down gracefully...");
    try {
      await client.close();
      console.log("MongoDB connection closed.");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  app.listen(PORT, () => {
    console.log(`Backend server ready at http://localhost:${PORT}`);
    console.log(`Health endpoint: http://localhost:${PORT}/health`);
    console.log(`Search endpoint: POST http://localhost:${PORT}/api/search`);
    console.log(`Ingest endpoint: POST http://localhost:${PORT}/api/ingest`);
  });
}

start().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
