# MedLens — AI-Powered Clinical Information Intelligence

> **PromptWars × AIMERverse Hackathon Edition**  
> *Presented by MVSR AIMERS, Hack2Skill, and Google for Developers*  
> **Repository**: [https://github.com/23-303-mvsrec/medlens](https://github.com/23-303-mvsrec/medlens)  
> **Target Track**: Healthcare & Clinical Information Intelligence

---

## 1. Executive Summary

Clinical information is fragmented across self-reported patient intake forms, diverse diagnostic laboratory panels, unstructured physical document scans, and disconnected historical encounters. 

**MedLens** turns fragmented medical information into a **structured, traceable, verified, and longitudinally reviewable clinical patient record**.

$$\mathbf{STRUCTURE} \longrightarrow \mathbf{TRACE} \longrightarrow \mathbf{VERIFY} \longrightarrow \mathbf{COMPARE} \longrightarrow \mathbf{EXPLAIN}$$

* **Structured Data**: Normalizes raw, unstructured lab reports into strongly validated Pydantic JSON schemas.
* **Deterministic Range Engine**: Evaluates values strictly against the reference ranges printed on the source document (`LOW`, `NORMAL`, `HIGH`, `NOT_DETERMINED`). **MedLens never invents reference ranges.**
* **First-Class Provenance**: Every finding maintains an explicit origin tag (`PATIENT_PROVIDED`, `DOCUMENT_EXTRACTED`, `SYSTEM_COMPUTED`, `AI_GENERATED`, `HUMAN_VERIFIED`).
* **Conflict & Inconsistency Radar**: Programmatically detects clinical discrepancies between patient self-reports and objective lab findings.
* **Longitudinal Trends**: Compares successive diagnostic reports, computing numerical deltas ($\Delta$), percentage shifts, and flag transitions.
* **Responsible AI**: Generates plain-language, 8th-grade readability patient summaries and 3 recommended physician questions under strict non-diagnostic guardrails.
* **Smart Context-Aware Assistant**: Interactive clinical copilot that answers clinician queries with exact source report and page citations.
* **High-Efficiency In-Memory Caching**: Content-hash (SHA-256) caching eliminates redundant LLM invocations, delivering sub-10ms response times on repeated inspections.

---

## 2. Problem Statement

Modern healthcare intake suffers from four critical systemic failure modes:
1. **Cognitive Overload**: Clinicians spend up to 40% of consultation time manually cross-referencing disparate lab sheets and patient statements.
2. **Hallucinated Reference Ranges**: Generic LLM chatbots fabricate reference intervals based on generic training data rather than the specific laboratory's calibration instruments.
3. **Loss of Provenance**: AI summarizers produce prose without linking facts back to source documents, rendering independent clinical verification impossible.
4. **Uncaught Clinical Inconsistencies**: Discrepancies between patient-reported conditions and objective lab metrics (e.g., active NSAID use with acute renal impairment) go unnoticed until adverse events occur.

---

## 3. Solution Overview

MedLens operates as an **Evidence-First Clinical Information Intelligence System**:

```
PATIENT INTAKE (Patient-Provided)
       +
DIAGNOSTIC REPORT (PDF / Image / Text)
       ↓
[ AI Document Extractor ] ──(Gemini 1.5 Flash + Regex Fallback)
       ↓
[ Deterministic Range Engine ] ──(Strict Source-Provided Ranges)
       ↓
[ Canonical Finding Store ] ──(First-Class Provenance Tags)
       ↓
[ Clinical Conflict Radar ] ──(Intake vs Lab Discrepancy Detection)
       ↓
[ Human Verification Center ] ──(Verify / Edit / Reject with Audit Trail)
       ↓
[ Longitudinal Trend Engine ] ──(Delta Calculations & Trajectory Shifts)
       ↓
[ Responsible AI Summary & Assistant ] ──(Non-Diagnostic, Evidence-Citing)
```

---

## 4. Key Capabilities

| Capability | Purpose | Implementation Mechanism |
| :--- | :--- | :--- |
| **Patient Information Intake** | Captures demographics, symptoms, chronic conditions, allergies, and medications | Strongly validated Pydantic models with `PATIENT_PROVIDED` provenance |
| **Medical Report Processing** | Extracts tests, observed values, units, and source reference intervals | Google Gemini 1.5 Flash with zero-failure deterministic regex fallback |
| **Structured Medical Record** | Formats findings into organized clinical panels rather than raw prose | Categorized tables with numerical sorting, status badges, and source snippets |
| **Reference-Range Awareness** | Classifies observed values without external speculation | Deterministic parser supporting intervals (`70-99`) and cutoffs (`< 200`, `> 60`) |
| **Source Provenance** | Traces every clinical fact back to its exact document and page | Immutable provenance tags and chronological audit event logging |
| **Human-in-the-Loop Review** | Allows clinicians to verify, adjust, or reject extracted findings | Interactive Review Center with persistent clinician attribution |
| **Conflict Radar** | Detects clinical discrepancies between claims and lab data | Deterministic rule engine checking glycemic, renal, and medication conflicts |
| **Longitudinal Comparison** | Analyzes patient biomarker progression across encounters | Programmatic delta ($\Delta$), percentage change, and status transition tracking |
| **Responsible AI Summary** | Explains complex findings in plain 8th-grade language | Non-diagnostic synthesis paired with 3 doctor questions |
| **Smart Clinical Assistant** | Context-aware decision support for healthcare providers | Conversational engine citing specific report names and page numbers |
| **High-Efficiency Caching** | Eliminates redundant AI processing and reduces latency | SHA-256 LRU cache for documents, summaries, and queries |

---

## 5. User Workflow (The Golden Path)

1. **Patient Intake (`/patients`)**: Clinician creates or selects a patient dossier. Enter self-reported symptoms, chronic conditions, allergies, and active medications. Data is tagged as `PATIENT_PROVIDED`.
2. **Document Ingestion (`/documents` & `/medlens`)**: Upload diagnostic laboratory reports (scanned PDFs, images, or synthetic test panels).
3. **Structured Extraction**: Extractor normalizes tests, observed values, units, and source reference ranges.
4. **Deterministic Evaluation**: Range engine classifies each biomarker as `LOW`, `NORMAL`, `HIGH`, or `NOT_DETERMINED`.
5. **Side-by-Side Reviewer (`/medlens`)**: Clinician reviews the extracted tabular findings directly alongside the original report snippet.
6. **Conflict Radar (`/review`)**: System flags clinical discrepancies (e.g. self-reported "No diabetes" vs laboratory *Fasting Blood Glucose: 182 mg/dL*).
7. **Human Verification**: Clinician clicks **Verify**, **Edit**, or **Reject** on any finding, recording attribution in the audit trail.
8. **Longitudinal Analysis (`/trends`)**: Compares multiple reports over time, plotting exact biomarker trajectories and transition states.
9. **Patient-Friendly Summary**: MedLens provides a plain-language explanation and 3 recommended follow-up questions for the doctor.

---

## 6. System Architecture

MedLens enforces a strict **separation of concerns** across isolated architectural layers:

```
┌─────────────────────────────────────────────────────────────┐
│                 Presentation Layer (React 19)               │
│  Overview  |  Patients  |  Documents  |  Clinical Record    │
│           Review Center |  Timeline  |  Data Inspector      │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON (API_BASE)
┌──────────────────────────────▼──────────────────────────────┐
│             Application Service Facade (FastAPI)            │
│                  app/services/medlens_service.py            │
└──────┬───────────────────────┬───────────────────────┬──────┘
       │                       │                       │
┌──────▼──────────────┐ ┌──────▼──────────────┐ ┌──────▼──────┐
│  Core Domain Logic  │ │     AI Services     │ │ Persistence │
│ - range_engine.py   │ │ - extractor.py      │ │ - cache.py  │
│ - conflict_radar.py │ │ - summary_gen.py    │ │ - Local DB  │
│ - trend_engine.py   │ │ - assistant.py      │ │ - MongoDB   │
│ - provenance.py     │ │ (Gemini 1.5 Flash)  │ │   (Optional)│
└─────────────────────┘ └─────────────────────┘ └─────────────┘
```

---

## 7. AI Architecture vs. Deterministic Logic

MedLens strictly separates probabilistic AI tasks from deterministic business logic:

| Function | Responsible Engine | Rationale |
| :--- | :--- | :--- |
| **Document OCR & Parsing** | Google Gemini 1.5 Flash / Regex | Natural language understanding across heterogeneous lab formats |
| **Reference-Range Evaluation** | Deterministic Python Engine | Zero tolerance for hallucinated or floating reference limits |
| **Conflict & Inconsistency Radar**| Deterministic Clinical Rules | Reproducible, transparent clinical discrepancy detection |
| **Longitudinal Delta Calculations** | Deterministic Math Engine | Exact numerical subtraction ($\Delta$) and percentage shifts |
| **Provenance Tracking & Audit** | Deterministic Audit Logger | Tamper-evident traceability and clinical accountability |
| **Patient Summary Synthesis** | Gemini 1.5 Flash (8th Grade) | Plain-language communication and empathetic phrasing |
| **Contextual Assistant** | Gemini 1.5 Flash + Citation Filter | Evidence-grounded conversational reasoning |

---

## 8. Data Model

The canonical clinical data model is defined in `backend/app/schemas/medlens_schema.py`:

* `PatientIntake`: Demographics, symptoms, conditions, allergies, active medications, provenance.
* `LabFinding`: Test name, category, observed value, numeric value, unit, reference range, ref_min, ref_max, status (`LOW`/`NORMAL`/`HIGH`/`NOT_DETERMINED`), source document, source snippet, confidence, provenance, verification status.
* `ReviewItem`: Inconsistency type (`CONFLICT`/`WARNING`/`INFO`), severity (`CRITICAL`/`WARNING`/`INFO`), title, description, sources, resolution status (`UNRESOLVED`/`RESOLVED`/`DISMISSED`), resolution notes.
* `BiomarkerComparison`: Test name, category, previous value, previous status, current value, current status, delta ($\Delta$), delta percent ($\Delta\%$), trend (`up`/`down`/`stable`), clinical note.
* `TimelineEvent`: Event ID, patient ID, event type, title, description, timestamp, provenance, source reference.

---

## 9. Provenance & Traceability

MedLens treats provenance as an immutable data property, not a cosmetic badge:

| Provenance Level | Description | Example |
| :--- | :--- | :--- |
| `PATIENT_PROVIDED` | Information stated directly by the patient during intake | "Allergic to Penicillin", "Takes Ibuprofen 400mg PRN" |
| `DOCUMENT_EXTRACTED`| Raw metrics extracted directly from the physical lab document | "Serum Creatinine: 1.8 mg/dL (Ref: 0.6 - 1.2)" |
| `SYSTEM_COMPUTED` | Deterministic calculations executed by MedLens engines | `HIGH` status evaluation, `+87.0 mg/dL` longitudinal delta |
| `AI_GENERATED` | Plain-language explanations generated by generative models | 8th-grade patient summary, recommended physician questions |
| `HUMAN_VERIFIED` | Facts confirmed, adjusted, or resolved by a clinician | Status set to `VERIFIED` by Dr. Eleanor Vance |

---

## 10. Reference-Range Logic (Zero Hallucination Policy)

The deterministic Reference Range Engine (`backend/app/core/range_engine.py`) enforces strict clinical validation:

1. **Interval Matching**: `70.0 - 99.0` $\rightarrow$ `ref_min = 70.0`, `ref_max = 99.0`
   * Value `< 70.0` $\rightarrow$ `LOW`
   * Value `> 99.0` $\rightarrow$ `HIGH`
   * Value `70.0 <= val <= 99.0` $\rightarrow$ `NORMAL`
2. **Upper Cutoffs**: `< 200` $\rightarrow$ `ref_min = None`, `ref_max = 200.0`
   * Value `> 200.0` $\rightarrow$ `HIGH`
   * Value `<= 200.0` $\rightarrow$ `NORMAL`
3. **Lower Cutoffs**: `> 60` $\rightarrow$ `ref_min = 60.0`, `ref_max = None`
   * Value `< 60.0` $\rightarrow$ `LOW`
   * Value `>= 60.0` $\rightarrow$ `NORMAL`
4. **Missing or Ambiguous Ranges**: Returns `NOT_DETERMINED`.
   * **MedLens NEVER guesses or defaults reference limits from external internet data.**

---

## 11. Human-in-the-Loop Verification

Extracted findings are initially set to `PENDING`. Clinicians have full authority to:
* **Verify**: Confirm that the extracted value and range match the original source document.
* **Edit**: Correct any misread characters or values, automatically logging the change and updating provenance to `HUMAN_VERIFIED`.
* **Reject**: Mark erroneous findings as rejected with reviewer notes.

---

## 12. Conflict & Inconsistency Detection

The Conflict Radar (`backend/app/core/conflict_radar.py`) automatically flags:
* **Glycemic Discrepancies**: Fasting Blood Glucose $\ge 140\text{ mg/dL}$ or $\text{HbA1c} \ge 6.5\%$ without documented history of diabetes.
* **NSAID Nephrotoxicity**: Active self-reported NSAID use (Ibuprofen, Naproxen) with elevated Creatinine ($> 1.3\text{ mg/dL}$) or impaired eGFR ($< 60\text{ mL/min}$).
* **Cardiovascular Dyslipidemia**: Documented hypertension/CAD with elevated LDL cholesterol ($\ge 160\text{ mg/dL}$).
* **Symptom-Biomarker Correlation**: Chronic fatigue self-report confirmed by low Hemoglobin ($< 11.5\text{ g/dL}$).

---

## 13. Longitudinal Report Comparison

The Trend Engine (`backend/app/core/trend_engine.py`) compares multiple diagnostic reports chronologically:
* Computes exact mathematical difference: $\Delta = \text{Current} - \text{Previous}$
* Computes percentage change: $\Delta\% = \frac{\Delta}{\text{Previous}} \times 100$
* Tracks categorical flag transitions: `NORMAL -> HIGH`, `HIGH -> NORMAL`
* Flags progression, normalization, or newly emergent outliers.

---

## 14. Safety & Responsible AI Guardrails

MedLens is intentionally engineered under **strict non-diagnostic boundaries**:
* **Never Diagnoses**: Does NOT state "You have diabetes" or "Patient suffers from kidney disease."
* **Never Prescribes**: Does NOT suggest medications, start therapies, or modify drug dosages.
* **8th-Grade Accessibility**: Synthesizes clinical data into clear, accessible language.
* **Physician Collaboration**: Provides 3 specific, context-aware questions for the patient to ask their doctor.
* **Visible Disclaimers**: Displays standard disclaimers across all AI-generated views.

---

## 15. Security & Privacy

* **Zero Secret Exposure**: No API keys or credentials committed to version control. `.gitignore` strictly protects `.env`.
* **Input Sanitization & Safe Uploads**: Validates file types (`.pdf`, `.txt`, `.png`, `.jpg`) and enforces a 10MB file size ceiling.
* **Stateless Token Authentication**: Role-based access control with secure password hashing (bcrypt).
* **Safe Error Handling**: Internal stack traces and database credentials are never leaked in API error responses.

---

## 16. Testing & Validation

MedLens includes an automated unit test suite (`backend/tests/test_medlens_api.py`):
* 14 test cases covering Range Engine, Provenance, Conflict Radar, Longitudinal Trends, Caching, and Responsible AI.
* **Execution**: `python -m unittest backend/tests/test_medlens_api.py`
* **Performance**: Runs and passes in **< 0.05 seconds**.

---

## 17. Efficiency & Performance Optimization

* **In-Memory LRU Caching (`backend/app/core/cache.py`)**:
  * **Document Extraction Cache**: Computes SHA-256 hash of document text. Identical reports return cached extractions in < 5ms instead of 4000ms.
  * **Summary Cache**: Caches patient summaries by patient ID and report count.
  * **Assistant Cache**: Caches repetitive clinician inquiries.
* **Frontend Bundle Optimization**:
  * Removed dead code and unused legacy libraries.
  * Single canonical API client (`frontend/src/lib/api.ts`) prevents duplicate requests.
  * Production bundle minified and gzip-compressed with Vite.

---

## 18. Accessibility (a11y)

* **Semantic Structure**: Built with semantic HTML elements and accessible Radix UI primitives.
* **Non-Color-Exclusive Feedback**: Biomarker statuses combine distinct color coding with explicit textual descriptions and directional indicators.
* **Keyboard Usability**: Full keyboard navigation across data tables, modal dialogs, and drawer components.
* **WCAG 2.1 AA Compliance**: High-contrast typography and legible font sizes throughout.

---

## 19. Quick Start & Local Setup

### Prerequisites
* Python 3.10+ (Tested up to Python 3.14)
* Node.js v18+ and npm

### Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Application: [http://localhost:3000](http://localhost:3000)

### Run Automated Tests
```bash
python -m unittest backend/tests/test_medlens_api.py
```

---

## 20. Environment Variables (`.env.example`)

```env
# Google Gemini API Key (Optional: system provides deterministic fallback if omitted)
GEMINI_API_KEY=""

# Security
SECRET_KEY="medlens-super-secret-key-change-in-prod"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173"

# Database (Optional: falls back to resilient local JSON store if MongoDB is offline)
DATABASE_URL="mongodb://localhost:27017"
DATABASE_NAME="medlens_db"
```

---

## 21. Assumptions & Limitations

* **Assumptions**: Diagnostic reports are in English and follow standard clinical laboratory reporting conventions.
* **Limitations**: Scanned physical reports with heavy ink degradation or severe handwriting require human verification via the Review Center. MedLens is designed as clinical intelligence decision support, not an autonomous medical device.

---

> **Final Release Candidate** — Engineered for accuracy, traceability, security, and human-in-the-loop clinical review.