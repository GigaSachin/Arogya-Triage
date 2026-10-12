# AROGYA-TRIAGE: Multimodal Clinical & Veterinary Healthcare Triage Assistant

**Problem Statement:** PS03 – Multimodal Healthcare Triage Assistant for Government and Institutional Health Facilities  
**Hackathon:** BPUT Hackathon 2026 (BPUT Campus, Rourkela)  
**Lead Sponsor:** Cognizant Technology Solutions Corporation  
**Architecture Specification:** Version 2.5 (Enterprise Hackathon MVP Ready)

---

## 1. Executive Summary & Architecture Overview

Public healthcare and animal husbandry facilities across India navigate acute patient-to-clinician imbalances. Frontline health workers (ASHA/ANM) and field paravets/livestock inspectors encounter heavy footfalls where critical symptoms are communicated verbally in regional languages (Odia, Hindi, Indian-accented English) or captured on paper report slips.

**AROGYA-TRIAGE** is a dual-pathway, multimodal clinical decision-support platform designed for institutional health infrastructure across Odisha:
1. **Human Healthcare Pathway (Core Solution - BPUT PS03):** Deterministic Emergency Severity Index (ESI Levels 1–5), multimodal Indic voice and degraded paper lab OCR extraction, Ayushman Bharat Digital Mission (ABDM) HL7 FHIR bundle generation, in-flight PII anonymization, and doctor approval/override audit logs.
2. **Veterinary Care Pathway (Innovative Extension):** Rural companion animal and livestock emergency triage aligned with Veterinary Emergency and Critical Care Society (VECCS), RECOVER, and Indian Council of Agricultural Research (ICAR) standards. Features bovine & canine emergency norms, zero automated drug prescriptions, DAH&VS printable clinical transfer notes, and non-guessing uncertainty states for beta species (goats, buffaloes, cats).

---

## 2. System Architecture & Domain Isolation

