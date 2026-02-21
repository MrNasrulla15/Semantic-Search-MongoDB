const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
const searchRoutes = require("./routes/search");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", searchRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "Internal server error" });
});

const PORT = Number(process.env.PORT || 5000);

async function start() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  app.locals.db = client.db();

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Startup failed", error);
  process.exit(1);
});
