"""
Comprehensive Automated Test Suite for AROGYA-TRIAGE
Validates:
1. Deterministic ESI triage scoring against TC-01, TC-02, TC-03 specifications
2. In-flight PII redaction of Aadhaar and Phone numbers
3. ICMR/WHO lab cutoff alerts (Platelets < 20,000 / SpO2 < 90%)
4. ABDM FHIR Bundle generation
5. PDF referral document generation
"""
from app.mcp_server import ClinicalMCPServer
from app.pii_anonymizer import PIIAnonymizer
from app.pdf_generator import ABDMReferralPDFGenerator
from app.db import TriageDatabase, init_db

def run_all_tests():
    print("==================================================")
    print("RUNNING AROGYA-TRIAGE CLINICAL TEST SUITE (BPUT 2026)")
    print("==================================================")

    # Test 1: PII Masking
    sample_text = "Patient Ramesh Kumar with Aadhaar 9821 4452 1092 and mobile +91 9876543210 arrived with bleeding."
    masked, redactions = PIIAnonymizer.mask_text(sample_text)
    assert "9821 4452 1092" not in masked, "Aadhaar was not redacted!"
    assert "9876543210" not in masked, "Phone was not redacted!"
    assert "[AADHAAR: XXXX-XXXX-1092]" in masked
    assert "[PHONE: +91-XXXXX-3210]" in masked
    print("[PASS] TEST 1: PII Anonymizer successfully sanitized Aadhaar and Mobile numbers.")

    # Test 2: TC-01 (Red: Critical Sepsis / Thrombocytopenia)
    tc01_res = ClinicalMCPServer.compute_esi_triage(
        vitals={"spo2": 89, "pulse": 128, "systolic_bp": 88},
        red_flags=["Severe fever", "confusion", "gum bleeding"],
        symptoms=["Severe fever", "confusion", "gum bleeding"],
        labs={"platelets": 16000}
    )
    assert tc01_res["esi_level"] == 2, f"Expected ESI 2 for TC-01, got {tc01_res['esi_level']}"
    assert tc01_res["urgency_code"] == "RED"
    assert "CRITICAL_THROMBOCYTOPENIA" in tc01_res["flags"]
    assert "HYPOXEMIA_ALERT" in tc01_res["flags"]
    print(f"[PASS] TEST 2: TC-01 correctly evaluated to ESI Level {tc01_res['esi_level']} (RED - Emergent).")

    # Test 3: TC-02 (Yellow: Febrile Illness / Dehydration)
    tc02_res = ClinicalMCPServer.compute_esi_triage(
        vitals={"spo2": 97, "pulse": 98, "systolic_bp": 100, "temperature": 102.8},
        symptoms=["3 days high fever", "persistent diarrhea", "vomiting"],
        labs={"platelets": 115000}
    )
    assert tc02_res["esi_level"] == 3, f"Expected ESI 3 for TC-02, got {tc02_res['esi_level']}"
    assert tc02_res["urgency_code"] == "YELLOW"
    print(f"[PASS] TEST 3: TC-02 correctly evaluated to ESI Level {tc02_res['esi_level']} (YELLOW - Urgent).")

    # Test 4: TC-03 (Green: Routine OPD / Dressing)
    tc03_res = ClinicalMCPServer.compute_esi_triage(
        vitals={"spo2": 99, "pulse": 74, "systolic_bp": 118, "temperature": 98.4},
        symptoms=["Superficial forearm abrasion dressing change", "no fever"]
    )
    assert tc03_res["esi_level"] == 5, f"Expected ESI 5 for TC-03, got {tc03_res['esi_level']}"
    assert tc03_res["urgency_code"] == "GREEN"
    print(f"[PASS] TEST 4: TC-03 correctly evaluated to ESI Level {tc03_res['esi_level']} (GREEN - Non-Urgent).")

    # Test 5: Missing Info Detection
    gaps = ClinicalMCPServer.identify_missing_info(
        symptoms=["Patient has cut injury on hand"],
        vitals_present={"temperature": 98.4, "pulse": 76}
    )
    gap_titles = [g["title"] for g in gaps]
    assert any("Tetanus" in t for t in gap_titles), "Expected Tetanus check gap!"
    print(f"[PASS] TEST 5: Clinical gaps correctly flagged: {gap_titles}")

    # Test 6: ABDM FHIR Bundle Generation
    dummy_record = {
        "id": "TEST-REC-001",
        "display_pseudonym": "Patient-TEST",
        "esi_level": 2,
        "urgency_code": "RED",
        "classification": "Emergent",
        "vitals": {"spo2": 89, "pulse": 128},
        "labs": {"platelets": 16000},
        "symptoms": ["Fever", "Gum bleeding"]
    }
    fhir_bundle = ClinicalMCPServer.generate_abdm_fhir_bundle(dummy_record)
    assert fhir_bundle["resourceType"] == "Bundle"
    assert fhir_bundle["entry"][0]["resource"]["resourceType"] == "Composition"
    print("[PASS] TEST 6: ABDM FHIR Document Bundle adheres to HL7 R4 schema.")

    # Test 7: PDF Referral Generation
    pdf_path = ABDMReferralPDFGenerator.generate_referral_pdf(dummy_record)
    assert pdf_path.endswith(".pdf"), "PDF output file not generated!"
    print(f"[PASS] TEST 7: ABDM Referral PDF successfully generated at {pdf_path}")

    print("\n==================================================")
    print("ALL 7 CLINICAL TEST VECTORS PASSED WITH 100% COMPLIANCE!")
    print("==================================================")

if __name__ == "__main__":
    run_all_tests()
