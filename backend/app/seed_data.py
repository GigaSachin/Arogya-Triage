"""
Synthetic Clinical Test Vectors & Seed Data Initializer
Populates verified synthetic test cases adhering to BPUT Hackathon 2026 PRD Section 6:
- TC-01 (Red: Critical Sepsis / Thrombocytopenia)
- TC-02 (Yellow: Febrile Illness / Dehydration)
- TC-03 (Green: Routine OPD / Dressing)
Plus verified synthetic veterinary test cases:
- VET-TC-01 (Cattle: Acute Ruminal Bloat & Dyspnea - CRITICAL)
- VET-TC-02 (Dog: Hemorrhagic Gastroenteritis / Parvo Suspect - EMERGENT)
- VET-TC-03 (Dog: Routine Annual Vaccination & Mild Scratch - ROUTINE)
- VET-TC-04 (Goat: Beta Species Weakness - UNCERTAIN)
"""
from pathlib import Path
from typing import Dict, Any, List
from .config import UPLOAD_DIR
from .ocr_service import LabSlipOCRService
from .mcp_server import ClinicalMCPServer
from .veterinary_rules import VeterinaryRuleEngine, VETERINARY_DISCLAIMER
from .db import TriageDatabase, init_db

def seed_synthetic_scenarios():
    """Seeds the database with benchmark human and veterinary test cases"""
    init_db()

    # Generate synthetic paper lab slip images for human scenarios
    slip1_path = str(UPLOAD_DIR / "lab_slip_tc01_critical.png")
    slip2_path = str(UPLOAD_DIR / "lab_slip_tc02_febrile.png")
    slip3_path = str(UPLOAD_DIR / "lab_slip_tc03_routine.png")

    try:
        LabSlipOCRService.generate_synthetic_lab_slip_image("TC-01", slip1_path)
        LabSlipOCRService.generate_synthetic_lab_slip_image("TC-02", slip2_path)
        LabSlipOCRService.generate_synthetic_lab_slip_image("TC-03", slip3_path)
    except Exception as e:
        print(f"Notice: Image generation error (using text fallback): {e}")

    # =========================================================
    # HUMAN BENCHMARK SCENARIOS (PS03 Core)
    # =========================================================
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
        "domain": "human",
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
        "critical_actions": [
            "Immediate Red-Priority Queue sorting & visual beacon alert",
            "Immediate IV access and Platelet Concentrate transfusion evaluation",
            "Transfer to high-dependency triage ward (IGH Rourkela)"
        ],
        "missing_info": tc01_missing,
        "status": "PENDING_REVIEW",
        "pii_redactions": [{"type": "AADHAAR_MEMBER", "masked": "XXXX-XXXX-9902"}],
        "lab_image_path": "/api/lab/image/tc01"
    }

    # TC-02: Febrile Illness / Dehydration (YELLOW - ESI 3)
    tc02_vitals = {"spo2": 97, "pulse": 98, "systolic_bp": 100, "diastolic_bp": 65, "temperature": 102.8, "respiration_rate": 18}
    tc02_labs = {"platelets": 115000, "hemoglobin": 13.2, "wbc": 6800, "dengue_ns1": "POSITIVE"}
    tc02_symptoms = ["High grade fever", "Persistent watery diarrhea", "Nausea and repeated vomiting"]

    tc02_esi = ClinicalMCPServer.compute_esi_triage(
        vitals=tc02_vitals,
        symptoms=tc02_symptoms,
        labs=tc02_labs
    )
    tc02_missing = ClinicalMCPServer.identify_missing_info(tc02_symptoms, tc02_vitals, tc02_labs)

    tc02_record = {
        "id": "TC-02-YELLOW-FEBRILE",
        "domain": "human",
        "test_case_id": "TC-02",
        "display_pseudonym": "Patient-OD-002 (Synthetic)",
        "abha_id": "91-1188-3490-5521",
        "facility_id": "FAC-ROU-02",
        "facility": "Ispat General Hospital (IGH) Casualty, Rourkela",
        "district": "Sundargarh (Rourkela)",
        "vernacular_language": "hindi",
        "symptoms_raw": "३ दिन से तेज़ बुखार, लगातार दस्त और उल्टी (3 days high fever, persistent diarrhea, vomiting)",
        "translated_english": "High-grade continuous fever for 3 days with frequent watery loose stools and vomiting.",
        "symptoms": tc02_symptoms,
        "timeline": [
            "Day 1: Chills, mild temperature elevation, body ache",
            "Day 2: Sudden onset watery diarrhea 5 times, anorexia",
            "Day 3: Progressive vomiting and lethargy"
        ],
        "vitals": tc02_vitals,
        "labs": tc02_labs,
        "lab_analysis": tc02_esi["lab_analysis"],
        "esi_level": tc02_esi["esi_level"],
        "urgency_code": tc02_esi["urgency_code"],
        "classification": tc02_esi["classification"],
        "reasons": tc02_esi["reasons"],
        "flags": tc02_esi["flags"],
        "critical_actions": [
            "Initiate immediate Oral Rehydration Salts (ORS) and IV fluid balance evaluation",
            "Evaluate skin turgor and urine output duration",
            "Confirmatory Dengue serology / Malaria smear confirmation"
        ],
        "missing_info": tc02_missing,
        "status": "PENDING_REVIEW",
        "pii_redactions": [],
        "lab_image_path": "/api/lab/image/tc02"
    }

    # TC-03: Routine OPD / Dressing (GREEN - ESI 5)
    tc03_vitals = {"spo2": 99, "pulse": 74, "systolic_bp": 118, "diastolic_bp": 78, "temperature": 98.4, "respiration_rate": 16}
    tc03_labs = {"platelets": 280000, "hemoglobin": 14.1, "glucose_fasting": 92}
    tc03_symptoms = ["Superficial forearm abrasion dressing change", "No fever", "Clean healing edge"]

    tc03_esi = ClinicalMCPServer.compute_esi_triage(
        vitals=tc03_vitals,
        symptoms=tc03_symptoms,
        labs=tc03_labs
    )
    tc03_missing = ClinicalMCPServer.identify_missing_info(tc03_symptoms, tc03_vitals, tc03_labs)

    tc03_record = {
        "id": "TC-03-GREEN-OPD",
        "domain": "human",
        "test_case_id": "TC-03",
        "display_pseudonym": "Patient-OD-003 (Synthetic)",
        "abha_id": "91-7712-4091-2209",
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

    # =========================================================
    # VETERINARY BENCHMARK SCENARIOS
    # =========================================================
    # VET-TC-01: Cattle Acute Ruminal Bloat & Dyspnea (CRITICAL - Code RED)
    vet01_vitals = {"temperature": 102.0, "heart_rate": 96.0, "respiration_rate": 52.0, "mucous_membrane_color": "cyanotic", "crt_sec": 2.8}
    vet01_symptoms = "Acute severe left flank swelling (bloat) after grazing lush wet fodder; struggling to breathe, open mouth breathing, grunting"
    vet01_res = VeterinaryRuleEngine.evaluate_triage(
        species="cattle",
        symptoms_raw=vet01_symptoms,
        vitals=vet01_vitals,
        duration_text="3 hours",
        history="Fed green leguminous clover this morning. Stopped cud chewing.",
        age_category="Adult (4 years)"
    )

    vet01_record = {
        "id": "VET-TC-01-CRITICAL-BLOAT",
        "domain": "veterinary",
        "test_case_id": "VET-TC-01",
        "species": "cattle",
        "breed": "Red Sindhi Cross",
        "age_category": "Adult (4 years)",
        "animal_tag_or_name": "Bovine Cow #OD-4412",
        "display_pseudonym": "Bovine Cow #OD-4412",
        "owner_contact_masked": "+91-XXXXX-7712",
        "facility_id": "FAC-ROU-01",
        "facility": "Govt Veterinary Hospital Panposh, Rourkela",
        "district": "Sundargarh (Rourkela)",
        "vernacular_language": "odia",
        "symptoms_raw": "ଗାଈର ବାମ ପେଟ ଫୁଲିଯାଇଛି, ଶ୍ୱାସକଷ୍ଟ ହେଉଛି, ପାଟି ଖୋଲି ନିଶ୍ୱାସ ନେଉଛି (Acute severe left flank swelling / bloat and dyspnea)",
        "translated_english": "Severe ruminal distension (bloat) on left flank with labored open-mouth breathing after wet clover grazing.",
        "symptoms": ["Acute ruminal bloat (left flank distension)", "Severe open mouth dyspnea", "Cyanotic mucous membranes"],
        "timeline": [
            "07:00 AM: Grazed on lush legume pasture",
            "09:30 AM: Severe left paralumbar fossa distension noted",
            "10:00 AM: Recumbency and respiratory distress developed"
        ],
        "vitals": vet01_vitals,
        "labs": {},
        "lab_analysis": {},
        "esi_level": None,  # NEVER ESI for animals
        "urgency_code": vet01_res["urgency_code"],
        "urgency_category": vet01_res["urgency_category"],
        "classification": vet01_res["classification"],
        "reasons": vet01_res["reasons"],
        "flags": vet01_res["flags"],
        "critical_actions": vet01_res["critical_actions"],
        "missing_info": vet01_res["missing_info"],
        "is_uncertain": False,
        "status": "PENDING_REVIEW",
        "pii_redactions": [{"type": "PHONE", "masked": "+91-XXXXX-7712"}],
        "veterinary_guidance": {"species": "cattle", "disclaimer": VETERINARY_DISCLAIMER}
    }

    # VET-TC-02: Canine Acute Hemorrhagic Gastroenteritis / Parvo Suspect (EMERGENT - Code RED)
    vet02_vitals = {"temperature": 103.8, "heart_rate": 152.0, "respiration_rate": 30.0, "mucous_membrane_color": "pale", "crt_sec": 2.5}
    vet02_symptoms = "4-month puppy presenting with foul-smelling bloody diarrhea, persistent vomiting for 24h, severe lethargy, un-vaccinated"
    vet02_res = VeterinaryRuleEngine.evaluate_triage(
        species="dog",
        symptoms_raw=vet02_symptoms,
        vitals=vet02_vitals,
        duration_text="24 hours",
        history="Unvaccinated stray rescue, adopted 2 weeks ago.",
        age_category="Puppy (4 months)"
    )

    vet02_record = {
        "id": "VET-TC-02-EMERGENT-PARVO",
        "domain": "veterinary",
        "test_case_id": "VET-TC-02",
        "species": "dog",
        "breed": "Indie Hound Mix",
        "age_category": "Puppy (4 months)",
        "animal_tag_or_name": "Puppy 'Bruno'",
        "display_pseudonym": "Puppy 'Bruno'",
        "owner_contact_masked": "+91-XXXXX-9821",
        "facility_id": "FAC-ROU-01",
        "facility": "Govt Veterinary Hospital Panposh, Rourkela",
        "district": "Sundargarh (Rourkela)",
        "vernacular_language": "english",
        "symptoms_raw": "Severe foul-smelling bloody diarrhea, persistent vomiting for 24 hours, extreme lethargy, won't drink water.",
        "translated_english": "Severe foul-smelling bloody diarrhea, persistent vomiting for 24 hours, extreme lethargy, won't drink water.",
        "symptoms": ["Hemorrhagic diarrhea", "Persistent vomiting", "Severe lethargy / depression", "High pyrexia"],
        "timeline": [
            "Yesterday evening: Lethargy and refusal of evening meal",
            "Overnight: Repeated bile vomiting",
            "This morning: Multiple foul-smelling bloody stools"
        ],
        "vitals": vet02_vitals,
        "labs": {},
        "lab_analysis": {},
        "esi_level": None,
        "urgency_code": vet02_res["urgency_code"],
        "urgency_category": vet02_res["urgency_category"],
        "classification": vet02_res["classification"],
        "reasons": vet02_res["reasons"],
        "flags": vet02_res["flags"],
        "critical_actions": vet02_res["critical_actions"],
        "missing_info": vet02_res["missing_info"],
        "is_uncertain": False,
        "status": "PENDING_REVIEW",
        "pii_redactions": [{"type": "PHONE", "masked": "+91-XXXXX-9821"}],
        "veterinary_guidance": {"species": "dog", "disclaimer": VETERINARY_DISCLAIMER}
    }

    # VET-TC-03: Canine Routine OPD / Annual Check (ROUTINE - Code GREEN)
    vet03_vitals = {"temperature": 101.5, "heart_rate": 84.0, "respiration_rate": 18.0, "mucous_membrane_color": "pink", "crt_sec": 1.2}
    vet03_symptoms = "Routine annual Rabies booster check-up and minor ear pinna scratch; healthy appetite and normal activity"
    vet03_res = VeterinaryRuleEngine.evaluate_triage(
        species="dog",
        symptoms_raw=vet03_symptoms,
        vitals=vet03_vitals,
        duration_text="1 day",
        history="Fully vaccinated up to date, regular deworming.",
        age_category="Adult (2 years)"
    )

    vet03_record = {
        "id": "VET-TC-03-ROUTINE-OPD",
        "domain": "veterinary",
        "test_case_id": "VET-TC-03",
        "species": "dog",
        "breed": "Golden Retriever",
        "age_category": "Adult (2 years)",
        "animal_tag_or_name": "Dog 'Leo'",
        "display_pseudonym": "Dog 'Leo'",
        "owner_contact_masked": "+91-XXXXX-3310",
        "facility_id": "FAC-BBSR-01",
        "facility": "Central Veterinary Clinic Saheed Nagar, Bhubaneswar",
        "district": "Khordha (Bhubaneswar)",
        "vernacular_language": "english",
        "symptoms_raw": "Routine annual Rabies booster check-up and minor ear pinna scratch; healthy appetite and normal activity.",
        "translated_english": "Routine annual Rabies booster check-up and minor ear pinna scratch; healthy appetite and normal activity.",
        "symptoms": ["Annual vaccination booster inquiry", "Minor superficial ear scratch"],
        "timeline": [
            "Today: Routine scheduled outpatient wellness visit"
        ],
        "vitals": vet03_vitals,
        "labs": {},
        "lab_analysis": {},
        "esi_level": None,
        "urgency_code": vet03_res["urgency_code"],
        "urgency_category": vet03_res["urgency_category"],
        "classification": vet03_res["classification"],
        "reasons": vet03_res["reasons"],
        "flags": vet03_res["flags"],
        "critical_actions": vet03_res["critical_actions"],
        "missing_info": vet03_res["missing_info"],
        "is_uncertain": False,
        "status": "PENDING_REVIEW",
        "pii_redactions": [],
        "veterinary_guidance": {"species": "dog", "disclaimer": VETERINARY_DISCLAIMER}
    }

    # VET-TC-04: Goat Beta Species Presentation (UNCERTAIN - State)
    vet04_symptoms = "Goat has been weak and lying down with reduced appetite since yesterday"
    vet04_res = VeterinaryRuleEngine.evaluate_triage(
        species="goat",
        symptoms_raw=vet04_symptoms,
        vitals={},
        duration_text="24 hours"
    )

    vet04_record = {
        "id": "VET-TC-04-UNCERTAIN-BETA",
        "domain": "veterinary",
        "test_case_id": "VET-TC-04",
        "species": "goat",
        "breed": "Black Bengal Goat",
        "age_category": "Young (1 year)",
        "animal_tag_or_name": "Caprine Goat #BB-109",
        "display_pseudonym": "Caprine Goat #BB-109",
        "owner_contact_masked": "+91-XXXXX-1209",
        "facility_id": "FAC-ROU-01",
        "facility": "Block Veterinary Dispensary Bisra",
        "district": "Sundargarh (Rourkela)",
        "vernacular_language": "english",
        "symptoms_raw": vet04_symptoms,
        "translated_english": vet04_symptoms,
        "symptoms": ["Lethargy / weakness", "Reduced appetite"],
        "timeline": ["Since yesterday morning: progressive dullness"],
        "vitals": {},
        "labs": {},
        "lab_analysis": {},
        "esi_level": None,
        "urgency_code": vet04_res["urgency_code"],
        "urgency_category": vet04_res["urgency_category"],
        "classification": vet04_res["classification"],
        "reasons": vet04_res["reasons"],
        "flags": vet04_res["flags"],
        "critical_actions": vet04_res["critical_actions"],
        "missing_info": vet04_res["missing_info"],
        "is_uncertain": True,
        "status": "PENDING_REVIEW",
        "pii_redactions": [],
        "veterinary_guidance": {"species": "goat", "disclaimer": VETERINARY_DISCLAIMER}
    }

    # Save all records to SQLite
    TriageDatabase.save_record(tc01_record)
    TriageDatabase.save_record(tc02_record)
    TriageDatabase.save_record(tc03_record)
    TriageDatabase.save_record(vet01_record)
    TriageDatabase.save_record(vet02_record)
    TriageDatabase.save_record(vet03_record)
    TriageDatabase.save_record(vet04_record)

    return [tc01_record, tc02_record, tc03_record, vet01_record, vet02_record, vet03_record, vet04_record]
