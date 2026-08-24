# Social Media Content Analyzer 🚀

A production-quality full-stack web application designed to upload social media documents (PDFs) and screenshots (PNG, JPG, JPEG), extract text via layout-preserving PDF parsing and Tesseract OCR, analyze engagement potential, and provide actionable suggestions to optimize reach and conversions.

---

## 🌟 Features

* **Multi-Format Document Upload**:
  * Upload PDF files and image formats (PNG, JPG, JPEG).
  * Smooth **Drag and Drop** interface with hover highlights and standard file picker.
  * Validation for MIME types, file extensions, and file size limits (10MB default).
* **Text Extraction Engine**:
  * **PDF Text Extraction**: Preserves paragraph breaks, line spacing, page demarcations, and detectable headings using `pdf-parse`.
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

## 🏗️ Architecture

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
 │ PostgreSQL     │  │ PDF Parse / │ │ Gemini AI /       │
 │ Prisma ORM     │  │ Tesseract   │ │ Rule Fallback     │
 └────────────────┘  └─────────────┘ └───────────────────┘
```

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Lucide Icons
* **Backend**: Node.js, Express.js, TypeScript
* **Database & ORM**: PostgreSQL, Prisma ORM
* **PDF Parser**: `pdf-parse` (custom page renderer for structural retention)
* **OCR Engine**: `tesseract.js` (with async execution timeout bounds)
* **AI Analysis**: `@google/generative-ai` (Gemini 1.5 Flash) with Deterministic Fallback Engine

---

## ⚡ Quick Start / Local Setup

### Prerequisites
* Node.js v18+ 
* npm or yarn
* PostgreSQL (Optional local instance or Neon PostgreSQL URL)

### 1. Clone Repository & Install Dependencies

```bash
git clone <repository-url>
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
MAX_FILE_SIZE_MB=10
ALLOWED_MIME_TYPES="application/pdf,image/png,image/jpeg,image/jpg"
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

#### Sample Upload Response:
```json
{
  "success": true,
  "message": "Document uploaded and analyzed successfully",
  "data": {
    "id": "doc-1724500000000-abc123",
    "originalFilename": "post_draft.pdf",
    "fileType": "application/pdf",
    "fileSize": 1048576,
    "status": "COMPLETED",
    "extractedText": "Are you struggling to scale SaaS revenue...",
    "analysis": {
      "contentType": "Carousel / Multi-Slide Post",
      "summary": "The post highlights 3 core SaaS growth shifts...",
      "engagementScore": 85,
      "strengths": ["Strong hook present in opening line", "Clear call to action included"],
      "weaknesses": ["Dense text in second paragraph"],
      "suggestions": ["Break text into 1-2 sentence paragraphs"],
      "hookSuggestion": "Are you struggling to scale SaaS revenue in 2026?",
      "ctaSuggestion": "Found this helpful? Save this post and comment below!",
      "hashtags": ["#SaaS", "#Growth", "#ContentStrategy"],
      "readability": {
        "score": 85,
        "feedback": "Easy to read and scanner-friendly."
      }
    }
  }
}
```

---

## 🧠 Design Decisions & Engineering Tradeoffs

1. **Modular Monolith over Microservices**:
   For an 8-hour technical assessment, splitting OCR, text parsing, and analysis into separate microservices introduces unnecessary network overhead and deployment fragility. A modular monolith cleanly isolates domains (`documents`, `extraction`, `analysis`) while sharing a unified server process.
2. **Resilient Database Layer**:
   The application uses Prisma ORM configured for PostgreSQL. If PostgreSQL is temporarily unreachable or unconfigured during initial assessment evaluation, `DocumentService` gracefully defaults to an in-memory cache so the full upload-extract-analyze UI loop continues working seamlessly.
3. **OCR Execution Guards**:
   Tesseract OCR worker runs within a `Promise.race` timeout guard (45 seconds). This guarantees that blurry or unparseable images never cause server worker locks.
4. **Deterministic AI Fallback**:
   To avoid failing when an LLM API key is absent, `DeterministicAnalysisProvider` evaluates real structural text properties (question hooks, CTA keyword detection, bullet point formatting, word density) to output real analytical scores.

---

## 🚀 Deployment Instructions

* **Frontend**: Deploy `frontend/` to **Vercel**. Set `NEXT_PUBLIC_API_URL` to point to the backend URL.
* **Backend**: Deploy `backend/` to **Render** or **Railway**. Set `DATABASE_URL` and environment variables.
* **Database**: Managed **Neon PostgreSQL** database cluster.

---

## 📋 Final Requirements Verification Checklist

* [x] PDF file upload & layout-preserving text extraction
* [x] Image file upload (PNG, JPG, JPEG) with Tesseract OCR
* [x] Drag and drop area with progress indicators & validation
* [x] Content summary, Engagement Score, Hook & CTA recommendations
* [x] Document processing telemetry dashboard & history management
* [x] Production-ready codebase with centralized error handling & TypeScript types
