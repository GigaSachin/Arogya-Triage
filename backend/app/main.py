"""
AROGYA-TRIAGE: Main Gateway & Orchestration Engine (FastAPI)
Enterprise MCP-Powered Human-in-the-Loop Clinical Triage Engine
Lead Developer: Sachin | Sponsored by Cognizant | BPUT Hackathon 2026
"""
import uuid
import datetime
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header, BackgroundTasks
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

from . import config
from .config import (
    REGULATORY_DISCLAIMER, FACILITIES, CLINICAL_REFERENCE_INTERVALS,
    UPLOAD_DIR, PDF_DIR, ODISHA_DISTRICTS
)
from .pii_anonymizer import PIIAnonymizer
from .mcp_server import ClinicalMCPServer
from .ocr_service import LabSlipOCRService
from .voice_service import IndicVoiceService
from .telemetry_service import BigQueryTelemetryService
from .pdf_generator import ABDMReferralPDFGenerator
from .db import TriageDatabase, init_db
from .seed_data import seed_synthetic_scenarios
from .veterinary_router import router as veterinary_router
from .veterinary_pdf import VeterinaryReferralPDFGenerator

# Initialize FastAPI App
app = FastAPI(
    title="AROGYA-TRIAGE API",
    description="Enterprise MCP-Powered Human-in-the-Loop Clinical Triage Engine",
    version="2.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Veterinary Gateway Router
app.include_router(veterinary_router)

# Initialize Database at startup
@app.on_event("startup")
def on_startup():
    init_db()
    print("AROGYA-TRIAGE Engine initialized in live human-operated clinical triage mode.")

# -------------------------------------------------------------
# Pydantic Request Models
# -------------------------------------------------------------
class VitalsInput(BaseModel):
    spo2: Optional[float] = None
    pulse: Optional[float] = None
    systolic_bp: Optional[float] = None
    diastolic_bp: Optional[float] = None
    temperature: Optional[float] = None
    respiration_rate: Optional[float] = None

class PatientIntakeRequest(BaseModel):
    patient_id: Optional[str] = None
    name: Optional[str] = None
    aadhaar: Optional[str] = None
    phone: Optional[str] = None
    facility_id: str = "FAC-ROU-01"
    vernacular_language: str = "english"
    symptoms_raw: str
    vitals: VitalsInput
    labs: Dict[str, Any] = Field(default_factory=dict)
    red_flags: List[str] = Field(default_factory=list)
    lab_image_path: Optional[str] = None
    test_case_id: Optional[str] = None

class OverrideRequest(BaseModel):
    new_esi: int
    justification_reason: str
    doctor_name: str = "Dr. S. Mohanty, Medical Officer"

class ApproveRequest(BaseModel):
    doctor_name: str = "Dr. S. Mohanty, Medical Officer"

class TranscribeRequest(BaseModel):
    language: str = "odia"
    text: Optional[str] = None
    scenario_preset: Optional[str] = None

class VoiceKeyRequest(BaseModel):
    api_key: str = ""

class TranslateRequest(BaseModel):
    text: str
    source_language: str = "od-IN"
    target_language: str = "en-IN"
    api_key: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    language: str = "odia"
    speaker: str = "aditya"
    api_key: Optional[str] = None

class TestSarvamRequest(BaseModel):
    api_key: Optional[str] = None

class MCPExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]

