# Semantic Search Engine for MongoDB

This project is a simple semantic search engine for MongoDB. Instead of matching only exact keywords, it compares meaning using embeddings, so users can find relevant documents even when they use different wording.

For example, a query like `cheap gaming laptop` can still return content such as `budget high-performance notebook for gaming`. The app uses a React frontend, an Express backend, Gemini for embeddings, and MongoDB Atlas Vector Search to return the top 5 most relevant results.

## What this project does

- Stores sample documents in MongoDB Atlas
- Generates and stores an embedding vector for each document
- Accepts natural-language queries from a React UI
- Converts query text into a Gemini embedding
- Uses MongoDB Atlas `$vectorSearch` to rank relevance
- Returns and displays the top 5 matches in the frontend

## Tech stack

### Backend
- Node.js 18 LTS
- Express `^4.18`
- Axios `^1.x`
- dotenv `^16`
- MongoDB Node Driver `^6.x`

### Frontend
- React 18
- Vite
- Axios
- Basic CSS

### Database and AI
- MongoDB Atlas (M0 Free Tier)
- Atlas Vector Search
- Gemini Embedding API (`text-embedding-004`)

## Architecture

![Architecture Diagram](docs/architecture-diagram.svg)

## Project structure

```text
semantic-search-mongodb/
├── backend/
│   ├── routes/
│   │   └── search.js
│   ├── services/
│   │   └── embeddingService.js
│   ├── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Results.jsx
│   │   └── api.js
│   ├── index.html
│   └── package.json
├── docs/
│   ├── architecture-diagram.svg
│   └── screenshots/
│       ├── home.svg
│       └── results.svg
├── README.md
└── .gitignore
```

## Setup

### 1. Create `backend/.env`

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
VECTOR_INDEX_NAME=vector_index

GEMINI_API_KEY=your_gemini_key
GEMINI_EMBEDDING_MODEL=text-embedding-004
```

### 2. Run backend

```bash
cd backend
npm install
npm run dev
```

### 3. Run frontend

```bash
cd frontend
npm install
npm run dev
```

## Example API requests

### Ingest documents

```bash
curl -X POST http://localhost:5000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "title": "MongoDB Aggregation",
        "content": "Aggregation pipelines transform and summarize data in stages.",
        "metadata": { "topic": "mongodb" }
      },
      {
        "title": "Text Embeddings",
        "content": "Embeddings convert text into vectors for semantic similarity search.",
        "metadata": { "topic": "nlp" }
      }
    ]
  }'
```

### Search

```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How do embeddings improve search relevance?",
    "limit": 5
  }'
```
