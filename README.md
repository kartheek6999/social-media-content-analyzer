# Social Media Content Analyzer 🚀

A production-quality full-stack web application designed to upload social media documents (PDFs) and screenshots (PNG, JPG, JPEG), extract text via layout-preserving PDF parsing (`pdfjs-dist`) and Tesseract OCR, analyze engagement potential, and provide actionable suggestions to optimize reach and conversions.

---

## 🌟 Key Features

* **Multi-Format Document Upload**:
  * Upload PDF files and image formats (PNG, JPG, JPEG).
  * Smooth **Drag and Drop** interface with hover highlights and standard file picker.
  * Validation for MIME types, file extensions, and file size limits (10MB default).
* **Text Extraction Engine**:
  * **PDF Text Extraction**: Preserves paragraph breaks, line spacing, page demarcations, and detectable headings using Mozilla `pdfjs-dist`.
  * **Image OCR**: Runs Tesseract.js optical character recognition on screenshots with execution timeout safety guards.
  * Detects scanned/empty documents and provides clear user warnings.
* **Content & Engagement Analysis**:
  * Calculates an **Engagement Score (0-100)** based on post structure, hooks, and CTAs.
  * Highlights **Strengths** and **Areas for Improvement**.
  * Offers **Revamped Hook Suggestions** (opening line rewrites) and **Call to Action (CTA)** recommendations.
  * Provides hashtag suggestions and readability scoring.
* **Provider Abstraction**:
  * **Gemini AI Provider**: Connects via `GEMINI_API_KEY` for LLM analysis.
  * **Deterministic Fallback Provider**: Works out-of-the-box when no API key is provided, running real structural checks on text length, sentence complexity, question hooks, CTA keywords, and bullet points.
* **Telemetry & History**:
  * Dashboard with document metrics (total, processed, failed, active queue).
  * Filterable document history with view & delete actions.

---

## 🏗️ Architecture & Storage Resilience

The application adopts a **Modular Monolith** architecture inspired by MatriMitra engineering principles: clean service layer separation, thin controllers, strong validation, centralized error handling, and environment-driven configurations.

```text
       ┌─────────────────────────────────────────┐
       │     Next.js 14 Frontend (App Router)    │
       └────────────────────┬────────────────────┘
                            │ REST API (JSON / Multipart)
       ┌────────────────────▼────────────────────┐
       │       Node.js / Express Backend         │
       └─────┬──────────────┬──────────────┬─────┘
             │              │              │
 ┌───────────▼────┐  ┌──────▼──────┐ ┌─────▼─────────────┐
 │ Document       │  │ Extraction  │ │ Content Analysis  │
 │ Service        │  │ Service     │ │ Service           │
 └───────┬────────┘  └──────┬──────┘ └─────┬─────────────┘
         │                  │              │
 ┌───────▼────────┐  ┌──────▼──────┐ ┌─────▼─────────────┐
 │ PostgreSQL     │  │ pdfjs-dist /│ │ Gemini AI /       │
 │ Prisma ORM     │  │ Tesseract   │ │ Rule Fallback     │
 └────────────────┘  └─────────────┘ └───────────────────┘
```

> ⚠️ **Storage Behavior & Ephemeral Disk Transparency**:
> All extracted text, document metadata, engagement scores, hook rewrites, CTA suggestions, hashtags, and readability scores are **persistently stored in PostgreSQL**.
> When deployed on cloud hosting environments with ephemeral filesystems (e.g., Render free tier), raw uploaded files on server disk reset upon container restarts. However, all document reports, extracted text, and analytical metrics remain **100% persistent in PostgreSQL**.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Lucide Icons
* **Backend**: Node.js, Express.js, TypeScript
* **Database & ORM**: PostgreSQL, Prisma ORM
* **PDF Parser**: `pdfjs-dist` (v3.11.174)
* **OCR Engine**: `tesseract.js` (with async execution timeout bounds)
* **AI Analysis**: `@google/generative-ai` (Gemini 1.5 Flash) with Deterministic Fallback Engine

---

## ⚡ Quick Start / Local Setup

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/kartheek6999/social-media-content-analyzer.git
cd social-media-content-analyzer

# Install Backend Dependencies
cd backend
npm install
npx prisma generate

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

Copy `.env.example` in `backend/`:

```bash
cd backend
cp .env.example .env
```

Set variables inside `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/social_analyzer?schema=public"
GEMINI_API_KEY="" # Optional: Add key for Gemini AI
CORS_ORIGIN="*"
MAX_FILE_SIZE_MB=10
UPLOAD_DIR="uploads"
```

### 3. Run Application locally

Start backend:
```bash
cd backend
npm run dev
# Server running at http://localhost:5000
```

Start frontend:
```bash
cd frontend
npm run dev
# App running at http://localhost:3000
```

---

## 📡 API Documentation

### Base URL: `/api/v1`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/documents/upload` | Upload PDF/image file. Returns extracted text & analysis. |
| `GET` | `/documents` | Fetch all processed document records. |
| `GET` | `/documents/stats` | Fetch aggregate processing statistics. |
| `GET` | `/documents/:id` | Fetch specific document record by ID. |
| `DELETE`| `/documents/:id` | Delete document record. |

---

## 🚀 Production Deployment Instructions

### 1. Neon PostgreSQL Database
- Create a free database cluster on [Neon.tech](https://neon.tech).
- Run `npx prisma db push` inside `backend/` to apply PostgreSQL tables.

### 2. Render / Railway Backend Deployment
- Connect repository `kartheek6999/social-media-content-analyzer`.
- Set Root Directory: `backend`.
- Build Command: `npm install && npm run build`.
- Start Command: `npm start`.
- Set Environment Variables: `DATABASE_URL`, `NODE_ENV=production`, `CORS_ORIGIN=https://<your-vercel-domain>.vercel.app`.

### 3. Vercel Frontend Deployment
- Connect repository `kartheek6999/social-media-content-analyzer`.
- Set Root Directory: `frontend`.
- Set Environment Variable: `NEXT_PUBLIC_API_URL=https://<your-backend-domain>.onrender.com`.
