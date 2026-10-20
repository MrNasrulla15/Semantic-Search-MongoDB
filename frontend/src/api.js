import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
});

export async function ingestDocuments(documents) {
  const { data } = await api.post("/ingest", { documents });
  return data;
}

export async function semanticSearch(query, limit = 5, minScore = 0) {
  const { data } = await api.post("/search", { query, limit, minScore });
  return data;
}
