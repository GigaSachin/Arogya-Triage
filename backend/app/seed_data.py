"""
Synthetic Clinical Test Vectors & Seed Data Initializer
Populates verified synthetic test cases adhering to BPUT Hackathon 2026 PRD Section 6:
- TC-01 (Red: Critical Sepsis / Thrombocytopenia)
- TC-02 (Yellow: Febrile Illness / Dehydration)
- TC-03 (Green: Routine OPD / Dressing)
Plus realistic synthetic paper lab slips.
"""
from pathlib import Path
from typing import Dict, Any, List
from .config import UPLOAD_DIR
from .ocr_service import LabSlipOCRService
from .mcp_server import ClinicalMCPServer
from .db import TriageDatabase, init_db

def seed_synthetic_scenarios():
    """Seeds the database with benchmark test cases and creates synthetic lab images"""
    init_db()

    # Generate synthetic paper lab slip images
    slip1_path = str(UPLOAD_DIR / "lab_slip_tc01_critical.png")
    slip2_path = str(UPLOAD_DIR / "lab_slip_tc02_febrile.png")
    slip3_path = str(UPLOAD_DIR / "lab_slip_tc03_routine.png")

    try:
        LabSlipOCRService.generate_synthetic_lab_slip_image("TC-01", slip1_path)
        LabSlipOCRService.generate_synthetic_lab_slip_image("TC-02", slip2_path)
        LabSlipOCRService.generate_synthetic_lab_slip_image("TC-03", slip3_path)
    except Exception as e:
        print(f"Notice: Image generation error (using text fallback): {e}")

    # TC-01: Critical Sepsis / Thrombocytopenia (RED - ESI 2)
    tc01_vitals = {"spo2": 89, "pulse": 128, "systolic_bp": 88, "diastolic_bp": 58, "temperature": 103.4, "respiration_rate": 26}
    tc01_labs = {"platelets": 16000, "hemoglobin": 11.4, "wbc": 14200, "dengue_ns1": "POSITIVE"}
    tc01_symptoms = ["Severe fever", "Acute confusion / altered sensorium", "Gum bleeding (mucosal hemorrhage)"]
    tc01_red_flags = ["Critical Hypoxemia", "Severe Tachycardia", "Active Gum Bleeding", "Altered Sensorium"]

    tc01_esi = ClinicalMCPServer.compute_esi_triage(
        vitals=tc01_vitals,
        red_flags=tc01_red_flags,
        symptoms=tc01_symptoms,
        labs=tc01_labs
    )
    tc01_missing = ClinicalMCPServer.identify_missing_info(tc01_symptoms, tc01_vitals, tc01_labs)

    tc01_record = {
        "id": "TC-01-RED-SEPSIS",
        "test_case_id": "TC-01",
        "display_pseudonym": "Patient-OD-001 (Synthetic)",
        "abha_id": "91-4421-9902-8812",
        "facility_id": "FAC-ROU-01",
        "facility": "Community Health Center (CHC) Panposh, Rourkela",
        "district": "Sundargarh (Rourkela)",
        "vernacular_language": "odia",
        "symptoms_raw": "ଅତ୍ୟଧିକ ଜ୍ୱର, ମୁଣ୍ଡ ଘୂରାଉଛି, ମାଢ଼ିରୁ ରକ୍ତ ପଡୁଛି (Severe fever, confusion, gum bleeding)",
        "translated_english": "Severe fever, confusion, and spontaneous gum bleeding since 3 days.",
        "symptoms": tc01_symptoms,
        "timeline": [
            "Day 1: Acute fever with rigors reported by family",
            "Day 2: Worsening lethargy and poor oral intake",
            "Day 3: Disorientation, confusion, and active mucosal bleeding from gingiva"
        ],
        "vitals": tc01_vitals,
        "labs": tc01_labs,
        "lab_analysis": tc01_esi["lab_analysis"],
        "esi_level": tc01_esi["esi_level"],
        "urgency_code": tc01_esi["urgency_code"],
        "classification": tc01_esi["classification"],
        "reasons": tc01_esi["reasons"],
        "flags": tc01_esi["flags"],
        "critical_actions": tc01_esi["critical_actions"] + [
            "Prepare for immediate Platelet Concentrate (RDP/SDP) transfusion",
            "Alert Senior Medical Officer on casualty duty"
        ],
        "missing_info": tc01_missing,
        "status": "PENDING_REVIEW",
        "pii_redactions": [{"type": "AADHAAR", "original_snippet": "***9821"}, {"type": "PHONE", "original_snippet": "***4210"}],
        "lab_image_path": "/api/lab/image/tc01"
    }

    # TC-02: Febrile Illness / Dehydration (YELLOW - ESI 3)
    tc02_vitals = {"spo2": 97, "pulse": 98, "systolic_bp": 100, "diastolic_bp": 65, "temperature": 102.8, "respiration_rate": 20}
    tc02_labs = {"platelets": 115000, "hemoglobin": 13.1, "wbc": 6400, "serum_creatinine": 0.9, "dengue_ns1": "POSITIVE"}
    tc02_symptoms = ["3 days high fever", "Persistent diarrhea", "Frequent vomiting"]
    tc02_red_flags = []

    tc02_esi = ClinicalMCPServer.compute_esi_triage(
        vitals=tc02_vitals,
        red_flags=tc02_red_flags,
        symptoms=tc02_symptoms,
        labs=tc02_labs
    )
    tc02_missing = ClinicalMCPServer.identify_missing_info(tc02_symptoms, tc02_vitals, tc02_labs)

    tc02_record = {
        "id": "TC-02-YELLOW-FEBRILE",
        "test_case_id": "TC-02",
        "display_pseudonym": "Patient-HI-002 (Synthetic)",
        "abha_id": "91-8832-1109-3341",
        "facility_id": "FAC-CAMP-01",
        "facility": "BPUT Campus Health & Wellness Center",
        "district": "Sundargarh (Rourkela)",
        "vernacular_language": "hindi",
        "symptoms_raw": "३ दिन से तेज़ बुखार, लगातार दस्त और उल्टी (3 days high fever, persistent diarrhea, vomiting)",
        "translated_english": "3 days of high-grade fever, persistent watery diarrhea, and repeated vomiting.",
        "symptoms": tc02_symptoms,
        "timeline": [
            "Day 1: Chills followed by sudden temperature spike",
            "Day 2: Onset of loose stools and nausea",
            "Day 3: Persistent non-bilious vomiting; unable to retain oral fluids"
        ],
        "vitals": tc02_vitals,
        "labs": tc02_labs,
        "lab_analysis": tc02_esi["lab_analysis"],
        "esi_level": tc02_esi["esi_level"],
        "urgency_code": tc02_esi["urgency_code"],
        "classification": tc02_esi["classification"],
        "reasons": tc02_esi["reasons"],
        "flags": tc02_esi["flags"],
        "critical_actions": tc02_esi["critical_actions"] + [
            "Display Doctor Prompt: Check urine output timing, evaluate skin turgor",
            "Request Dengue NS1 & Malaria smear confirmation"
        ],
        "missing_info": tc02_missing,
        "status": "PENDING_REVIEW",
        "pii_redactions": [{"type": "PHONE", "original_snippet": "***1944"}],
        "lab_image_path": "/api/lab/image/tc02"
    }

    # TC-03: Routine OPD / Dressing (GREEN - ESI 5)
    tc03_vitals = {"spo2": 99, "pulse": 74, "systolic_bp": 118, "diastolic_bp": 78, "temperature": 98.4, "respiration_rate": 16}
    tc03_labs = {"fasting_blood_sugar": 92, "platelets": 280000, "hemoglobin": 14.2, "wbc": 7200}
    tc03_symptoms = ["Superficial forearm abrasion", "Dressing change required", "Afebrile"]
    tc03_red_flags = []

    tc03_esi = ClinicalMCPServer.compute_esi_triage(
        vitals=tc03_vitals,
        red_flags=tc03_red_flags,
        symptoms=tc03_symptoms,
        labs=tc03_labs
    )
    tc03_missing = ClinicalMCPServer.identify_missing_info(tc03_symptoms, tc03_vitals, tc03_labs)

    tc03_record = {
        "id": "TC-03-GREEN-ROUTINE",
        "test_case_id": "TC-03",
        "display_pseudonym": "Patient-EN-003 (Synthetic)",
        "abha_id": "91-6677-2211-9088",
        "facility_id": "FAC-BBSR-01",
        "facility": "Primary Health Center (PHC) Chandrasekharpur",
        "district": "Khordha (Bhubaneswar)",
        "vernacular_language": "english",
        "symptoms_raw": "Superficial forearm abrasion dressing change; no fever.",
        "translated_english": "Patient walked in for clean wound dressing on right forearm after superficial skid. Stable vitals.",
        "symptoms": tc03_symptoms,
        "timeline": [
            "Yesterday: Minor domestic scrape on forearm; washed with soap and water",
            "Today: Walk-in for antiseptic dressing and healing check"
        ],
        "vitals": tc03_vitals,
        "labs": tc03_labs,
        "lab_analysis": tc03_esi["lab_analysis"],
        "esi_level": tc03_esi["esi_level"],
        "urgency_code": tc03_esi["urgency_code"],
        "classification": tc03_esi["classification"],
        "reasons": tc03_esi["reasons"],
        "flags": tc03_esi["flags"],
        "critical_actions": [
            "Standard OPD queue placement",
            "Perform sterile saline dressing and examine granulation tissue",
            "Automated Tetanus Toxoid vaccination history verification query"
        ],
        "missing_info": tc03_missing,
        "status": "PENDING_REVIEW",
        "pii_redactions": [],
        "lab_image_path": "/api/lab/image/tc03"
    }

    # Save to SQLite
    TriageDatabase.save_record(tc01_record)
    TriageDatabase.save_record(tc02_record)
    TriageDatabase.save_record(tc03_record)

    return [tc01_record, tc02_record, tc03_record]
