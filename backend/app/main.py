"""
AROGYA-TRIAGE: Main Gateway & Orchestration Engine (FastAPI)
Enterprise MCP-Powered Human-in-the-Loop Clinical Triage Engine
Lead Developer: Sachin | Sponsored by Cognizant | BPUT Hackathon 2026
"""
import uuid
import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

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

# Initialize Database and Seed Benchmark Scenarios at startup
@app.on_event("startup")
def on_startup():
    init_db()
    seed_synthetic_scenarios()
    print("AROGYA-TRIAGE Engine initialized with synthetic clinical test vectors.")

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

class MCPExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]

# -------------------------------------------------------------
# System & Configuration Endpoints
# -------------------------------------------------------------
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
def get_triage_queue(status: Optional[str] = "ALL", district: Optional[str] = "ALL"):
    """
    Returns priority-sorted queue:
    Red (ESI 1 & 2) at top, Yellow (ESI 3) in middle, Green (ESI 4 & 5) at bottom.
    """
    records = TriageDatabase.get_queue(status_filter=status, district_filter=district)
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
    """Generates and downloads ABDM / FHIR-compliant referral summary PDF"""
    record = TriageDatabase.get_record_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

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
def get_clinical_audit_logs():
    """Returns immutable log of all doctor ESI overrides"""
    return {
        "audit_logs": TriageDatabase.get_audit_logs(),
        "disclaimer": REGULATORY_DISCLAIMER
    }

# -------------------------------------------------------------
# Synthetic Scenarios & Reset for Live Hackathon Demonstration
# -------------------------------------------------------------
@app.post("/api/synthetic/load")
def reload_synthetic_scenarios():
    """Resets database and loads pristine PRD test vectors (TC-01, TC-02, TC-03)"""
    seed_synthetic_scenarios()
    return {"status": "RESET_SUCCESSFUL", "scenarios_loaded": ["TC-01", "TC-02", "TC-03"]}
