"""
Clinical MCP (Model Context Protocol) Server & Deterministic Rule Engine
Isolates clinical decision logic from LLM hallucinations.

Implements:
1. validate_lab_parameters(labs: dict)
2. compute_esi_triage(vitals: dict, red_flags: list, symptoms: list, labs: dict)
3. identify_missing_info(symptoms: list, vitals_present: dict, labs_present: dict)
4. generate_abdm_fhir_bundle(triage_record: dict)
"""
from typing import Dict, Any, List
import datetime
import uuid
from .config import CLINICAL_REFERENCE_INTERVALS, VITALS_THRESHOLDS, REGULATORY_DISCLAIMER

class ClinicalMCPServer:
    """
    Deterministic rule-bound MCP Tool implementation for healthcare triage.
    All logic is rule-based, audited against ICMR/WHO guidelines and ESI v4 specifications.
    """

    @classmethod
    def get_tool_definitions(cls) -> List[Dict[str, Any]]:
        """Returns MCP tool declarations for LLM agent integration"""
        return [
            {
                "name": "validate_lab_parameters",
                "description": "Evaluates quantitative laboratory values against standard ICMR/WHO reference intervals, returning flagged critical abnormalities.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "labs": {
                            "type": "object",
                            "description": "Dictionary of test names and numerical values (e.g. {'platelets': 16000, 'hemoglobin': 11.2})"
                        }
                    },
                    "required": ["labs"]
                }
            },
            {
                "name": "compute_esi_triage",
                "description": "Deterministically assigns Emergency Severity Index (ESI Levels 1-5) triage score based on physiological danger thresholds and clinical red flags.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "vitals": {"type": "object", "description": "Patient vital signs (spo2, pulse, systolic_bp, temp, rr)"},
                        "red_flags": {"type": "array", "items": {"type": "string"}, "description": "Clinical red flags detected"},
                        "symptoms": {"type": "array", "items": {"type": "string"}, "description": "Structured symptom strings"},
                        "labs": {"type": "object", "description": "Validated lab parameters"}
                    },
                    "required": ["vitals"]
                }
            },
            {
                "name": "identify_missing_info",
                "description": "Compares parsed intake information against clinical protocol templates to detect vital gaps and diagnostic blind spots for attending doctors.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "symptoms": {"type": "array", "items": {"type": "string"}},
                        "vitals_present": {"type": "object"},
                        "labs_present": {"type": "object"}
                    },
                    "required": ["symptoms", "vitals_present"]
                }
            },
            {
                "name": "generate_abdm_fhir_bundle",
                "description": "Generates an interoperable HL7 FHIR Composition bundle conforming to Ayushman Bharat Digital Mission (ABDM) specifications for institutional transfer.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "triage_record": {"type": "object", "description": "Complete triage assessment record"}
                    },
                    "required": ["triage_record"]
                }
            }
        ]

    # Tool 1: validate_lab_parameters
    @staticmethod
    def validate_lab_parameters(labs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates quantitative lab values against ICMR/WHO reference intervals.
        Deterministic scoring prevents LLM hallucination of test results.
        """
        results = {
            "flagged_parameters": [],
            "critical_flags": [],
            "normalized_values": {},
            "all_evaluated": []
        }

        if not labs:
            return results

        for key, val in labs.items():
            norm_key = key.lower().strip().replace(" ", "_").replace("-", "_")
            # Map common variations
            if norm_key in ["platelet", "plt", "platelets_count"]:
                norm_key = "platelets"
            elif norm_key in ["hb", "hgb", "haemoglobin"]:
                norm_key = "hemoglobin"
            elif norm_key in ["tlc", "white_blood_cells", "leukocytes"]:
                norm_key = "wbc"
            elif norm_key in ["sugar", "glucose", "fbs", "rbs"]:
                norm_key = "fasting_blood_sugar"
            elif norm_key in ["creatinine", "creat"]:
                norm_key = "serum_creatinine"
            elif norm_key in ["bili", "bilirubin"]:
                norm_key = "total_bilirubin"

            try:
                num_val = float(val)
            except (ValueError, TypeError):
                continue

            results["normalized_values"][norm_key] = num_val
            ref = CLINICAL_REFERENCE_INTERVALS.get(norm_key)

            if not ref:
                results["all_evaluated"].append({
                    "parameter": norm_key,
                    "value": num_val,
                    "unit": "",
                    "status": "NORMAL_OR_UNCLASSIFIED"
                })
                continue

            param_report = {
                "parameter": ref["name"],
                "key": norm_key,
                "value": num_val,
                "unit": ref["unit"],
                "reference_range": f"{ref['normal_min']} - {ref['normal_max']} {ref['unit']}",
                "status": "NORMAL"
            }

            # Check critical & abnormal thresholds
            is_critical = False
            is_abnormal = False
            flag_code = None

            # Low threshold checks (e.g. Platelets, Hemoglobin)
            if "critical_low" in ref and num_val < ref["critical_low"]:
                is_critical = True
                flag_code = ref["critical_flag"]
                param_report["status"] = "CRITICAL_LOW"
                param_report["severity"] = "CRITICAL"
                param_report["clinical_note"] = ref.get("description", "Dangerously low value")
            elif "severe_low" in ref and num_val < ref["severe_low"]:
                is_abnormal = True
                flag_code = f"SEVERE_LOW_{norm_key.upper()}"
                param_report["status"] = "SEVERE_LOW"
                param_report["severity"] = "HIGH"
            elif "moderate_low" in ref and num_val < ref["moderate_low"]:
                is_abnormal = True
                flag_code = f"LOW_{norm_key.upper()}"
                param_report["status"] = "LOW"
                param_report["severity"] = "MODERATE"
            elif "normal_min" in ref and num_val < ref["normal_min"]:
                is_abnormal = True
                param_report["status"] = "BELOW_NORMAL"
                param_report["severity"] = "MILD"

            # High threshold checks (e.g. WBC, Sugar, Creatinine, Bilirubin)
            if "critical_high" in ref and num_val > ref["critical_high"]:
                is_critical = True
                flag_code = ref["critical_flag"]
                param_report["status"] = "CRITICAL_HIGH"
                param_report["severity"] = "CRITICAL"
                param_report["clinical_note"] = ref.get("description", "Dangerously elevated value")
            elif "normal_max" in ref and num_val > ref["normal_max"] and not is_critical:
                is_abnormal = True
                param_report["status"] = "ABOVE_NORMAL"
                param_report["severity"] = "MODERATE"

            if is_critical:
                results["critical_flags"].append({
                    "flag": flag_code,
                    "parameter": ref["name"],
                    "value": f"{num_val} {ref['unit']}",
                    "threshold": f"< {ref.get('critical_low')}" if "critical_low" in ref and num_val < ref["critical_low"] else f"> {ref.get('critical_high')}",
                    "clinical_action": ref.get("description", "Urgent clinical attention required")
                })
                results["flagged_parameters"].append(param_report)
            elif is_abnormal:
                results["flagged_parameters"].append(param_report)

            results["all_evaluated"].append(param_report)

        return results

    # Tool 2: compute_esi_triage
    @staticmethod
    def compute_esi_triage(
        vitals: Dict[str, Any],
        red_flags: List[str] = None,
        symptoms: List[str] = None,
        labs: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Deterministic Emergency Severity Index (ESI Levels 1-5) rule engine.
        Follows standard AHRQ ESI v4 Decision Algorithm:
        - Level 1: Immediate life-saving intervention needed (unresponsive, severe shock, arrest)
        - Level 2: High risk situation, confusion/lethargy/disorientation, severe pain/distress, danger zone vitals
        - Level 3: Multiple resources needed (IV fluids, systemic labs, severe fever with dehydration)
        - Level 4: One resource needed (simple X-ray, minor lab, single medication)
        - Level 5: Zero resources needed (routine wound dressing, refill, examination only)
        """
        red_flags = red_flags or []
        symptoms = symptoms or []
        labs = labs or {}

        # Parse vitals
        def get_vital(k, default=None):
            try:
                v = vitals.get(k)
                return float(v) if v is not None and v != "" else default
            except (ValueError, TypeError):
                return default

        spo2 = get_vital("spo2")
        pulse = get_vital("pulse") or get_vital("heart_rate")
        sys_bp = get_vital("systolic_bp") or get_vital("bp_sys")
        dia_bp = get_vital("diastolic_bp") or get_vital("bp_dia")
        temp = get_vital("temperature") or get_vital("temp")
        rr = get_vital("respiration_rate") or get_vital("rr")

        # Evaluate lab parameters through deterministic validator
        lab_analysis = ClinicalMCPServer.validate_lab_parameters(labs)
        critical_lab_count = len(lab_analysis["critical_flags"])

        # Determine clinical triggers
        raw_text = " ".join([str(s).lower() for s in symptoms] + [str(rf).lower() for rf in red_flags])
        
        # Negation handling: strip negated terms (e.g. "no fever", "afebrile", "denies vomiting")
        all_text = raw_text
        for neg in ["no fever", "without fever", "denies fever", "afebrile", "no chills", "no bleeding", "no distress", "dressing change"]:
            all_text = all_text.replace(neg, " ")
        
        reasons = []
        flags = []

        # ==========================================================
        # ESI LEVEL 1 DECISION POINT: Immediate Life Threat / Resuscitation
        # ==========================================================
        is_level_1 = False
        level_1_triggers = [
            ("cardiac arrest", "Cardiopulmonary arrest indicated"),
            ("unresponsive", "Patient unresponsive / GCS <= 8"),
            ("apneic", "Severe respiratory arrest / apnea"),
            ("pulseless", "No palpable pulse detected"),
            ("intubation", "Immediate airway protection needed")
        ]
        for trigger, desc in level_1_triggers:
            if trigger in all_text:
                is_level_1 = True
                reasons.append(desc)
                flags.append("ESI_1_LIFE_THREAT")

        if sys_bp is not None and sys_bp < 70:
            is_level_1 = True
            reasons.append(f"Profound circulatory collapse (Systolic BP: {sys_bp} mmHg)")
            flags.append("ESI_1_HYPOTENSIVE_SHOCK")

        if is_level_1:
            return {
                "esi_level": 1,
                "urgency_code": "RED",
                "classification": "Resuscitation (Immediate Life Threat)",
                "recommended_wait_time": "0 minutes (Immediate)",
                "reasons": reasons,
                "flags": flags,
                "critical_actions": [
                    "Immediate resuscitation bay transfer",
                    "Continuous multiparameter monitoring",
                    "Secure patent airway / 100% High-flow Oxygen",
                    "Rapid senior physician escalation"
                ],
                "deterministic_rule": "ESI Decision Point A: Requires immediate life-saving intervention",
                "lab_analysis": lab_analysis
            }

        # ==========================================================
        # ESI LEVEL 2 DECISION POINT: High Risk / Confused / Severe Distress / Danger Zone Vitals
        # ==========================================================
        is_level_2 = False

        # 1. Danger Zone Vitals:
        # SpO2 < 90% is a strict clinical danger zone
        if spo2 is not None and spo2 < VITALS_THRESHOLDS["spo2"]["critical"]:
            is_level_2 = True
            reasons.append(f"Critical Hypoxemia (SpO2 {spo2}% < {VITALS_THRESHOLDS['spo2']['critical']}%)")
            flags.append("HYPOXEMIA_ALERT")

        # Tachycardia + Hemodynamic stress
        if pulse is not None and pulse >= 120:
            flags.append("TACHYCARDIA")
            if (spo2 is not None and spo2 < 92) or (sys_bp is not None and sys_bp < 95):
                is_level_2 = True
                reasons.append(f"Hemodynamic instability: Pulse {pulse} bpm with compromised perfusion")
                flags.append("HEMODYNAMIC_COMPROMISE")
            elif pulse >= 130:
                is_level_2 = True
                reasons.append(f"Severe Tachycardia (Heart Rate: {pulse} bpm)")

        # Hypotension / Early Shock
        if sys_bp is not None and sys_bp < 90:
            is_level_2 = True
            reasons.append(f"Hypotensive Shock warning (Systolic BP: {sys_bp} mmHg < 90)")
            flags.append("HYPOTENSION_ALERT")

        # 2. Critical Lab Triggers:
        # Severe thrombocytopenia (< 20,000/uL) -> High risk of spontaneous bleed/sepsis
        plt_val = lab_analysis["normalized_values"].get("platelets")
        if plt_val is not None and plt_val < 20000:
            is_level_2 = True
            reasons.append(f"Severe Thrombocytopenia (Platelets: {int(plt_val):,} /µL < 20,000) - Hemorrhagic / Dengue shock risk")
            flags.append("CRITICAL_THROMBOCYTOPENIA")

        hb_val = lab_analysis["normalized_values"].get("hemoglobin")
        if hb_val is not None and hb_val < 7.0:
            is_level_2 = True
            reasons.append(f"Critical Severe Anemia (Hemoglobin: {hb_val} g/dL < 7.0)")
            flags.append("SEVERE_ANEMIA_CRITICAL")

        # 3. High Risk Clinical Presentations / Altered Mental Status / Active Bleeding
        level_2_keywords = [
            ("confusion", "Altered mental status / Acute confusion"),
            ("bleeding", "Active hemorrhaging / Gum bleeding / Melena"),
            ("gum bleed", "Mucosal bleeding / Hemorrhagic diathesis"),
            ("chest pain", "Acute coronary syndrome presentation"),
            ("sepsis", "Clinical sepsis triad markers detected"),
            ("lethargy", "Marked lethargy / neurological depression"),
            ("severe trauma", "Major trauma mechanism")
        ]
        for kw, desc in level_2_keywords:
            if kw in all_text:
                is_level_2 = True
                reasons.append(desc)
                flags.append(f"FLAG_{kw.upper().replace(' ', '_')}")

        if is_level_2:
            return {
                "esi_level": 2,
                "urgency_code": "RED",
                "classification": "Emergent (High Risk / Severe Instability)",
                "recommended_wait_time": "< 10 minutes",
                "reasons": reasons,
                "flags": list(set(flags)),
                "critical_actions": [
                    "Prioritize to top of doctor queue immediately",
                    "Establish wide-bore IV access (18G/20G)",
                    "Supplemental oxygen therapy if SpO2 < 94%",
                    "Initiate urgent lab panel / Blood bank crossmatch if indicated",
                    "Continuous vitals monitoring every 15 minutes"
                ],
                "deterministic_rule": "ESI Decision Point B: High risk situation, altered sensorium, or physiological danger vitals",
                "lab_analysis": lab_analysis
            }

        # ==========================================================
        # ESI LEVEL 3 DECISION POINT: Urgent / Multiple Resources Needed
        # ==========================================================
        is_level_3 = False
        level_3_keywords = [
            ("fever", "High-grade febrile response requiring diagnostic workup"),
            ("vomiting", "Persistent vomiting requiring IV antiemetics/hydration"),
            ("diarrhea", "Persistent diarrhea with dehydration signs"),
            ("abdominal pain", "Acute abdominal discomfort requiring evaluation"),
            ("moderate pain", "Distressing symptoms requiring resource utilization"),
            ("dehydration", "Signs of systemic dehydration")
        ]

        matched_res_kws = []
        for kw, desc in level_3_keywords:
            if kw in all_text:
                is_level_3 = True
                matched_res_kws.append(desc)
                flags.append(f"SYMPTOM_{kw.upper().replace(' ', '_')}")

        # Vitals triggers for Level 3
        if temp is not None and temp >= 101.5:
            is_level_3 = True
            reasons.append(f"High-grade fever ({temp}°F)")
            flags.append("FEBRILE_RESPONSE")

        if (pulse is not None and pulse > 100) and not is_level_3:
            is_level_3 = True
            reasons.append(f"Moderate tachycardia (Pulse {pulse} bpm)")
            flags.append("TACHYCARDIA_MILD")

        if is_level_3:
            reasons.extend(matched_res_kws)
            return {
                "esi_level": 3,
                "urgency_code": "YELLOW",
                "classification": "Urgent (Multiple Diagnostic / Therapeutic Resources Needed)",
                "recommended_wait_time": "30 - 60 minutes",
                "reasons": reasons if reasons else ["Multiple clinical resources required for complete workup"],
                "flags": list(set(flags)),
                "critical_actions": [
                    "Evaluate hydration status and skin turgor",
                    "Request complete diagnostic workup (e.g. Dengue NS1, MP/Malaria, CBC, Urine R/M)",
                    "Initiate oral rehydration salt (ORS) or IV hydration as clinically indicated",
                    "Re-evaluate vitals in 30 minutes"
                ],
                "deterministic_rule": "ESI Decision Point C: Stable vitals but patient requires >= 2 systemic hospital resources",
                "lab_analysis": lab_analysis
            }

        # ==========================================================
        # ESI LEVEL 4 & 5: Semi-Urgent / Non-Urgent
        # ==========================================================
        level_4_keywords = ["sprain", "isolated laceration", "simple suture", "mild rash", "cough without fever", "earache"]
        has_l4 = any(kw in all_text for kw in level_4_keywords)

        if has_l4:
            return {
                "esi_level": 4,
                "urgency_code": "GREEN",
                "classification": "Semi-Urgent (Single Resource)",
                "recommended_wait_time": "60 - 120 minutes",
                "reasons": ["Single clinical resource / localized minor presentation"],
                "flags": ["MINOR_LOCALIZED_PRESENTATION"],
                "critical_actions": [
                    "Standard outpatient queue examination",
                    "Single targeted evaluation (e.g. localized dressing or single lab)"
                ],
                "deterministic_rule": "ESI Decision Point D: Requires exactly 1 resource",
                "lab_analysis": lab_analysis
            }

        # Default Level 5: Non-Urgent (Zero acute resources: Routine OPD, dressing change, medication refill)
        return {
            "esi_level": 5,
            "urgency_code": "GREEN",
            "classification": "Non-Urgent (Routine OPD / No Acute Resources)",
            "recommended_wait_time": "120+ minutes / Standard OPD Flow",
            "reasons": ["Routine outpatient consultation, wound dressing change, or check-in with stable vitals"],
            "flags": ["ROUTINE_OPD"],
            "critical_actions": [
                "Standard OPD queue assignment",
                "Routine clinical consultation and health education",
                "Verify routine immunization / tetanus status if wound related"
            ],
            "deterministic_rule": "ESI Decision Point E: Requires 0 acute resources",
            "lab_analysis": lab_analysis
        }

    # Tool 3: identify_missing_info
    @staticmethod
    def identify_missing_info(
        symptoms: List[str],
        vitals_present: Dict[str, Any],
        labs_present: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Detects clinical protocol gaps and prompts attending medical officers
        to prevent diagnostic blind spots in frontline settings.
        """
        symptoms = symptoms or []
        vitals_present = vitals_present or {}
        labs_present = labs_present or {}

        all_text = " ".join([str(s).lower() for s in symptoms])
        gaps = []

        # 1. Missing Core Temperature for Febrile symptoms
        has_fever_symptom = any(kw in all_text for kw in ["fever", "bukhar", "jwara", "chills", "sweats"])
        temp_val = vitals_present.get("temperature") or vitals_present.get("temp")
        if has_fever_symptom and (temp_val is None or temp_val == ""):
            gaps.append({
                "category": "CRITICAL_VITAL_MISSING",
                "title": "Unrecorded Core Body Temperature",
                "prompt": "Patient reported feverish symptoms, but no digital thermometry was recorded. Prompt triage staff to measure oral/axillary temperature immediately.",
                "importance": "HIGH"
            })

        # 2. Missing SpO2 for Respiratory / Dyspneic presentations
        has_resp_symptom = any(kw in all_text for kw in ["cough", "breath", "chest", "wheeze", "khasi", "swasa"])
        spo2_val = vitals_present.get("spo2")
        if has_resp_symptom and (spo2_val is None or spo2_val == ""):
            gaps.append({
                "category": "CRITICAL_VITAL_MISSING",
                "title": "Unrecorded Pulse Oximetry (SpO2)",
                "prompt": "Respiratory complaints detected without pulse oximetry. Measure SpO2 immediately to rule out silent hypoxemia.",
                "importance": "HIGH"
            })

        # 3. Missing Duration Marker
        has_duration = any(kw in all_text for kw in ["day", "days", "hour", "hours", "week", "month", "din", "ghanta"])
        if not has_duration and len(symptoms) > 0:
            gaps.append({
                "category": "TIMELINE_GAP",
                "title": "Missing Symptom Duration Marker",
                "prompt": "Inquire with patient: How many days/hours have these symptoms persisted? Clarify exact onset timeline.",
                "importance": "MEDIUM"
            })

        # 4. Febrile + Dehydration follow-up protocol
        if any(kw in all_text for kw in ["fever", "diarrhea", "vomiting", "dast", "ulti"]):
            gaps.append({
                "category": "DOCTOR_PROMPT",
                "title": "Fluid Balance & Dehydration Assessment",
                "prompt": "Evaluate skin turgor, check mucous membrane moisture, and ascertain last urination timing.",
                "importance": "MEDIUM"
            })
            gaps.append({
                "category": "LAB_RECOMMENDATION",
                "title": "Endemic Vector-Borne Screening Protocol",
                "prompt": "In Odisha endemic zones, consider rapid Dengue NS1 antigen and Malaria Pf/Pv blood smear.",
                "importance": "MEDIUM"
            })

        # 5. Bleeding / Thrombocytopenia follow-up
        if any(kw in all_text for kw in ["bleed", "gum", "petechiae", "rash", "rakta"]):
            gaps.append({
                "category": "DOCTOR_PROMPT",
                "title": "Hemorrhagic Vigilance Protocol",
                "prompt": "Check for tourniquet sign, inspect for petechial rashes on limbs, evaluate stool color for melena.",
                "importance": "HIGH"
            })

        # 6. Wound / Trauma / Abrasion Tetanus Check
        if any(kw in all_text for kw in ["wound", "abrasion", "cut", "fall", "injury", "dressing", "chot"]):
            gaps.append({
                "category": "PREVENTIVE_VERIFICATION",
                "title": "Tetanus Toxoid (TT) Immunization Status",
                "prompt": "Verify patient's last Tetanus Toxoid booster history within the past 5-10 years.",
                "importance": "LOW"
            })

        return gaps

    # Tool 4: generate_abdm_fhir_bundle
    @staticmethod
    def generate_abdm_fhir_bundle(triage_record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Exports an Ayushman Bharat Digital Mission (ABDM) and HL7 FHIR R4
        compliant Composition Bundle for inter-facility clinical referral transfer.
        """
        record_id = triage_record.get("id", str(uuid.uuid4()))
        facility = triage_record.get("facility", "District Hospital Rourkela")
        timestamp = triage_record.get("timestamp", datetime.datetime.now(datetime.timezone.utc).isoformat())
        esi = triage_record.get("esi_level", 3)
        urgency = triage_record.get("urgency_code", "YELLOW")
        patient_token = triage_record.get("display_pseudonym", "Patient-ANON-001")
        vitals = triage_record.get("vitals", {})
        labs = triage_record.get("labs", {})
        symptoms = triage_record.get("symptoms", [])

        bundle = {
            "resourceType": "Bundle",
            "id": f"abdm-bundle-{record_id}",
            "meta": {
                "versionId": "1",
                "lastUpdated": timestamp,
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"]
            },
            "identifier": {
                "system": "https://abdm.gov.in/facilities/referrals",
                "value": f"REF-ODISHA-{record_id[:8].upper()}"
            },
            "type": "document",
            "timestamp": timestamp,
            "entry": [
                {
                    "fullUrl": f"urn:uuid:composition-{record_id}",
                    "resource": {
                        "resourceType": "Composition",
                        "id": f"comp-{record_id}",
                        "status": "final",
                        "type": {
                            "coding": [
                                {
                                    "system": "http://snomed.info/sct",
                                    "code": "371531000",
                                    "display": "Clinical report (record artifact)"
                                }
                            ],
                            "text": "Frontline Clinical Triage & Inter-Facility Transfer Summary"
                        },
                        "subject": {
                            "reference": f"urn:uuid:patient-{patient_token}",
                            "display": patient_token
                        },
                        "date": timestamp,
                        "author": [
                            {
                                "display": triage_record.get("reviewer_doctor", "Medical Officer On-Duty")
                            }
                        ],
                        "title": f"AROGYA-TRIAGE Transfer Summary - ESI Level {esi} ({urgency})",
                        "custodian": {
                            "display": facility
                        },
                        "section": [
                            {
                                "title": "Clinical Triage Assessment",
                                "code": {
                                    "coding": [{
                                        "system": "http://loinc.org",
                                        "code": "54094-8",
                                        "display": "Emergency Severity Index score"
                                    }]
                                },
                                "text": {
                                    "status": "generated",
                                    "div": f"<div><p><b>ESI Level:</b> {esi} ({urgency})</p><p><b>Deterministic Rationale:</b> {', '.join(triage_record.get('reasons', []))}</p></div>"
                                }
                            },
                            {
                                "title": "Vital Signs Profile",
                                "text": {
                                    "status": "generated",
                                    "div": f"<div><p>SpO2: {vitals.get('spo2', 'N/A')}% | Pulse: {vitals.get('pulse', 'N/A')} bpm | BP: {vitals.get('systolic_bp', 'N/A')}/{vitals.get('diastolic_bp', 'N/A')} mmHg | Temp: {vitals.get('temperature', 'N/A')}°F</p></div>"
                                }
                            },
                            {
                                "title": "Reported Vernacular Observations",
                                "text": {
                                    "status": "generated",
                                    "div": f"<div><p>{'; '.join(symptoms)}</p></div>"
                                }
                            },
                            {
                                "title": "Laboratory & Point-of-Care Observations",
                                "text": {
                                    "status": "generated",
                                    "div": f"<div><p>{str(labs)}</p></div>"
                                }
                            },
                            {
                                "title": "Regulatory Safeguards & Governance",
                                "text": {
                                    "status": "generated",
                                    "div": f"<div><p><b>Advisory Disclaimer:</b> {REGULATORY_DISCLAIMER}</p></div>"
                                }
                            }
                        ]
                    }
                }
            ]
        }
        return bundle
