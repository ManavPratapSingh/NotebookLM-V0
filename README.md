# 📓 NotebookLM V0

A full-stack **Retrieval-Augmented Generation (RAG)** application inspired by Google's NotebookLM. Upload your PDF and CSV documents, and have an AI-powered assistant answer questions grounded entirely in your uploaded content.

Built with **LangChain**, **Gemini**, **Qdrant**, and **React**.

### 🔗 Deployment Links
- **Frontend (Vercel):** [https://notebook-lm-v0.vercel.app/](https://notebook-lm-v0.vercel.app/)
- **Backend (Render):** [https://notebooklm-v0.onrender.com](https://notebooklm-v0.onrender.com)

---

## ✨ Features

- **Document Upload** — Upload PDF and CSV files through a sleek drag-and-click interface
- **Vector Indexing** — Documents are automatically chunked, embedded (via Gemini `gemini-embedding-001`), and stored in a Qdrant vector database
- **Semantic Search** — User queries are matched against document embeddings to retrieve the most relevant context
- **AI-Powered Answers** — Retrieved context is fed to `Gemini 2.5 Flash` for grounded, document-aware responses
- **Real-time Upload Progress** — Animated toast notifications with progress tracking via GSAP
- **Multi-format Support** — Supports both PDF and CSV file uploads with automatic endpoint routing

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React Client                     │
│         (Vite + TailwindCSS + GSAP + Axios)         │
└──────────────┬──────────────────────┬───────────────┘
               │ Upload (PDF/CSV)     │ Query
               ▼                      ▼
┌──────────────────────────────────────────────────────┐
│                  Express Backend                     │
│                                                      │
│  POST /api/upload-pdf    →  PDFLoader  → Embed+Store │
│  POST /api/upload-csv    →  CSVLoader  → Embed+Store │
│  POST /api/rag/query     →  Retrieve   → Generate    │
└──────────────┬──────────────────────┬────────────────┘
               │ Embed & Store        │ Retrieve
               ▼                      ▼
┌──────────────────────────────────────────────────────┐
│                   Qdrant Vector DB                   │
│           Collection: NotebookLM-vectorspace         │
└──────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer       | Technology                                         |
|-------------|-----------------------------------------------------|
| **Frontend**  | React 19, Vite, TailwindCSS, GSAP, Axios, Lucide Icons |
| **Backend**   | Node.js, Express 5, TypeScript, Multer              |
| **AI/ML**     | LangChain.js, Google Gemini (Embeddings + Generation) |
| **Vector DB** | Qdrant (local instance on port `6333`)               |
| **Dev Tools** | tsx (watch mode), ESLint, PostCSS                    |

---

## 📂 Project Structure

```
NotebookLM-V0/
├── src/                        # Backend source
│   ├── index.ts                # Express server entry point
│   ├── rag/
│   │   ├── pipeline.ts         # Indexing, retrieval & generation logic
│   │   └── APIRouter.ts        # POST /api/rag/query endpoint
│   └── uploads/
│       ├── UploadRouter.ts     # POST /api/upload-pdf & /api/upload-csv
│       ├── MulterMiddleware.ts # Multer disk storage config
│       └── assets/             # Uploaded files (gitignored)
├── client/                     # Frontend source (Vite + React)
│   └── src/
│       ├── App.tsx             # Main layout
│       └── components/
│           ├── Sidebar.tsx     # File upload + document list
│           ├── ChatArea.tsx    # Chat interface
│           └── UploadProgress.tsx  # Upload toast notifications
├── package.json                # Backend dependencies
├── tsconfig.json               # TypeScript config
└── .env                        # Environment variables (not committed)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Qdrant** running locally on port `6333` ([Quick Start](https://qdrant.tech/documentation/quick-start/))
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Clone the Repository

```bash
git clone https://github.com/ManavPratapSingh/NotebookLM-V0.git
cd NotebookLM-V0
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```env
PORT=8000
GEMINI_API_KEY=your_gemini_api_key_here
QDRANT_URL=your_qdrant_cloud_url_here
QDRANT_API_KEY=your_qdrant_api_key_here
```

### 3. Start Qdrant

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

### 4. Install Dependencies & Run

**Backend:**
```bash
npm install
npm run dev
```

**Frontend** (in a separate terminal):
```bash
cd client
npm install
npm run dev
```

The backend runs on `http://localhost:8000` and the frontend on `http://localhost:5173`.

---

## 📡 API Endpoints

| Method | Endpoint              | Description                          | Body                          |
|--------|-----------------------|--------------------------------------|-------------------------------|
| `POST` | `/api/upload-pdf`     | Upload and index a PDF file          | `multipart/form-data` (file)  |
| `POST` | `/api/upload-csv`     | Upload and index a CSV file          | `multipart/form-data` (file)  |
| `POST` | `/api/rag/query`      | Query the indexed documents          | `{ "userQuery": "string" }`   |

---

## 🔄 RAG Pipeline

1. **Indexing** — Documents are loaded via LangChain's `PDFLoader` / `CSVLoader`, embedded using `gemini-embedding-001` (3072 dimensions), and stored in Qdrant.
2. **Retrieval** — User queries are embedded and the top 3 most similar document chunks are retrieved from the vector store.
3. **Generation** — Retrieved chunks + user query are sent to `Gemini 2.5 Flash` with a system prompt that constrains answers to the provided context.

---

## 📝 License

ISC

---

## 🙏 Acknowledgements

- [LangChain.js](https://js.langchain.com/) — Document loaders, embeddings, and vector store integrations
- [Google Gemini](https://ai.google.dev/) — Embedding and generative AI models
- [Qdrant](https://qdrant.tech/) — High-performance vector search engine
- [Vite](https://vitejs.dev/) — Lightning-fast frontend tooling