```
+---------------------------------------------------------------------------------------------------+
|                            CLIENT LAYER (React / Obsidian Glass CSS)                              |
|  - Landing Gateway (Dual Pathway Switcher: Human Clinical vs. Veterinary Emergency)               |
|  - Human Intake Kiosk: Indic Voice Waveform (Odia/Hindi/Eng), Paper Lab OCR Table Drag-and-Drop   |
|  - Veterinary Intake Node: Species-Specific Vitals, Bovine Bloat/Parvo Presets, Masked Contacts   |
|  - Reviewer Dashboards: Doctor Queue (ESI 1-5, ABDM FHIR) & Vet Officer Queue (VTI Urgency, DAH&VS)|
|  - Public Health Surveillance: Odisha 30-District Syndromic Telemetry & BigQuery Heatmap Stream   |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                        FASTAPI API GATEWAY & SECURE ORCHESTRATION LAYER                           |
|  - In-Flight PII Masking: 12-digit Aadhaar (XXXX-XXXX-XXXX) & Mobile (XXXXX-XXXX) Sanitizer       |
|  - Indic Voice & Vision Services: Offline-safe phonetic normalizer & Tabular OCR isolation        |
+---------------------------------------------------------------------------------------------------+
             |                                                             |
             v                                                             v
+---------------------------------------------+       +---------------------------------------------+
|    HUMAN CLINICAL DOMAIN (MCP v1.0)         |       |      VETERINARY MEDICINE DOMAIN (VECCS)     |
|  - ESI v4 Deterministic Risk Calculator     |       |  - Species Physiological Norms (Cattle/Dog) |
|  - Diagnostic Blind Spot Detector           |       |  - VTI Triage Index (Critical/Emergent/OPD) |
|  - ABDM HL7 FHIR Composition Bundle Builder |       |  - Non-Guessing Uncertainty Safety Engine   |
|  - Physician Override & Audit Trail (PRD)   |       |  - Zero-Prescription Guardrail Enforcer     |
|  - ABDM 1-Click Referral PDF Generator      |       |  - DAH&VS Clinical Transfer Note PDF Engine |
+---------------------------------------------+       +---------------------------------------------+
                      \                                               /
                       v                                             v
+---------------------------------------------------------------------------------------------------+
|                             SHARED INSTITUTIONAL INFRASTRUCTURE                                   |
|  - Transactional SQLite Database with Domain Filtering (domain = 'human' | 'veterinary')          |
|  - Cross-Domain Security Guard: Animals strictly rejected from ESI & FHIR endpoints (HTTP 400)    |
|  - Immutable Clinical Override Audit Trail (logged with physician credentials & justifications)   |
|  - Enterprise Telemetry Worker: Google BigQuery Syndromic Public Health Stream                    |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Evaluation Criteria Alignment Matrix

| Evaluation Pillar | Weight | Technical Implementation in AROGYA-TRIAGE |
| :--- | :---: | :--- |
| **Safety-First Triage Workflow** | **20%** | Deterministic ESI v4 and VTI rule engines isolated from LLM overrides; mandatory disclaimers on every view; zero drug dosages or home treatments. |
| **Quality of Extraction & Summarization** | **20%** | Tabular OCR extraction of clinical laboratory slips; species-specific reference bounds; structured chronological symptom timelines. |
| **Multimodal Capabilities** | **15%** | Indic speech-to-text pipeline supporting Odia (ଓଡ଼ିଆ), Hindi (हिन्दी), and English; degraded paper lab slip OCR; species physiological vitals matrix. |
| **India-Wide Facility Relevance** | **15%** | Tailored to rural CHCs, PHCs, and veterinary polyclinics across Odisha (Sundargarh, Khordha, Cuttack, Sambalpur); offline-safe fallbacks. |
| **Human-Review & Escalation Logic** | **15%** | Priority live queues (Red Emergent at top); 1-click approvals; mandatory clinical justification audit logging; 1-click ABDM & DAH&VS PDF exports. |
| **Privacy & Responsible AI Controls** | **10%** | Automated in-flight PII masking of Aadhaar and owner contact numbers; 100% synthetic test vectors; zero patient data leakage into logs. |
| **Demo Quality & Test Vectors** | **5%** | 7 pre-calibrated benchmark scenarios (TC-01..03 Human, VET-01..04 Veterinary) with 1-click live vector switchers and database reset. |

---

## 4. Benchmark Synthetic Test Scenarios

### Human Healthcare Scenarios (PRD PS03)
- **TC-01 (Red: Sepsis / Thrombocytopenia):** Odia speech `"ଅତ୍ୟଧିକ ଜ୍ୱର, ମୁଣ୍ଡ ଘୂରାଉଛି, ମାଢ଼ିରୁ ରକ୍ତ ପଡୁଛି"`. Platelets `16,000 /µL`, WBC `14,200`, Pulse `128 bpm`, $\text{SpO}_2$ `89%`. **Evaluates to ESI Level 2 (RED - Emergent)**.
- **TC-02 (Yellow: Febrile Illness / Dehydration):** Hindi narrative `"३ दिन से तेज़ बुखार, लगातार दस्त और उल्टी"`. Temp `102.8°F`, Dengue NS1 `POSITIVE`, Platelets `115,000 /µL`. **Evaluates to ESI Level 3 (YELLOW - Urgent)**.
- **TC-03 (Green: Routine OPD Dressing):** English text `"Superficial forearm abrasion dressing change; no fever"`. Afebrile, vitals normal. **Evaluates to ESI Level 5 (GREEN - Non-Urgent)**.

### Veterinary Care Scenarios (VECCS / ICAR)
- **VET-TC-01 (Cattle Bloat & Dyspnea):** Bovine cow presenting with severe left paralumbar fossa distension post-clover grazing, cyanotic mucous membranes, CRT `2.8s`, respiration `54 breaths/min`. **Evaluates to CRITICAL (Code RED)**. Triggers emergency decompression directives; zero drugs prescribed.
- **VET-TC-02 (Canine Parvovirus Suspect):** 4-month unvaccinated puppy with foul-smelling bloody diarrhea, persistent vomiting, pale membranes, CRT `2.5s`, temp `103.8°F`. **Evaluates to EMERGENT (Code RED)**.
- **VET-TC-03 (Canine Routine OPD Check):** Adult dog presenting for annual Rabies vaccination booster and superficial ear scratch. Vitals normal. **Evaluates to ROUTINE (Code GREEN)**.
- **VET-TC-04 (Caprine Beta Uncertainty State):** Young goat presenting with dullness and reduced appetite. Because goat is a beta species, the rule engine refuses to guess and safely returns **UNCERTAIN (Non-Guessing State)** recommending qualified veterinarian evaluation.

---

## 5. Quick Start & Local Execution

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Backend Service (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- **Interactive OpenAPI Documentation:** `http://127.0.0.1:8000/docs`
- **Human Gateway Healthcheck:** `http://127.0.0.1:8000/api/health`
- **Veterinary Gateway Healthcheck:** `http://127.0.0.1:8000/api/veterinary/health`

