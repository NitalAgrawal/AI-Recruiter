# AI-Recruiter — AI-Powered Recruitment Platform

An intelligent recruitment platform powered by Google Gemini AI. Automates candidate sourcing, resume parsing, semantic matching, ranking, and interview planning.

Live: https://ai-recruiter-ochre.vercel.app/
## Project Structure

```
AI-Recruitment-System/
├── frontend/          ← React 19 + Vite + TailwindCSS
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── design-system/
│   │   ├── pages/
│   │   └── services/
│   ├── .env           ← VITE_API_URL
│   ├── vite.config.js
│   └── package.json
│
├── backend/           ← Node.js + Express + MongoDB
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   └── ai/        ← Gemini AI modules
│   ├── validators/
│   ├── .env           ← MONGO_URI, JWT_SECRET, GEMINI_API_KEY
│   └── package.json
│
├── package.json       ← Root orchestration (concurrently)
└── .gitignore
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key

## Setup

### 1. Install all dependencies

```bash
npm run install:all
```

### 2. Configure environment variables

**Backend** — edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-recruiter
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

**Frontend** — edit `frontend/.env` (optional, Vite proxies `/api` to backend in dev):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the project

#### Run both frontend + backend together (recommended)
```bash
npm run dev
```

#### Run individually
```bash
# Frontend only (http://localhost:5173)
npm run frontend

# Backend only (http://localhost:5000)
npm run backend
```

## Production Build

```bash
npm run build
```

Then serve `frontend/dist` with a static file server and run `node backend/index.js`.
