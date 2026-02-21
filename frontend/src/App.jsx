import React from "react";
import ReactDOM from "react-dom/client";
import { useState } from "react";
import SearchBar from "./SearchBar";
import Results from "./Results";
import { ingestDocuments, semanticSearch } from "./api";

function App() {
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleIngest(documents) {
    setLoading(true);
    setMessage("");
    try {
      const data = await ingestDocuments(documents);
      setMessage(`Inserted ${data.insertedCount} documents.`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Ingest failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(query) {
    setLoading(true);
    setMessage("");
    try {
      const data = await semanticSearch(query, 5);
      setResults(data.results || []);
      setMessage(`Found ${data.count} results.`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 760, margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
      <h1>Semantic Search MongoDB</h1>
      <p>{message}</p>
      <SearchBar onSearch={handleSearch} onIngest={handleIngest} loading={loading} />
      <hr style={{ margin: "1.25rem 0" }} />
      <Results items={results} />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;