### 2. Frontend Interface (React + Vite)
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- **Web Application URL:** `http://127.0.0.1:5173` (or proxy on `http://127.0.0.1:5174`)

---

## 6. Automated Test Suites (31 Passing Tests)

Run all three test suites locally:

### Suite 1: Human Clinical Test Suite (7 Vectors)
```bash
cd backend
python test_suite.py
```
*Validates: In-flight PII masking, TC-01 ESI 2, TC-02 ESI 3, TC-03 ESI 5, Diagnostic Blind Spot detection, ABDM HL7 FHIR Bundle validation, and ABDM Referral PDF generator.*

### Suite 2: Veterinary Clinical & Security Suite (12 Vectors)
```bash
cd backend
python test_veterinary_suite.py
```
*Validates: Cattle bloat critical evaluation, Canine parvo emergent evaluation, Canine OPD routine evaluation, Beta species uncertainty handling, Unsupported species rejection, Blank symptom safety guard, Zero drug prescriptions compliance, Blind spots identification, DAH&VS Referral PDF generation, SQLite domain isolation, FastAPI REST routes via TestClient, and Cross-domain endpoint security boundaries.*

### Suite 3: Live Dev Server HTTP E2E Integration Suite (12 Vectors)
```bash
cd backend
python test_e2e_integration.py
```
*Validates: Live frontend root mounting, Human and Vet health checks, Live Human ESI intake, Human ABDM PDF download, Live Veterinary VTI intake, Veterinary DAH&VS PDF download, Single-click approval, Urgency category override audit logging, Cross-domain 400 rejection boundaries, Queue separation, and Audit logs.*

---

## 7. Key API Endpoint Reference

| Method | Endpoint | Domain | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | Human | Human clinical triage gateway health & telemetry status |
| `POST` | `/api/intake` | Human | Submits human patient case for deterministic ESI evaluation |
| `GET` | `/api/queue` | Shared | Priority-sorted triage queue (filtered by domain, status, district) |
| `POST` | `/api/queue/{id}/approve` | Human | Medical Officer single-click case approval |
| `POST` | `/api/queue/{id}/override` | Human | Clinical ESI override with mandatory justification audit log |
| `GET` | `/api/queue/{id}/referral/pdf`| Human | Generates ABDM-compliant clinical referral summary PDF |
| `GET` | `/api/queue/{id}/fhir` | Human | Exports ABDM HL7/FHIR R4 Composition JSON bundle |
| `GET` | `/api/veterinary/health` | Veterinary | Veterinary decision support health & species status |
| `GET` | `/api/veterinary/config` | Veterinary | Returns species physiological reference intervals |
| `POST` | `/api/veterinary/triage` | Veterinary | Submits animal case for deterministic species triage |
| `GET` | `/api/veterinary/queue` | Veterinary | Priority-sorted live animal triage queue |
| `POST` | `/api/veterinary/queue/{id}/approve` | Veterinary | Veterinary Officer single-click approval |
| `POST` | `/api/veterinary/queue/{id}/override` | Veterinary | Veterinary urgency override with mandatory justification |
| `GET` | `/api/veterinary/queue/{id}/referral/pdf` | Veterinary | Generates DAH&VS clinical transfer note PDF |
| `GET` | `/api/audit/logs` | Shared | Immutable clinical audit logs (domain filtered) |
| `POST` | `/api/synthetic/load` | Shared | Resets database to pristine benchmark test vectors |

---

## 8. Regulatory & Non-Diagnostic Notice
> **ADVISORY ONLY:** AROGYA-TRIAGE is an automated decision-support tool for qualified healthcare professionals, medical officers, and registered veterinary practitioners. Non-diagnostic. It does not replace professional clinical examination or veterinary diagnosis. Zero automated drug prescriptions, antibiotic selections, or home treatment dosages permitted.
