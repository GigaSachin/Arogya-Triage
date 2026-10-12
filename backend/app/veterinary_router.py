"""
Veterinary API Gateway Router for AROGYA-TRIAGE
Endpoints for Veterinary Triage, Config, Health, Case Queue, and PDF Referrals.
Strictly isolated from human ESI calculations and FHIR human bundles.
"""
import uuid
import datetime
import re
from typing import Dict, Any, Optional, List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, Depends
# pyrefly: ignore [missing-import]
from fastapi.responses import FileResponse
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

from .config import FACILITIES, PDF_DIR
from .veterinary_rules import (
    VeterinaryRuleEngine, VETERINARY_DISCLAIMER, 
    SUPPORTED_SPECIES, BETA_SPECIES, SPECIES_REFERENCE_INTERVALS
)
from .veterinary_pdf import VeterinaryReferralPDFGenerator
from .db import TriageDatabase

router = APIRouter(prefix="/api/veterinary", tags=["Veterinary Triage"])

# -------------------------------------------------------------
# Request & Response Models
# -------------------------------------------------------------
class VeterinaryVitalsInput(BaseModel):
    temperature: Optional[float] = Field(None, description="Rectal temperature in Fahrenheit")
    heart_rate: Optional[float] = Field(None, description="Heart / pulse rate in beats per minute")
    respiration_rate: Optional[float] = Field(None, description="Respiration rate in breaths per minute")
    mucous_membrane_color: Optional[str] = Field(None, description="Color: pink, pale, white, cyanotic, brick red, icteric")
    crt_sec: Optional[float] = Field(None, description="Capillary Refill Time in seconds")
    hydration_status: Optional[str] = Field(None, description="Normal, mild dehydration, severe skin tenting")

class VeterinaryIntakeRequest(BaseModel):
    species: str = Field(..., description="Species: 'cattle', 'dog', etc.")
    breed: Optional[str] = Field(None, description="Breed if known")
    age_category: Optional[str] = Field(None, description="e.g. Calf, Puppy, Adult, Senior")
    animal_tag_or_name: Optional[str] = Field(None, description="Ear tag number, pet name, or description")
    symptoms_raw: str = Field(..., min_length=2, description="Vernacular or typed description of clinical symptoms")
    duration_text: Optional[str] = Field(None, description="e.g. 6 hours, 2 days")
    history: Optional[str] = Field(None, description="Vaccination, diet change, deworming, recent calving, etc.")
    vitals: Optional[VeterinaryVitalsInput] = Field(default_factory=VeterinaryVitalsInput)
    red_flags: List[str] = Field(default_factory=list, description="Checked emergency signs")
    owner_phone: Optional[str] = Field(None, description="Contact for owner or livestock keeper")
    facility_id: str = "FAC-ROU-01"
    test_case_id: Optional[str] = None

class VeterinaryOverrideRequest(BaseModel):
    new_urgency: str = Field(..., description="CRITICAL, EMERGENT, URGENT, ROUTINE")
    justification_reason: str = Field(..., min_length=5, description="Clinical justification for override")
    doctor_name: str = "Dr. A. K. Nayak, Veterinary Officer"

class VeterinaryApproveRequest(BaseModel):
    doctor_name: str = "Dr. A. K. Nayak, Veterinary Officer"

