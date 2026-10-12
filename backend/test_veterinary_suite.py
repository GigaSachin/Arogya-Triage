"""
Comprehensive Automated Test Suite for AROGYA-TRIAGE: Veterinary Module
Validates:
1. Deterministic species-specific triage (Cattle VET-TC-01, Canine VET-TC-02, Canine VET-TC-03)
2. Beta species (Goat, Cat, Buffalo) and unsupported species uncertainty handling
3. Zero automated drug prescriptions / non-diagnostic safety compliance
4. Emergency warning signs escalation guidance
5. Veterinary Referral PDF generation (DAH&VS format)
6. Domain separation regression tests (proves Veterinary cannot enter ESI engine and vice-versa)
7. Transactional SQLite database domain filtering and reviewer audit trail
"""
from app.veterinary_rules import (
    VeterinaryRuleEngine, VETERINARY_DISCLAIMER,
    SUPPORTED_SPECIES, BETA_SPECIES, SPECIES_REFERENCE_INTERVALS
)
from app.veterinary_pdf import VeterinaryReferralPDFGenerator
from app.mcp_server import ClinicalMCPServer
from app.db import TriageDatabase, init_db

def run_all_veterinary_tests():
    print("==================================================")
    print("RUNNING AROGYA-TRIAGE VETERINARY TEST SUITE")
    print("==================================================")
    init_db()

    # TEST 1: Cattle Acute Ruminal Bloat & Dyspnea (VET-TC-01) -> CRITICAL
    vet01_res = VeterinaryRuleEngine.evaluate_triage(
        species="cattle",
        symptoms_raw="Acute severe left flank swelling / bloat after clover grazing; open mouth breathing and grunting",
        vitals={"temperature": 102.0, "respiration_rate": 54, "mucous_membrane_color": "cyanotic", "crt_sec": 2.8},
        duration_text="3 hours",
        age_category="Adult"
    )
    assert vet01_res["urgency_category"] == "CRITICAL", f"Expected CRITICAL, got {vet01_res['urgency_category']}"
    assert vet01_res["urgency_code"] == "RED"
    assert "VET_BOVINE_ACUTE_TYMPANY_DYSPNEA" in vet01_res["flags"]
    assert "VET_CYANOSIS_HYPOXIA" in vet01_res["flags"]
    assert any("sternum" in a.lower() or "standing" in a.lower() for a in vet01_res["critical_actions"])
    print("[PASS] TEST 1: VET-TC-01 (Cattle Bloat + Dyspnea) correctly evaluated to CRITICAL (Code RED).")

    # TEST 2: Canine Parvovirus Suspect (VET-TC-02) -> EMERGENT
    vet02_res = VeterinaryRuleEngine.evaluate_triage(
        species="dog",
        symptoms_raw="Foul-smelling bloody diarrhea, persistent vomiting for 24h, severe depression",
        vitals={"temperature": 103.8, "heart_rate": 150, "mucous_membrane_color": "pale", "crt_sec": 2.6},
        duration_text="24 hours",
        age_category="Puppy (4 months)"
    )
    assert vet02_res["urgency_category"] == "EMERGENT", f"Expected EMERGENT, got {vet02_res['urgency_category']}"
    assert vet02_res["urgency_code"] == "RED"
    assert "VET_CANINE_PARVO_HEMORRHAGIC" in vet02_res["flags"]
    assert "VET_PALLOR_SHOCK" in vet02_res["flags"]
    print("[PASS] TEST 2: VET-TC-02 (Canine Parvo Suspect) correctly evaluated to EMERGENT (Code RED).")

    # TEST 3: Canine Routine OPD (VET-TC-03) -> ROUTINE
    vet03_res = VeterinaryRuleEngine.evaluate_triage(
        species="dog",
        symptoms_raw="Routine annual Rabies vaccination check and minor ear scratch",
        vitals={"temperature": 101.4, "heart_rate": 86, "respiration_rate": 18, "mucous_membrane_color": "pink", "crt_sec": 1.2},
        duration_text="1 day"
    )
    assert vet03_res["urgency_category"] == "ROUTINE", f"Expected ROUTINE, got {vet03_res['urgency_category']}"
    assert vet03_res["urgency_code"] == "GREEN"
    assert len(vet03_res["flags"]) == 0
    print("[PASS] TEST 3: VET-TC-03 (Canine Routine OPD) correctly evaluated to ROUTINE (Code GREEN).")

    # TEST 4: Beta Species Uncertainty Handling (Goat / Cat)
    goat_res = VeterinaryRuleEngine.evaluate_triage(
        species="goat",
        symptoms_raw="Weakness and anorexia since yesterday",
        vitals={}
    )
    assert goat_res["is_uncertain"] is True
    assert goat_res["urgency_category"] == "UNCERTAIN"
    assert "VET_BETA_SPECIES_UNCERTAINTY" in goat_res["flags"]
    print("[PASS] TEST 4: Beta species (Goat) safely flagged with explicit UNCERTAINTY without guessing.")

    # TEST 5: Unsupported Species Rejection (e.g. Exotic / Unknown)
    exotic_res = VeterinaryRuleEngine.evaluate_triage(
        species="iguana",
        symptoms_raw="Lethargy on rock",
        vitals={}
    )
    assert exotic_res["is_uncertain"] is True
    assert exotic_res["urgency_category"] == "UNCERTAIN"
    assert "VET_UNSUPPORTED_SPECIES" in exotic_res["flags"]
    print("[PASS] TEST 5: Unsupported species (Iguana) safely returned UNCERTAINTY state.")

    # TEST 6: Blank or Malformed Symptom Payload
    blank_res = VeterinaryRuleEngine.evaluate_triage(
        species="dog",
        symptoms_raw="  ",
        vitals={}
    )
    assert blank_res["is_uncertain"] is True
    assert "INSUFFICIENT_SYMPTOM_DATA" in blank_res["flags"]
    print("[PASS] TEST 6: Blank symptom payload flagged with INSUFFICIENT_SYMPTOM_DATA uncertainty.")

    # TEST 7: Zero Drug Prescription Safety Compliance
    prohibited_meds = ["paracetamol", "amoxicillin", "enrofloxacin", "ivermectin", "meloxicam", "mg/kg", "dosage", "tablet", "injection"]
    all_actions = " ".join(vet01_res["critical_actions"] + vet02_res["critical_actions"] + vet03_res["critical_actions"]).lower()
    for med in prohibited_meds:
        assert med not in all_actions, f"Prohibited prescription/dosage '{med}' found in veterinary output!"
    print("[PASS] TEST 7: Zero drug prescriptions and zero unauthorized dosages verified across all actions.")

    # TEST 8: Missing Information Detection
    gaps = VeterinaryRuleEngine.detect_missing_info(
        species="dog",
        symptoms_raw="Dog has loose stool",
        vitals={"heart_rate": 90},
        duration_text=None,
        history=None
    )
    gap_fields = [g["field"] for g in gaps]
    assert "duration" in gap_fields, "Expected missing duration gap!"
    assert "vitals.temperature" in gap_fields, "Expected missing temperature gap!"
    assert "history.vaccination" in gap_fields, "Expected missing canine vaccination gap!"
    print(f"[PASS] TEST 8: Clinical diagnostic blind spots identified: {gap_fields}")

    # TEST 9: Veterinary Referral PDF Generation
    dummy_vet_record = {
        "id": "VET-TEST-001",
        "domain": "veterinary",
        "species": "cattle",
        "breed": "Red Sindhi",
        "animal_tag_or_name": "Tag #OD-9921",
        "urgency_category": "CRITICAL",
        "urgency_code": "RED",
        "classification": "Resuscitation / Immediate Life Threat",
        "symptoms_raw": "Severe bloat and breathing distress",
        "symptoms": ["Acute bloat", "Labored breathing"],
        "vitals": {"temperature": 102.4, "heart_rate": 98, "respiration_rate": 50, "mucous_membrane_color": "cyanotic", "crt_sec": 2.8},
        "flags": ["VET_BOVINE_ACUTE_TYMPANY_DYSPNEA", "VET_CYANOSIS_HYPOXIA"],
        "reasons": ["Severe bloat with secondary respiratory compromise"],
        "critical_actions": ["Emergency positioning", "Immediate decompression preparation"],
        "missing_info": [{"title": "Vaccination Status", "reason": "Surveillance tracking"}],
        "owner_contact_masked": "+91-XXXXX-9901",
        "facility": "Govt Veterinary Hospital Panposh"
    }
    pdf_path = VeterinaryReferralPDFGenerator.generate_referral_pdf(dummy_vet_record)
    assert pdf_path.endswith(".pdf")
    print(f"[PASS] TEST 9: Veterinary Referral PDF generated successfully at {pdf_path}")

    # TEST 10: DOMAIN SEPARATION REGRESSION TEST
    # Proves Veterinary records NEVER contain human ESI levels (1-5) and cannot enter human ESI
    TriageDatabase.save_record(dummy_vet_record)
    retrieved = TriageDatabase.get_record_by_id("VET-TEST-001")
    assert retrieved["domain"] == "veterinary", "Domain must be veterinary!"
    assert retrieved["esi_level"] is None, "Veterinary record must NEVER expose human ESI level!"
    assert retrieved["urgency_category"] == "CRITICAL", "Veterinary must use VTI Urgency Category!"

    # Verify domain filtering in queue queries
    vet_queue = TriageDatabase.get_queue(domain_filter="veterinary")
    assert all(r["domain"] == "veterinary" for r in vet_queue), "Veterinary queue must contain only veterinary records!"
    assert all(r["esi_level"] is None for r in vet_queue), "Veterinary records in queue must have esi_level = None!"

    human_queue = TriageDatabase.get_queue(domain_filter="human")
    assert all(r["domain"] == "human" for r in human_queue), "Human queue must contain only human records!"
    assert all(r["esi_level"] is not None for r in human_queue), "Human records in queue must have ESI levels!"

    print("[PASS] TEST 10: Strict domain isolation verified: animals never receive human ESI scores; queues strictly separated.")

    # TEST 11: Veterinary End-to-End API Endpoints via TestClient
    # pyrefly: ignore [missing-import]
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    # Health check
    health_res = client.get("/api/veterinary/health")
    assert health_res.status_code == 200
    assert health_res.json()["domain"] == "veterinary"

    # API Triage submission
    triage_payload = {
        "species": "cattle",
        "breed": "Gir Cow",
        "age_category": "Adult (4 years)",
        "animal_tag_or_name": "Cow #OD-2026",
        "symptoms_raw": "Severe abdominal pain, left flank tympany, labored open mouth breathing",
        "duration_text": "2 hours",
        "vitals": {
            "temperature": 102.2,
            "respiration_rate": 52,
            "mucous_membrane_color": "cyanotic",
            "crt_sec": 2.7
        },
        "owner_phone": "+91-9876543210"
    }
    triage_api_res = client.post("/api/veterinary/triage", json=triage_payload)
    assert triage_api_res.status_code == 200, f"Triage API failed: {triage_api_res.text}"
    created_case = triage_api_res.json()
    assert created_case["domain"] == "veterinary"
    assert created_case["urgency_category"] == "CRITICAL"
    created_id = created_case["record_id"]

    # Veterinary queue
    queue_res = client.get("/api/veterinary/queue")
    assert queue_res.status_code == 200
    assert any(c["id"] == created_id for c in queue_res.json()["records"])

    # Veterinary approve
    approve_res = client.post(f"/api/veterinary/queue/{created_id}/approve", json={"doctor_name": "Dr. A. K. Nayak"})
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"

    # Veterinary override
    override_res = client.post(
        f"/api/veterinary/queue/{created_id}/override",
        json={"new_urgency": "EMERGENT", "justification_reason": "Stabilized with stomach tube decompression; monitored in ward"}
    )
    assert override_res.status_code == 200
    assert override_res.json()["new_urgency"] == "EMERGENT"
    print("[PASS] TEST 11: End-to-end Veterinary REST endpoints (triage, queue, approve, override) verified.")

    # TEST 12: Cross-Domain Endpoint Security & Regression
    # Verify human override endpoint explicitly blocks animal cases
    cross_override = client.post(
        f"/api/queue/{created_id}/override",
        json={"new_esi": 2, "justification_reason": "Attempting invalid human ESI on cow"}
    )
    assert cross_override.status_code == 400, "Human override endpoint MUST reject veterinary records!"

    # Verify human FHIR endpoint explicitly blocks animal cases
    cross_fhir = client.get(f"/api/queue/{created_id}/fhir")
    assert cross_fhir.status_code == 400, "Human ABDM FHIR bundle endpoint MUST reject veterinary records!"

    # Verify unified PDF referral route routes veterinary cases to Veterinary Referral PDF
    pdf_res = client.get(f"/api/queue/{created_id}/referral/pdf")
    assert pdf_res.status_code == 200, "Referral PDF route should serve veterinary PDF!"
    assert "application/pdf" in pdf_res.headers.get("content-type", "")
    print("[PASS] TEST 12: Cross-domain endpoint safety verified: Human ESI & FHIR reject animals; PDF routes correctly.")

    print("\n==================================================")
    print("ALL 12 VETERINARY CLINICAL & REGRESSION TEST VECTORS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_all_veterinary_tests()
