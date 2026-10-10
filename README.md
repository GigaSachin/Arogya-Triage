# AROGYA-TRIAGE (Enterprise MCP-Powered Human-in-the-Loop Clinical Triage Engine)

**Problem Statement:** PS03 – Multimodal Healthcare Triage Assistant for Government and Institutional Health Facilities  
**Hackathon:** BPUT Hackathon 2026 (BPUT Campus, Rourkela)  
**Lead Sponsor:** Cognizant Technology Solutions Corporation  
**Architecture Specification:** Version 2.0 (Enterprise Review Ready)

---

## 1. Executive Summary & Clinical Context

Public healthcare facilities across India—including Primary Health Centers (PHCs), Community Health Centers (CHCs), district hospitals, and institutional clinics—navigate acute patient-to-physician imbalances. Frontline health workers (ASHA/ANM) encounter heavy patient footfalls where clinical information is communicated verbally in diverse regional languages (Odia, Hindi, Indian-accented English) or captured on degraded physical paper reports.

**AROGYA-TRIAGE** is a human-in-the-loop, multimodal clinical decision-support engine. By integrating the open **Model Context Protocol (MCP)** with a deterministic rule engine, it ingests vernacular voice notes, typed narratives, and lab report images to generate standardized, chronological clinical triage summaries.

The system deterministically scores **Emergency Severity Index (ESI Levels 1–5)**, flags critical laboratory abnormalities, detects missing clinical parameters, and drafts **Ayushman Bharat Digital Mission (ABDM)** compliant referral notes—while streaming anonymized epidemiological telemetry into **Google BigQuery** for district-level syndromic public health surveillance.

---

## 2. Evaluation Criteria Alignment Matrix (100% PRD Coverage)

| Evaluation Pillar | Weight | Technical Implementation in AROGYA-TRIAGE |
| :--- | :---: | :--- |
| **Safety-First Triage Workflow** | **20%** | Deterministic ESI v4 rule engine isolated in an internal MCP tool server (`compute_esi_triage`); mandatory non-diagnostic disclaimers across all views; zero automated prescriptions. |
| **Quality of Extraction & Summarization** | **20%** | Tabular OCR extraction of lab values; ICMR/WHO parameter threshold checks; structured chronological symptom progression timelines (`Day 1 -> Day 3`). |
| **Multimodal Capabilities** | **15%** | Indic speech-to-text pipeline supporting Odia (ଓଡ଼ିଆ), Hindi (हिन्दी), and English; degraded paper lab slip OCR; interactive visual waveform. |
| **India-Wide Facility Relevance** | **15%** | Offline-resilient edge caching architecture for low-bandwidth rural PHCs; multi-facility profiles across Odisha (Sundargarh, Khordha, Cuttack, Sambalpur). |
| **Human-Review & Escalation Logic** | **15%** | Priority-ordered Reviewer Dashboard (Red ESI 1-2 at top, Yellow ESI 3, Green ESI 4-5); 1-click single action approval; mandatory clinical override audit logging; 1-click ABDM referral PDF export. |
| **Privacy & Responsible AI Controls** | **10%** | Automated in-flight PII masking (12-digit Aadhaar `XXXX-XXXX-XXXX`, 10-digit phone, patient name tokenization); 100% synthetic de-identified vectors; audit logging. |
| **Demo Quality & Test Vectors** | **5%** | 3 pre-built benchmark synthetic test scenarios (TC-01 Red Sepsis, TC-02 Yellow Febrile, TC-03 Green OPD) with 1-click live demo switcher. |

---

## 3. System Architecture & Components

