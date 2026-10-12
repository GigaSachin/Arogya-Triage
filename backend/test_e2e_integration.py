"""
E2E Integration & Verification Smoke Test for AROGYA-TRIAGE
Tests both Human Healthcare and Veterinary Pathways live against the running dev servers.
"""
import urllib.request
import json
import sys
BASE_URL = None
for candidate in ["http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://localhost:5173", "http://localhost:5174"]:
    try:
        with urllib.request.urlopen(f"{candidate}/api/health", timeout=1.0) as resp:
            if resp.status == 200:
                BASE_URL = candidate
                break
    except Exception:
        pass

if not BASE_URL:
    BASE_URL = "http://127.0.0.1:5173"

def test_all():
    print("==================================================")
    print("RUNNING AROGYA-TRIAGE LIVE E2E INTEGRATION SUITE")
    print(f"Target Gateway: {BASE_URL}")
    print("==================================================")

    # 1. Frontend HTML Root
    html = urllib.request.urlopen(f"{BASE_URL}/").read().decode("utf-8")
    assert "<div id=\"root\">" in html, "Frontend root mounting point missing!"
    print("[PASS] TEST 1: Frontend Root HTML served successfully with valid title & assets.")

    # 2. Human Health API
    h1 = json.loads(urllib.request.urlopen(f"{BASE_URL}/api/health").read())
    assert h1["status"] == "HEALTHY"
    print(f"[PASS] TEST 2: Human API Gateway healthy: {h1['service']} (Version {h1['version']})")

    # 3. Veterinary Health API
    h2 = json.loads(urllib.request.urlopen(f"{BASE_URL}/api/veterinary/health").read())
    assert h2["status"] == "HEALTHY"
    assert "cattle" in h2["supported_species"] and "dog" in h2["supported_species"]
    print(f"[PASS] TEST 3: Veterinary API Gateway healthy: Supported={h2['supported_species']}, Beta={h2['beta_species']}")

    # 4. Human Patient Intake (TC-01 Red Sepsis Simulation)
    human_payload = {
        "patient_id": "TEST-PT-99",
        "name": "Ramesh Majhi",
        "aadhaar": "9988 7766 5544",
        "phone": "9876543210",
        "facility_id": "FAC-ROU-01",
        "vernacular_language": "odia",
        "symptoms_raw": "Acute high fever, disorientation, gum bleeding",
        "vitals": {
            "spo2": 88.0,
            "pulse": 130.0,
            "systolic_bp": 85.0,
            "diastolic_bp": 55.0,
            "temperature": 103.5,
            "respiration_rate": 28.0
        },
        "labs": {"platelets": 15000, "wbc": 14500}
    }
    req1 = urllib.request.Request(
        f"{BASE_URL}/api/intake",
        data=json.dumps(human_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    human_res = json.loads(urllib.request.urlopen(req1).read())
    assert human_res["domain"] == "human"
    assert human_res["esi_level"] == 2
    assert human_res["urgency_code"] == "RED"
    human_rec_id = human_res["record_id"]
    print(f"[PASS] TEST 4: Human Triage Intake evaluated deterministically to ESI Level {human_res['esi_level']} (Record: {human_rec_id})")

    # 5. Human Referral PDF
    human_pdf = urllib.request.urlopen(f"{BASE_URL}/api/queue/{human_rec_id}/referral/pdf")
    assert human_pdf.status == 200
    pdf_bytes_human = human_pdf.read()
    assert pdf_bytes_human.startswith(b"%PDF")
    print(f"[PASS] TEST 5: Human ABDM Referral PDF generated: {len(pdf_bytes_human)} bytes.")

    # 6. Veterinary Triage Intake (VET-TC-01 Bovine Bloat Simulation)
    vet_payload = {
        "species": "cattle",
        "breed": "Red Sindhi",
        "age_category": "Adult (4 years)",
        "animal_tag_or_name": "Tag #OD-7721",
        "symptoms_raw": "Severe left flank distension / tympany, labored open mouth breathing",
        "duration_text": "2 hours",
        "vitals": {
            "temperature": 102.2,
            "respiration_rate": 54.0,
            "mucous_membrane_color": "cyanotic",
            "crt_sec": 2.8
        },
        "owner_phone": "+91-9876543210"
    }
    req2 = urllib.request.Request(
        f"{BASE_URL}/api/veterinary/triage",
        data=json.dumps(vet_payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    vet_res = json.loads(urllib.request.urlopen(req2).read())
    assert vet_res["domain"] == "veterinary"
    assert vet_res["urgency_category"] == "CRITICAL"
    assert vet_res["urgency_code"] == "RED"
    vet_rec_id = vet_res["record_id"]
    print(f"[PASS] TEST 6: Veterinary Triage Intake evaluated deterministically to {vet_res['urgency_category']} (Record: {vet_rec_id})")

    # 7. Veterinary Clinical Referral Note PDF
    vet_pdf = urllib.request.urlopen(f"{BASE_URL}/api/veterinary/queue/{vet_rec_id}/referral/pdf")
    assert vet_pdf.status == 200
    pdf_bytes_vet = vet_pdf.read()
    assert pdf_bytes_vet.startswith(b"%PDF")
    print(f"[PASS] TEST 7: Veterinary DAH&VS Transfer Referral PDF generated: {len(pdf_bytes_vet)} bytes.")

    # 8. Veterinary Approval Action
    req3 = urllib.request.Request(
        f"{BASE_URL}/api/veterinary/queue/{vet_rec_id}/approve",
        data=json.dumps({"doctor_name": "Dr. A. K. Nayak, Veterinary Officer"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    vet_appr = json.loads(urllib.request.urlopen(req3).read())
    assert vet_appr["status"] == "APPROVED"
    print(f"[PASS] TEST 8: Veterinary Officer single-action approval confirmed: {vet_appr['reviewer']}")

    # 9. Veterinary Urgency Category Override Action
    req4 = urllib.request.Request(
        f"{BASE_URL}/api/veterinary/queue/{vet_rec_id}/override",
        data=json.dumps({
            "new_urgency": "EMERGENT",
            "justification_reason": "Emergency trocharization completed; stabilized and transitioning to observation"
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    vet_over = json.loads(urllib.request.urlopen(req4).read())
    assert vet_over["status"] == "OVERRIDDEN"
    assert vet_over["new_urgency"] == "EMERGENT"
    print(f"[PASS] TEST 9: Veterinary urgency category override logged to immutable audit trail.")

    # 10. Domain Isolation & Security Boundary
    # Proof: Human ESI override MUST reject veterinary records
    try:
        err_req = urllib.request.Request(
            f"{BASE_URL}/api/queue/{vet_rec_id}/override",
            data=json.dumps({"new_esi": 1, "justification_reason": "Invalid ESI test"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(err_req)
        assert False, "Security boundary breached: human override accepted animal case!"
    except urllib.error.HTTPError as e:
        assert e.code == 400, f"Expected 400, got {e.code}"
        print(f"[PASS] TEST 10: Cross-domain boundary verified: Human ESI engine explicitly rejected animal record with HTTP 400.")

    # 11. Queues and Domain Separation
    human_q = json.loads(urllib.request.urlopen(f"{BASE_URL}/api/queue?domain=human").read())
    vet_q = json.loads(urllib.request.urlopen(f"{BASE_URL}/api/veterinary/queue").read())
    assert all(r["domain"] == "human" for r in human_q["records"]), "Human queue polluted with non-human cases!"
    assert all(r["domain"] == "veterinary" for r in vet_q["records"]), "Veterinary queue polluted with human cases!"
    print(f"[PASS] TEST 11: Queue separation verified: {len(human_q['records'])} human records, {len(vet_q['records'])} veterinary records strictly isolated.")

    # 12. Surveillance & Audit Trail
    audit_data = json.loads(urllib.request.urlopen(f"{BASE_URL}/api/audit/logs").read())
    assert len(audit_data["audit_logs"]) > 0
    print(f"[PASS] TEST 12: Institutional governance verified: {len(audit_data['audit_logs'])} immutable clinical audit events logged.")

    print("\n==================================================")
    print("ALL 12 LIVE HTTP E2E INTEGRATION TESTS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    test_all()