# -------------------------------------------------------------
# Health & Configuration Endpoints
# -------------------------------------------------------------
@router.get("/health")
def veterinary_health():
    """Health check for the veterinary triage engine and rule layers"""
    return {
        "status": "HEALTHY",
        "service": "AROGYA-TRIAGE Veterinary Decision Support",
        "domain": "veterinary",
        "supported_species": SUPPORTED_SPECIES,
        "beta_species": BETA_SPECIES,
        "disclaimer": VETERINARY_DISCLAIMER,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

@router.get("/config")
def veterinary_config():
    """Returns species physiological reference intervals and configuration"""
    return {
        "supported_species": SUPPORTED_SPECIES,
        "beta_species": BETA_SPECIES,
        "reference_intervals": SPECIES_REFERENCE_INTERVALS,
        "disclaimer": VETERINARY_DISCLAIMER,
        "regional_veterinary_centers": [
            {"id": "VET-ROU-01", "name": "Govt Veterinary Hospital Panposh, Rourkela", "district": "Sundargarh (Rourkela)"},
            {"id": "VET-ROU-02", "name": "Block Veterinary Dispensary Bisra", "district": "Sundargarh (Rourkela)"},
            {"id": "VET-BBSR-01", "name": "Central Veterinary Clinic & Polyclinic, Saheed Nagar, Bhubaneswar", "district": "Khordha (Bhubaneswar)"},
            {"id": "VET-CTC-01", "name": "District Veterinary Polyclinic, Cuttack", "district": "Cuttack"}
        ]
    }

# -------------------------------------------------------------
# Veterinary Intake & Triage Submission
# -------------------------------------------------------------
@router.post("/triage")
def submit_veterinary_triage(intake: VeterinaryIntakeRequest):
    """
    Submits animal case for deterministic veterinary triage evaluation.
    1. Validates species and symptoms
    2. Masks owner contact information
    3. Runs VeterinaryRuleEngine (species-specific checks)
    4. Detects missing diagnostic gaps and uncertainty
    5. Persists case in transactional SQLite database with domain = 'veterinary'
    """
    # Validate symptom text
    clean_symptoms = intake.symptoms_raw.strip()
    if not clean_symptoms:
        raise HTTPException(status_code=400, detail="Symptom description is required for veterinary evaluation")

    rec_id = f"VET-{uuid.uuid4().hex[:8].upper()}"

    # Mask owner phone number if provided (privacy preservation)
    masked_phone = None
    if intake.owner_phone:
        cleaned_phone = re.sub(r'[\s\-\(\)]', '', intake.owner_phone)
        if len(cleaned_phone) >= 10:
            masked_phone = f"+91-XXXXX-{cleaned_phone[-4:]}"
        else:
            masked_phone = "XXXX-XXXX"

    vitals_dict = intake.vitals.dict() if intake.vitals else {}

    # Run deterministic veterinary rule engine
    triage_result = VeterinaryRuleEngine.evaluate_triage(
        species=intake.species,
        symptoms_raw=clean_symptoms,
        vitals=vitals_dict,
        duration_text=intake.duration_text,
        red_flags=intake.red_flags,
        age_category=intake.age_category,
        history=intake.history
    )

    # Format animal label
    species_tag = (intake.species or "animal").upper()
    animal_display = intake.animal_tag_or_name or f"{species_tag}-{rec_id[-4:]}"

    facility_info = next((f for f in FACILITIES if f["id"] == intake.facility_id), FACILITIES[0])

    # Build persistent case record
    record = {
        "id": rec_id,
        "test_case_id": intake.test_case_id,
        "domain": "veterinary",
        "species": intake.species.lower(),
        "breed": intake.breed,
        "age_category": intake.age_category,
        "animal_tag_or_name": animal_display,
        "display_pseudonym": animal_display,
        "owner_contact_masked": masked_phone,
        "facility_id": facility_info["id"],
        "facility": facility_info["name"],
        "district": facility_info["district"],
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "vernacular_language": "english",
        "symptoms_raw": clean_symptoms,
        "translated_english": clean_symptoms,
        "symptoms": [s.strip() for s in clean_symptoms.split(",") if len(s.strip()) > 2] or [clean_symptoms],
        "timeline": [f"Duration reported: {intake.duration_text}"] if intake.duration_text else ["Acute presentation"],
        "vitals": vitals_dict,
        "labs": {},
        "lab_analysis": {},
        "esi_level": None,  # NEVER apply human ESI level
        "urgency_code": triage_result["urgency_code"],
        "urgency_category": triage_result["urgency_category"],
        "classification": triage_result["classification"],
        "reasons": triage_result["reasons"],
        "flags": triage_result["flags"],
        "critical_actions": triage_result["critical_actions"],
        "missing_info": triage_result["missing_info"],
        "is_uncertain": triage_result["is_uncertain"],
        "status": "PENDING_REVIEW",
        "pii_redactions": [{"type": "PHONE_NUMBER", "masked": masked_phone}] if masked_phone else [],
        "veterinary_guidance": {
            "disclaimer": triage_result["disclaimer"],
            "species_evaluated": triage_result.get("species", intake.species)
        }
    }

    # Persist in SQLite
    TriageDatabase.save_record(record)

    return {
        "status": "RECORD_CREATED",
        "record_id": rec_id,
        "domain": "veterinary",
        "species": intake.species.lower(),
        "animal_tag_or_name": animal_display,
        "urgency_category": triage_result["urgency_category"],
        "urgency_code": triage_result["urgency_code"],
        "classification": triage_result["classification"],
        "reasons": triage_result["reasons"],
        "flags": triage_result["flags"],
        "critical_actions": triage_result["critical_actions"],
        "missing_info": triage_result["missing_info"],
        "is_uncertain": triage_result["is_uncertain"],
        "disclaimer": triage_result["disclaimer"]
    }

# -------------------------------------------------------------
# Veterinary Queue & Reviewer Endpoints
# -------------------------------------------------------------
@router.get("/queue")
def get_veterinary_queue(status: Optional[str] = "ALL", district: Optional[str] = "ALL"):
    """Returns priority-ordered queue of veterinary cases (domain = veterinary)"""
    records = TriageDatabase.get_queue(status_filter=status, district_filter=district, domain_filter="veterinary")
    return {
        "total_active": len(records),
        "records": records,
        "domain": "veterinary",
        "disclaimer": VETERINARY_DISCLAIMER
    }

@router.get("/queue/{record_id}")
def get_veterinary_case(record_id: str):
    """Fetches full assessment card for veterinary case"""
    record = TriageDatabase.get_record_by_id(record_id)
    if not record or record.get("domain") != "veterinary":
        raise HTTPException(status_code=404, detail="Veterinary case record not found")
    return record

@router.post("/queue/{record_id}/approve")
def approve_veterinary_case(record_id: str, req: VeterinaryApproveRequest):
    """Veterinary officer single-action approval"""
    record = TriageDatabase.get_record_by_id(record_id)
    if not record or record.get("domain") != "veterinary":
        raise HTTPException(status_code=404, detail="Veterinary case record not found")

    success = TriageDatabase.approve_record(record_id, req.doctor_name)
    if not success:
        raise HTTPException(status_code=404, detail="Failed to approve record")
    return {"status": "APPROVED", "record_id": record_id, "reviewer": req.doctor_name}

@router.post("/queue/{record_id}/override")
def override_veterinary_case(record_id: str, req: VeterinaryOverrideRequest):
    """Veterinary officer override of urgency category with mandatory audit justification"""
    valid_urgencies = ["CRITICAL", "EMERGENT", "URGENT", "ROUTINE"]
    if req.new_urgency.upper() not in valid_urgencies:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid urgency category. Must be one of: {', '.join(valid_urgencies)}"
        )
    if not req.justification_reason.strip():
        raise HTTPException(status_code=400, detail="Mandatory clinical justification reason is required")

    record = TriageDatabase.get_record_by_id(record_id)
    if not record or record.get("domain") != "veterinary":
        raise HTTPException(status_code=404, detail="Veterinary case record not found")

    success = TriageDatabase.override_veterinary_urgency(
        rec_id=record_id,
        new_urgency=req.new_urgency.upper(),
        reason=req.justification_reason,
        reviewer_name=req.doctor_name
    )
    if not success:
        raise HTTPException(status_code=404, detail="Failed to override record")

    return {
        "status": "OVERRIDDEN",
        "record_id": record_id,
        "new_urgency": req.new_urgency.upper(),
        "audit_reason": req.justification_reason
    }

@router.get("/queue/{record_id}/referral/pdf")
def download_veterinary_referral_pdf(record_id: str):
    """Generates and downloads Veterinary Clinical Referral Transfer Note PDF"""
    record = TriageDatabase.get_record_by_id(record_id)
    if not record or record.get("domain") != "veterinary":
        raise HTTPException(status_code=404, detail="Veterinary case record not found")

    pdf_path = VeterinaryReferralPDFGenerator.generate_referral_pdf(record)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"Veterinary_Referral_{record_id}.pdf"
    )