# -------------------------------------------------------------
# System & Configuration Endpoints
# -------------------------------------------------------------
@app.get("/", response_class=HTMLResponse)
def root_portal():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AROGYA-TRIAGE Engine</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
    }
    .card {
      background: #0f172a;
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 16px;
      max-width: 680px;
      width: 100%;
      padding: 2.5rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      margin-bottom: 1.25rem;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .dot { width: 8px; height: 8px; background: #10b981; borderRadius: 50%; display: inline-block; }
    h1 { font-size: 1.85rem; font-weight: 800; color: #ffffff; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
    p.lead { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.75rem; }
    .btn-group { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 2rem; }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 0.85rem 1.4rem;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }
    .btn-primary:hover { background: linear-gradient(135deg, #1d4ed8, #1e40af); transform: translateY(-1px); }
    .btn-secondary {
      background: rgba(30, 41, 59, 0.8);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .btn-secondary:hover { background: rgba(51, 65, 85, 0.8); color: #ffffff; }
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(148, 163, 184, 0.15);
    }
    .service-item {
      background: #1e293b;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.78rem;
    }
    .service-title { color: #64748b; font-size: 0.7rem; text-transform: uppercase; font-weight: 700; margin-bottom: 0.25rem; }
    .service-val { color: #38bdf8; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> Backend Engine Online (Port 8000)</div>
    <h1>AROGYA-TRIAGE</h1>
    <p class="lead">
      Autonomous Clinical Emergency & Veterinary Triage System. The API backend is running here on port 8000, while the full interactive user application is hosted on port 5173.
    </p>

    <div class="btn-group">
      <a href="http://localhost:5173" class="btn btn-primary">
        🚀 Launch Arogya-Triage Web Application (Port 5173)
      </a>
      <a href="/docs" class="btn btn-secondary">
        📖 Open Swagger Interactive API Documentation (/docs)
      </a>
    </div>

    <div class="services-grid">
      <div class="service-item">
        <div class="service-title">Indic STT</div>
        <div class="service-val">Sarvam saaras:v3</div>
      </div>
      <div class="service-item">
        <div class="service-title">Translation</div>
        <div class="service-val">Sarvam Indic formal</div>
      </div>
      <div class="service-item">
        <div class="service-title">Voice Synth</div>
        <div class="service-val">Sarvam bulbul:v3</div>
      </div>
      <div class="service-item">
        <div class="service-title">Veterinary</div>
        <div class="service-val">OneHealth Gateway</div>
      </div>
    </div>
  </div>
</body>
</html>"""

@app.get("/health")
@app.get("/api/health")
def healthcheck():
    return {
        "status": "HEALTHY",
        "service": "AROGYA-TRIAGE Enterprise Clinical Engine",
        "version": "2.0.0",
        "regulatory_disclaimer": REGULATORY_DISCLAIMER,
        "mcp_server": "ONLINE (Deterministic Isolated Layer)",
        "telemetry_stream": "ACTIVE (Google BigQuery Async Pipeline)",
        "pii_anonymizer": "ENFORCED (Aadhaar/Phone Regex + Presidio Masking)",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@app.get("/api/config")
def get_system_config():
    return {
        "regulatory_disclaimer": REGULATORY_DISCLAIMER,
        "facilities": FACILITIES,
        "odisha_districts": ODISHA_DISTRICTS,
        "reference_intervals": CLINICAL_REFERENCE_INTERVALS
    }

# -------------------------------------------------------------
# Model Context Protocol (MCP) Endpoints
# -------------------------------------------------------------
@app.get("/api/mcp/tools")
def list_mcp_tools():
    """Returns declared MCP tool definitions for external LLMs / agents"""
    return {
        "protocol": "Model Context Protocol (MCP) v1.0",
        "isolation": "DETERMINISTIC_RULE_BOUND",
        "tools": ClinicalMCPServer.get_tool_definitions()
    }

@app.post("/api/mcp/execute")
def execute_mcp_tool(req: MCPExecuteRequest):
    """Direct execution of deterministic clinical MCP tools"""
    tool = req.tool_name
    args = req.arguments

    if tool == "validate_lab_parameters":
        return ClinicalMCPServer.validate_lab_parameters(args.get("labs", {}))
    elif tool == "compute_esi_triage":
        return ClinicalMCPServer.compute_esi_triage(
            vitals=args.get("vitals", {}),
            red_flags=args.get("red_flags", []),
            symptoms=args.get("symptoms", []),
            labs=args.get("labs", {})
        )
    elif tool == "identify_missing_info":
        return ClinicalMCPServer.identify_missing_info(
            symptoms=args.get("symptoms", []),
            vitals_present=args.get("vitals_present", {}),
            labs_present=args.get("labs_present", {})
        )
    elif tool == "generate_abdm_fhir_bundle":
        return ClinicalMCPServer.generate_abdm_fhir_bundle(args.get("triage_record", {}))
    else:
        raise HTTPException(status_code=400, detail=f"Unknown MCP tool: {tool}")

# -------------------------------------------------------------
# Vernacular Voice & Speech-to-Text Pipeline
# -------------------------------------------------------------
@app.post("/api/voice/transcribe")
def transcribe_vernacular(req: TranscribeRequest):
    """
    Transcribes vernacular speech / text in Odia, Hindi, or English,
    normalizes symptoms, and extracts clinical timeline.
    """
    res = IndicVoiceService.transcribe_audio_or_text(
        language=req.language,
        text_input=req.text,
        scenario_preset=req.scenario_preset
    )
    return res

@app.get("/api/voice/status")
def get_voice_status():
    """
    Returns the real-time configuration status of the Sarvam AI Indic Speech & Language pipeline.
    """
    key = (config.SARVAM_API_KEY or os.getenv("SARVAM_API_KEY", "")).strip()
    return {
        "status": "ONLINE",
        "sarvam_configured": bool(key),
        "api_key_masked": (key[:4] + "..." + key[-4:]) if len(key) >= 8 else ("Configured" if key else None),
        "supported_languages": [
            {"code": "od-IN", "label": "ଓଡ଼ିଆ (Odia)", "id": "odia"},
            {"code": "hi-IN", "label": "हिन्दी (Hindi)", "id": "hindi"},
            {"code": "en-IN", "label": "English (India)", "id": "english"}
        ],
        "model": config.SARVAM_STT_MODEL,
        "tts_model": config.SARVAM_TTS_MODEL,
        "service_url": config.SARVAM_STT_URL,
        "features": [
            "Speech-to-Text (saaras:v3)",
            "Vernacular Translation (od-IN -> en-IN)",
            "Speech Synthesis (bulbul:v3)"
        ]
    }

@app.post("/api/voice/configure-key")
def configure_voice_key(req: VoiceKeyRequest):
    """
    Dynamically saves and updates the Sarvam AI API subscription key in-flight
    without requiring a backend restart.
    """
    new_key = req.api_key.strip()
    config.SARVAM_API_KEY = new_key
    os.environ["SARVAM_API_KEY"] = new_key
    return {
        "status": "SUCCESS",
        "sarvam_configured": bool(new_key),
        "api_key_masked": (new_key[:4] + "..." + new_key[-4:]) if len(new_key) >= 8 else ("Configured" if new_key else None),
        "message": "Sarvam AI API key successfully saved and active across all endpoints." if new_key else "Sarvam AI API key cleared."
    }

@app.post("/api/voice/test-sarvam")
async def test_sarvam_connectivity(req: Optional[TestSarvamRequest] = None):
    """
    Performs real-time live validation of the Sarvam AI subscription key against
    Translation, Speech-to-Text, and Text-to-Speech pipelines.
    """
    key = req.api_key if (req and req.api_key) else None
    results = await IndicVoiceService.test_sarvam_connectivity(api_key=key)
    return results

@app.post("/api/voice/translate")
async def translate_indic_text(req: TranslateRequest):
    """
    Translates vernacular Indic clinical complaints to English using Sarvam AI Translation.
    """
    translated = await IndicVoiceService.translate_text(
        text=req.text,
        source_language=req.source_language,
        target_language=req.target_language,
        api_key=req.api_key
    )
    if translated is None:
        raise HTTPException(status_code=502, detail="Sarvam translation service unavailable or key missing")
    return {
        "status": "SUCCESS",
        "original_text": req.text,
        "translated_text": translated,
        "source_language": req.source_language,
        "target_language": req.target_language,
        "provider": "Sarvam AI Translation"
    }

@app.post("/api/voice/tts")
async def synthesize_speech(req: TTSRequest):
    """
    Generates spoken Indic audio from text using Sarvam AI TTS (bulbul:v3).
    """
    res = await IndicVoiceService.synthesize_speech(
        text=req.text,
        language=req.language,
        speaker=req.speaker,
        api_key=req.api_key
    )
    if not res:
        raise HTTPException(status_code=502, detail="Sarvam speech synthesis service unavailable or key missing")
    return res

@app.post("/api/voice/transcribe-audio")
async def transcribe_audio_file(
    file: UploadFile = File(...),
    language: str = Form("odia"),
    api_key: Optional[str] = Form(None),
    x_sarvam_key: Optional[str] = Header(None, alias="X-Sarvam-Key")
):
    """
    Accepts real microphone audio (WAV, MP3, WEBM, M4A) and transcribes
    using Sarvam AI Speech-to-Text with Indic language support (Odia, Hindi, English).
    Falls back gracefully if API key is missing or offline.
    """
    content = await file.read()
    effective_key = api_key or x_sarvam_key
    res = await IndicVoiceService.transcribe_audio_file(
        file_bytes=content,
        filename=file.filename or "recording.webm",
        language=language,
        api_key=effective_key
    )
    return res

# -------------------------------------------------------------
# Multimodal OCR Lab Slip Ingestion
# -------------------------------------------------------------
@app.post("/api/ocr/upload")
async def upload_lab_slip(file: UploadFile = File(...)):
    """
    Accepts lab slip images (PNG, JPEG) up to 5MB,
    performs tabular parameter isolation, and returns extracted numerical values.
    """
    ext = Path(file.filename).suffix or ".png"
    save_filename = f"lab_slip_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = UPLOAD_DIR / save_filename

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 5MB size limit")

    with open(dest_path, "wb") as f:
        f.write(content)

    # Process image through OCR module
    parsed = LabSlipOCRService.process_lab_slip(str(dest_path))

    return {
        "status": "SUCCESS",
        "filename": save_filename,
        "image_url": f"/api/lab/image/{save_filename}",
        "parameters": parsed["parameters"],
        "tabular_items": parsed["tabular_items"],
        "raw_text": parsed["raw_ocr_text"]
    }

@app.get("/api/lab/image/{image_id}")
def get_lab_image(image_id: str):
    """Serves lab images for the reviewer dashboard"""
    if image_id == "tc01":
        file_path = UPLOAD_DIR / "lab_slip_tc01_critical.png"
    elif image_id == "tc02":
        file_path = UPLOAD_DIR / "lab_slip_tc02_febrile.png"
    elif image_id == "tc03":
        file_path = UPLOAD_DIR / "lab_slip_tc03_routine.png"
    else:
        file_path = UPLOAD_DIR / image_id

    if not file_path.exists():
        # Re-generate synthetic if missing
        if "tc01" in image_id:
            LabSlipOCRService.generate_synthetic_lab_slip_image("TC-01", str(file_path))
        elif "tc02" in image_id:
            LabSlipOCRService.generate_synthetic_lab_slip_image("TC-02", str(file_path))
        elif "tc03" in image_id:
            LabSlipOCRService.generate_synthetic_lab_slip_image("TC-03", str(file_path))
        else:
            raise HTTPException(status_code=404, detail="Lab slip image not found")

    return FileResponse(str(file_path), media_type="image/png")

# -------------------------------------------------------------
# Patient Intake & Triage Submission
# -------------------------------------------------------------
@app.post("/api/intake")
async def submit_patient_intake(intake: PatientIntakeRequest, background_tasks: BackgroundTasks):
    """
    Complete Intake Pipeline:
    1. In-flight PII Masking (Aadhaar, Phone, Name)
    2. Chronological Timeline & Symptom Parsing
    3. Deterministic MCP Rule Engine for ESI Risk Calculation
    4. Diagnostic Blind Spot & Protocol Gap Identification
    5. Save into SQLite Transactional Live Queue
    6. Asynchronously stream anonymized telemetry to Google BigQuery
    """
    rec_id = f"TRIAGE-{uuid.uuid4().hex[:8].upper()}"

    # Step 1: PII Sanitization
    patient_dict = intake.dict()
    patient_dict["patient_id"] = intake.patient_id or rec_id
    sanitized = PIIAnonymizer.sanitize_patient_record(patient_dict)

    # Step 2: Language & Timeline normalization
    voice_res = IndicVoiceService.transcribe_audio_or_text(
        language=intake.vernacular_language,
        text_input=sanitized.get("symptoms_raw", "")
    )

    symptoms_list = voice_res.get("extracted_symptoms", [])
    timeline = voice_res.get("timeline", [])

    # Step 3: Deterministic ESI Triage via MCP Tool
    vitals_dict = intake.vitals.dict()
    esi_result = ClinicalMCPServer.compute_esi_triage(
        vitals=vitals_dict,
        red_flags=intake.red_flags,
        symptoms=symptoms_list,
        labs=intake.labs
    )

    # Step 4: Detect Missing Clinical Info & Doctor Prompts
    missing_info = ClinicalMCPServer.identify_missing_info(
        symptoms=symptoms_list,
        vitals_present=vitals_dict,
        labs_present=intake.labs
    )

    # Resolve facility details
    facility_info = next((f for f in FACILITIES if f["id"] == intake.facility_id), FACILITIES[0])

    triage_record = {
        "id": rec_id,
        "domain": "human",
        "test_case_id": intake.test_case_id,
        "display_pseudonym": sanitized.get("display_pseudonym"),
        "abha_id": f"91-{rec_id[7:11]}-{rec_id[11:15]}-9921",
        "facility_id": facility_info["id"],
        "facility": facility_info["name"],
        "district": facility_info["district"],
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "vernacular_language": intake.vernacular_language,
        "symptoms_raw": sanitized.get("symptoms_raw"),
        "translated_english": voice_res.get("translated_english"),
        "symptoms": symptoms_list,
        "timeline": timeline,
        "vitals": vitals_dict,
        "labs": intake.labs,
        "lab_analysis": esi_result.get("lab_analysis", {}),
        "esi_level": esi_result["esi_level"],
        "urgency_code": esi_result["urgency_code"],
        "classification": esi_result["classification"],
        "reasons": esi_result["reasons"],
        "flags": esi_result["flags"],
        "critical_actions": esi_result["critical_actions"],
        "missing_info": missing_info,
        "status": "PENDING_REVIEW",
        "pii_redactions": sanitized.get("pii_redaction_audit", []),
        "lab_image_path": intake.lab_image_path
    }

    # Step 5: Save in SQLite Transactional Database
    TriageDatabase.save_record(triage_record)

    # Step 6: Asynchronous Google BigQuery Telemetry Streaming
    background_tasks.add_task(BigQueryTelemetryService.stream_event_async, triage_record)

    return {
        "status": "RECORD_CREATED",
        "record_id": rec_id,
        "domain": "human",
        "esi_level": esi_result["esi_level"],
        "urgency_code": esi_result["urgency_code"],
        "display_pseudonym": triage_record["display_pseudonym"],
        "pii_redactions": triage_record["pii_redactions"],
        "advisory": REGULATORY_DISCLAIMER
    }

# -------------------------------------------------------------
# Reviewer Dashboard & Live Queue Operations
# -------------------------------------------------------------
@app.get("/api/queue")
def get_triage_queue(
    status: Optional[str] = "ALL", 
    district: Optional[str] = "ALL",
    domain: Optional[str] = "ALL"
):
    """
    Returns priority-sorted queue:
    Optionally filtered by domain ('ALL', 'human', 'veterinary'), status, and district.
    """
    records = TriageDatabase.get_queue(status_filter=status, district_filter=district, domain_filter=domain)
    return {
        "total_active": len(records),
        "records": records,
        "regulatory_disclaimer": REGULATORY_DISCLAIMER
    }

@app.get("/api/queue/{record_id}")
def get_patient_assessment_card(record_id: str):
    """Fetches full assessment card for doctor evaluation"""
    record = TriageDatabase.get_record_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Patient triage record not found")
    return record

@app.post("/api/queue/{record_id}/approve")
def approve_triage_summary(record_id: str, req: ApproveRequest):
    """Doctor single-action approval"""
    success = TriageDatabase.approve_record(record_id, req.doctor_name)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"status": "APPROVED", "record_id": record_id, "reviewer": req.doctor_name}

@app.post("/api/queue/{record_id}/override")
def override_esi_assessment(record_id: str, req: OverrideRequest):
    """
    Doctor override of ESI level with mandatory clinical justification audit log (PRD FR-3.3)
    """
    record = TriageDatabase.get_record_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if record.get("domain") == "veterinary":
        raise HTTPException(
            status_code=400,
            detail="Cannot apply human ESI level override to veterinary animal records. Use /api/veterinary/queue/{record_id}/override."
        )

    if req.new_esi < 1 or req.new_esi > 5:
        raise HTTPException(status_code=400, detail="ESI Level must be between 1 and 5")
    if not req.justification_reason.strip():
        raise HTTPException(status_code=400, detail="Mandatory justification reason is required for clinical audit log")

    success = TriageDatabase.override_esi(
        rec_id=record_id,
        new_esi=req.new_esi,
        reason=req.justification_reason,
        doctor_name=req.doctor_name
    )
    if not success:
        raise HTTPException(status_code=404, detail="Record not found")

    return {
        "status": "OVERRIDDEN",
        "record_id": record_id,
        "new_esi": req.new_esi,
        "audit_reason": req.justification_reason
    }

@app.get("/api/queue/{record_id}/referral/pdf")
def download_referral_pdf(record_id: str):
    """Generates and downloads ABDM / FHIR-compliant referral summary PDF (or Veterinary transfer note)"""
    record = TriageDatabase.get_record_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if record.get("domain") == "veterinary":
        pdf_path = VeterinaryReferralPDFGenerator.generate_referral_pdf(record)
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"Veterinary_Referral_{record_id}.pdf"
        )

    pdf_path = ABDMReferralPDFGenerator.generate_referral_pdf(record)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"ABDM_Referral_{record_id}.pdf"
    )

@app.get("/api/queue/{record_id}/fhir")
def export_fhir_bundle(record_id: str):
    """Exports ABDM HL7 FHIR Composition Bundle JSON"""
    record = TriageDatabase.get_record_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if record.get("domain") == "veterinary":
        raise HTTPException(
            status_code=400,
            detail="HL7 FHIR ABDM bundles apply exclusively to human patients. Veterinary records utilize DAH&VS veterinary referral transfer note."
        )

    bundle = ClinicalMCPServer.generate_abdm_fhir_bundle(record)
    return bundle

# -------------------------------------------------------------
# Surveillance & Enterprise Telemetry
# -------------------------------------------------------------
@app.get("/api/telemetry/stats")
def get_telemetry_surveillance():
    """Returns BigQuery syndromic surveillance telemetry and district heatmap"""
    return BigQueryTelemetryService.get_surveillance_telemetry()

@app.get("/api/audit/logs")
def get_clinical_audit_logs(domain: Optional[str] = "ALL"):
    """Returns immutable log of all clinical overrides (human ESI and veterinary VTI)"""
    return {
        "audit_logs": TriageDatabase.get_audit_logs(domain_filter=domain),
        "disclaimer": REGULATORY_DISCLAIMER
    }

# -------------------------------------------------------------
# Synthetic Scenarios & Reset for Live Hackathon Demonstration
# -------------------------------------------------------------
@app.post("/api/synthetic/load")
def reload_synthetic_scenarios():
    """Resets database and loads pristine PRD test vectors (TC-01..03, VET-TC-01..04)"""
    seed_synthetic_scenarios()
    return {
        "status": "RESET_SUCCESSFUL", 
        "scenarios_loaded": ["TC-01", "TC-02", "TC-03", "VET-TC-01", "VET-TC-02", "VET-TC-03", "VET-TC-04"]
    }

@app.post("/api/queue/clear")
def clear_all_queue_records():
    """
    Clears all queue records so that only real, live cases entered by human health workers
    and veterinary officers are present in the clinical queue.
    """
    init_db()
    with TriageDatabase.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM triage_queue")
        cursor.execute("DELETE FROM override_audit_log")
        conn.commit()
    return {
        "status": "QUEUE_CLEARED",
        "message": "All clinical records cleared. Ready for live human-operated triage intake."
    }