```
+-----------------------------------------------------------------------------------+
|                         CLIENT LAYER (React / Modern CSS)                         |
|  - Vernacular Voice Recorder (Odia/Hindi/English) with Live Frequency Waveform    |
|  - Medical Report / Degraded Lab Slip Drag-and-Drop Ingestion (PNG, JPEG, PDF)    |
|  - Reviewer Dashboard (Priority Live Queue: Red -> Yellow -> Green)               |
|  - District Syndromic Surveillance Heatmap (Sundargarh, Khordha, Cuttack)         |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                     GATEWAY & ORCHESTRATION (Python / FastAPI)                    |
|  - In-flight PII Masking Engine (Aadhaar & Phone Regex Sanitization)              |
|  - Transcription & Vision Service (Indic STT Lexicon & Tabular OCR Engine)        |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                  CLINICAL MCP SERVER (Deterministic Rule Layer)                   |
|  - validate_lab_parameters: Evaluates quantitative results against ICMR bounds    |
|  - compute_esi_triage: Deterministic ESI Levels 1-5 triage scoring                |
|  - identify_missing_info: Detects protocol and diagnostic blind spots             |
|  - generate_abdm_fhir_bundle: Exports standard HL7/FHIR Composition bundles       |
+-----------------------------------------------------------------------------------+
                      |                                       |
                      v                                       v
+------------------------------------+   +------------------------------------------+
|        TRANSACTIONAL QUEUE         |   |          ENTERPRISE SRE TELEMETRY        |
|  - Low-latency SQLite state storage|   |  - Asynchronous background worker thread |
|  - Real-time reviewer queue updates|   |  - Google BigQuery live streaming        |
|  - Immutable override audit trail  |   |  - District syndromic heatmap telemetry  |
+------------------------------------+   +------------------------------------------+
```

---

## 4. Benchmark Synthetic Test Scenarios (PRD Section 6)

### TC-01 (Red: Critical Sepsis / Thrombocytopenia)
- **Voice (Odia):** `"ଅତ୍ୟଧିକ ଜ୍ୱର, ମୁଣ୍ଡ ଘୂରାଉଛି, ମାଢ଼ିରୁ ରକ୍ତ ପଡୁଛି"` ("Severe fever, confusion, gum bleeding.")
- **Lab OCR Findings:** Platelets = `16,000 /µL`, Total WBC = `14,200 /µL`, Pulse = `128 bpm`, $\text{SpO}_2$ = `89%`, Systolic BP = `88 mmHg`.
- **Expected Deterministic Output:** **ESI Level 2 (RED - Emergent)**.
- **Flags:** `CRITICAL_THROMBOCYTOPENIA`, `HYPOXEMIA_ALERT`, `TACHYCARDIA`, `ALTERED_SENSORIUM`.
- **Clinical Escalation:** High-priority queue sorting, visual red beacon, prompt for immediate IV access and Platelet Concentrate transfusion setup.

### TC-02 (Yellow: Febrile Illness / Dehydration)
- **Text (Hindi):** `"३ दिन से तेज़ बुखार, लगातार दस्त और उल्टी"` ("3 days high fever, persistent diarrhea, vomiting.")
- **Vitals & Labs:** Temp = `102.8°F`, BP = `100/65 mmHg`, Pulse = `98 bpm`, Dengue NS1 = `POSITIVE`, Platelets = `115,000 /µL`.
- **Expected Deterministic Output:** **ESI Level 3 (YELLOW - Urgent)**.
- **Flags:** `HIGH_GRADE_FEBRILE_RESPONSE`, `MODERATE_THROMBOCYTOPENIA`.
- **Doctor Prompts:** Check urine output timing, evaluate skin turgor, request Dengue NS1 / Malaria smear confirmation.

### TC-03 (Green: Routine OPD / Dressing)
- **Text (English):** `"Superficial forearm abrasion dressing change; no fever."`
- **Vitals & Labs:** Temp = `98.4°F`, BP = `118/78 mmHg`, Pulse = `74 bpm`, Fasting Sugar = `92 mg/dL`, Platelets = `280,000 /µL`.
- **Expected Deterministic Output:** **ESI Level 5 (GREEN - Non-Urgent)**.
- **Flags:** None (Normal limits).
- **Escalation:** Standard outpatient queue placement; automated Tetanus Toxoid vaccination history verification prompt.

---

## 5. Quick Start & Execution Guide

### 1. Backend Service (FastAPI)
The backend daemon runs on port `8000`:
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- **Interactive OpenAPI Documentation:** `http://127.0.0.1:8000/docs`
- **Healthcheck:** `http://127.0.0.1:8000/api/health`

### 2. Frontend Interface (React + Vite)
The frontend dev server runs on port `5173`:
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- **Web Application URL:** `http://127.0.0.1:5173`

### 3. Automated Clinical Test Suite
Run the test suite to verify 100% compliance against all PRD requirements:
```bash
cd backend
python test_suite.py
```

---

## 6. Regulatory & Non-Diagnostic Notice
> **ADVISORY ONLY:** Decision-support tool for qualified medical personnel. Non-diagnostic. Does not replace professional clinical examination. Zero automated prescriptions permitted.
