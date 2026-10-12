"""
AROGYA-TRIAGE: Deterministic Veterinary Safety & Triage Rule Engine
Domain: Veterinary Medicine (Companion Animal & Livestock Emergency Triage)
Aligned with:
- Veterinary Emergency and Critical Care Society (VECCS) Triage Guidelines
- RECOVER Initiative Veterinary Triage Protocol
- ICAR / Indian Council of Agricultural Research Livestock Emergency Norms

IMPORTANT REGULATORY CONSTRAINTS:
1. NON-DIAGNOSTIC DECISION SUPPORT: Strictly decision-support for field paravets,
   ASHA/animal husbandry workers, and registered veterinary practitioners.
2. ZERO DRUG DOSES / PRESCRIPTIONS: Strictly prohibits automated drug dosage calculation,
   antibiotic suggestions, or home treatments.
3. DOMAIN ISOLATION: NEVER applies human Emergency Severity Index (ESI Levels 1-5) to animals.
   Uses Veterinary Triage Index (VTI): CRITICAL, EMERGENT, URGENT, ROUTINE, UNCERTAIN.
4. UNCERTAINTY HANDLING: Unsupported species, missing core parameters, or ambiguous presentations
   return an explicit UNCERTAINTY state recommending qualified clinical examination.
"""
from typing import Dict, Any, List, Optional, Tuple
import re

VETERINARY_DISCLAIMER = (
    "ADVISORY ONLY: Veterinary triage decision-support tool for qualified veterinary "
    "personnel, field paravets, and livestock inspectors. Non-diagnostic. Does not replace "
    "hands-on examination by a Registered Veterinary Practitioner (RVP). "
    "Zero automated prescriptions, antibiotic selections, or home drug dosages permitted."
)

SUPPORTED_SPECIES = ["cattle", "dog"]
BETA_SPECIES = ["cat", "buffalo", "goat"]

SPECIES_REFERENCE_INTERVALS = {
    "cattle": {
        "name": "Bovine / Cattle (Bos indicus / Bos taurus)",
        "temp_f": {"min": 100.4, "max": 102.8, "critical_high": 104.5, "critical_low": 99.0, "unit": "°F"},
        "heart_rate_bpm": {"min": 48, "max": 84, "critical_high": 100, "critical_low": 40, "unit": "bpm"},
        "respiration_bpm": {"min": 15, "max": 35, "critical_high": 50, "critical_low": 10, "unit": "breaths/min"},
        "crt_sec": {"normal_max": 2.0, "critical_high": 2.5, "unit": "sec"}
    },
    "dog": {
        "name": "Canine / Dog (Canis lupus familiaris)",
        "temp_f": {"min": 100.5, "max": 102.5, "critical_high": 104.0, "critical_low": 98.5, "unit": "°F"},
        "heart_rate_bpm": {"min": 60, "max": 140, "critical_high": 160, "critical_low": 50, "unit": "bpm"},
        "respiration_bpm": {"min": 10, "max": 30, "critical_high": 40, "critical_low": 8, "unit": "breaths/min"},
        "crt_sec": {"normal_max": 2.0, "critical_high": 2.5, "unit": "sec"}
    }
}

class VeterinaryRuleEngine:
    """
    Deterministic rule engine for species-specific triage categorization.
    Evaluates physiological vital signs, symptom presentation, and warning signs.
    """

    @classmethod
    def evaluate_triage(
        cls,
        species: str,
        symptoms_raw: str,
        vitals: Optional[Dict[str, Any]] = None,
        duration_text: Optional[str] = None,
        red_flags: Optional[List[str]] = None,
        age_category: Optional[str] = None,
        history: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Computes structured veterinary triage evaluation.
        Returns:
            - urgency_category: CRITICAL | EMERGENT | URGENT | ROUTINE | UNCERTAIN
            - urgency_code: RED | YELLOW | GREEN | UNCERTAIN
            - reasons: List of clinical trigger explanations
            - flags: List of triggered safety flags
            - critical_actions: Immediate stabilization and transport instructions (NO drugs)
            - missing_info: List of identified diagnostic and clinical blind spots
            - is_uncertain: Boolean flag
            - disclaimer: Regulatory notice
        """
        species_clean = (species or "").strip().lower()
        vitals = vitals or {}
        red_flags = red_flags or []
        symptoms_raw = (symptoms_raw or "").strip()
        history = (history or "").strip()

        # Step 1: Check Species Support
        if species_clean not in SUPPORTED_SPECIES:
            if species_clean in BETA_SPECIES:
                return cls._build_beta_species_response(species_clean, symptoms_raw)
            else:
                return cls._build_unsupported_species_response(species_clean)

        # Step 2: Validate symptom text presence
        if len(symptoms_raw) < 3:
            return {
                "urgency_category": "UNCERTAIN",
                "urgency_code": "UNCERTAIN",
                "classification": "Insufficient Clinical Information",
                "reasons": ["Symptom description is blank or insufficiently detailed for safety triage."],
                "flags": ["INSUFFICIENT_SYMPTOM_DATA"],
                "critical_actions": [
                    "Record comprehensive presenting complaints (duration, feed intake, demeanor).",
                    "Contact Registered Veterinary Officer for in-person triage examination."
                ],
                "missing_info": [
                    {"field": "symptoms_raw", "title": "Detailed Symptom Narrative", "reason": "Required for algorithmic safety evaluation."}
                ],
                "is_uncertain": True,
                "disclaimer": VETERINARY_DISCLAIMER
            }

        text_lower = f"{symptoms_raw.lower()} {history.lower()}"
        reasons: List[str] = []
        flags: List[str] = []
        critical_actions: List[str] = []

        # Step 3: Species-Specific Vital Sign Outlier Checks
        ref = SPECIES_REFERENCE_INTERVALS.get(species_clean, {})
        temp = vitals.get("temperature")
        hr = vitals.get("heart_rate")
        rr = vitals.get("respiration_rate")
        crt = vitals.get("crt_sec")
        mm = (vitals.get("mucous_membrane_color") or "").lower()

        # Check Mucous Membrane Color (Universal Veterinary Perfusion Marker)
        if any(color in mm for color in ["cyanotic", "blue", "purple"]):
            flags.append("VET_CYANOSIS_HYPOXIA")
            reasons.append("Severe cyanosis / blue mucous membranes indicate critical systemic hypoxemia.")
        elif any(color in mm for color in ["pale", "white", "blanched"]):
            flags.append("VET_PALLOR_SHOCK")
            reasons.append("Pale or white mucous membranes indicate severe blood loss, extreme anemia, or hypovolemic shock.")
        elif any(color in mm for color in ["brick red", "injected", "congested"]):
            flags.append("VET_SEPTIC_HYPEREMIA")
            reasons.append("Brick-red mucous membranes indicate systemic vasodilation / septic shock.")
        elif "icteric" in mm or "yellow" in mm:
            flags.append("VET_ICTERUS_JAUNDICE")
            reasons.append("Icteric / yellow mucous membranes indicate acute hepatic disease or intravascular hemolysis.")

        # Check CRT
        if crt is not None:
            try:
                crt_val = float(crt)
                if crt_val > ref.get("crt_sec", {}).get("critical_high", 2.5):
                    flags.append("VET_PROLONGED_CRT_SHOCK")
                    reasons.append(f"Capillary Refill Time prolonged ({crt_val}s > 2.0s), indicating compromised peripheral perfusion / shock.")
            except (ValueError, TypeError):
                pass

        # Check Temperature
        if temp is not None:
            try:
                temp_val = float(temp)
                temp_crit = ref.get("temp_f", {})
                if temp_val >= temp_crit.get("critical_high", 104.5):
                    flags.append("VET_CRITICAL_HYPERTHERMIA")
                    reasons.append(f"Critical hyperthermia / pyrexia ({temp_val}°F), risk of heat stroke or fulminant septic crisis.")
                elif temp_val <= temp_crit.get("critical_low", 99.0):
                    flags.append("VET_CRITICAL_HYPOTHERMIA")
                    reasons.append(f"Severe hypothermia ({temp_val}°F), indicating circulatory collapse, coma, or late-stage milk fever.")
                elif temp_val > temp_crit.get("max", 102.8):
                    flags.append("VET_FEVER_PYREXIA")
                    reasons.append(f"Elevated rectal temperature ({temp_val}°F) consistent with systemic febrile response.")
            except (ValueError, TypeError):
                pass

        # Check Respiration Rate
        if rr is not None:
            try:
                rr_val = float(rr)
                rr_crit = ref.get("respiration_bpm", {})
                if rr_val >= rr_crit.get("critical_high", 50):
                    flags.append("VET_SEVERE_TACHYPNEA")
                    reasons.append(f"Severe tachypnea / respiratory distress ({rr_val} breaths/min).")
                elif rr_val <= rr_crit.get("critical_low", 10):
                    flags.append("VET_BRADYPNEA_DEPRESSION")
                    reasons.append(f"Depressed respiratory rate ({rr_val} breaths/min) indicating CNS or metabolic depression.")
            except (ValueError, TypeError):
                pass

        # Check Heart Rate
        if hr is not None:
            try:
                hr_val = float(hr)
                hr_crit = ref.get("heart_rate_bpm", {})
                if hr_val >= hr_crit.get("critical_high", 100):
                    flags.append("VET_SEVERE_TACHYCARDIA")
                    reasons.append(f"Severe tachycardia ({hr_val} bpm) reflecting acute pain, shock, or severe dehydration.")
            except (ValueError, TypeError):
                pass

        # Step 4: Species-Specific Clinical Pathology & Syndrome Evaluation
        if species_clean == "cattle":
            cls._evaluate_cattle_syndromes(text_lower, red_flags, flags, reasons, critical_actions)
        elif species_clean == "dog":
            cls._evaluate_canine_syndromes(text_lower, red_flags, age_category, flags, reasons, critical_actions)

        # Step 5: Detect Missing Information Gaps
        missing_info = cls.detect_missing_info(species_clean, symptoms_raw, vitals, duration_text, history)

        # Step 6: Determine Urgency Category (CRITICAL, EMERGENT, URGENT, ROUTINE)
        critical_flag_indicators = {
            "VET_CYANOSIS_HYPOXIA", "VET_CRITICAL_HYPOTHERMIA", "VET_BOVINE_ACUTE_TYMPANY_DYSPNEA",
            "VET_CANINE_GDV_SUSPECT", "VET_STATUS_EPILEPTICUS", "VET_MASSIVE_HEMORRHAGE", "VET_CHOKING_ESOPHAGEAL"
        }
        emergent_flag_indicators = {
            "VET_PALLOR_SHOCK", "VET_SEPTIC_HYPEREMIA", "VET_PROLONGED_CRT_SHOCK", "VET_CRITICAL_HYPERTHERMIA",
            "VET_BOVINE_DOWNER_COW", "VET_BOVINE_ENDOTOXIC_MASTITIS", "VET_CANINE_PARVO_HEMORRHAGIC",
            "VET_URETHRAL_OBSTRUCTION", "VET_TOXIN_INGESTION_SUSPECT", "VET_SEVERE_TACHYPNEA"
        }
        urgent_flag_indicators = {
            "VET_FEVER_PYREXIA", "VET_ICTERUS_JAUNDICE", "VET_PERSISTENT_VOMITING", "VET_SEVERE_LAMENESS",
            "VET_PINKEYE_CORNEAL", "VET_MODERATE_DEHYDRATION", "VET_SEVERE_TACHYCARDIA"
        }

        has_critical = any(f in flags for f in critical_flag_indicators)
        has_emergent = any(f in flags for f in emergent_flag_indicators)
        has_urgent = any(f in flags for f in urgent_flag_indicators)

        if has_critical:
            urgency_category = "CRITICAL"
            urgency_code = "RED"
            classification = "Resuscitation / Immediate Life Threat"
            if not critical_actions:
                critical_actions.extend([
                    "IMMEDIATE EMERGENCY: Dispatch or transport directly to nearest Veterinary Hospital / Emergency Ward.",
                    "Maintain patent airway, keep animal recumbent on sternum (sternal position) if breathing is compromised.",
                    "Do NOT attempt unguided trocharization, forced oral feeding, or medication.",
                    "Ensure immediate IV access and oxygen support upon arrival at veterinary clinic."
                ])
        elif has_emergent:
            urgency_category = "EMERGENT"
            urgency_code = "RED"
            classification = "Emergent / Rapid Deterioration Risk"
            critical_actions.extend([
                "Urgent evaluation required by Veterinary Officer within 15–30 minutes.",
                "Isolate animal in quiet, shaded stall or kennel with comfortable bedding.",
                "Withhold solid food; do not force water if vomiting or bloated.",
                "Prepare for intravenous fluid stabilization and diagnostic blood/fecal workup."
            ])
        elif has_urgent or len(flags) > 0:
            urgency_category = "URGENT"
            urgency_code = "YELLOW"
            classification = "Urgent / Veterinary Examination within 1-2 Hours"
            critical_actions.extend([
                "Schedule evaluation by Registered Veterinary Officer within 1–2 hours.",
                "Monitor rectal temperature and hydration status every 30 minutes.",
                "Ensure clean drinking water is accessible unless animal is actively vomiting.",
                "Keep separate from other herd or household animals to prevent infectious spread."
            ])
        else:
            # Check if duration or presentation implies routine care
            urgency_category = "ROUTINE"
            urgency_code = "GREEN"
            classification = "Routine / Standard Outpatient Care"
            reasons.append("Vitals within physiological baseline limits; no acute red flag triggers identified.")
            critical_actions.extend([
                "Standard veterinary outpatient consultation or scheduled vaccination check.",
                "Maintain standard nutrition, clean drinking water, and biosecurity precautions.",
                "Monitor for any change in appetite, rumination, or energy levels over next 24 hours."
            ])

        # Step 7: Deduplicate lists
        reasons = list(dict.fromkeys(reasons))
        flags = list(dict.fromkeys(flags))
        critical_actions = list(dict.fromkeys(critical_actions))

        return {
            "urgency_category": urgency_category,
            "urgency_code": urgency_code,
            "classification": classification,
            "reasons": reasons,
            "flags": flags,
            "critical_actions": critical_actions,
            "missing_info": missing_info,
            "is_uncertain": False,
            "species": species_clean,
            "disclaimer": VETERINARY_DISCLAIMER
        }

    @classmethod
    def _evaluate_cattle_syndromes(
        cls, text: str, red_flags: List[str], flags: List[str], reasons: List[str], actions: List[str]
    ):
        """Species-specific bovine clinical evaluation rules"""
        # 1. Acute Ruminal Tympany (Bloat) with Respiratory Compromise (CRITICAL)
        bloat_keywords = ["bloat", "tympany", "swollen left flank", "rumen distension", "distended abdomen", "ପେଟ ଫୁଲିବା", "पेट फूलना"]
        dyspnea_keywords = ["difficulty breathing", "open mouth breathing", "gasping", "grunting", "tongue protruding", "dyspnea", "ଶ୍ୱାସକଷ୍ଟ", "सांस लेने में तकलीफ"]

        has_bloat = any(k in text for k in bloat_keywords) or any("bloat" in rf.lower() for rf in red_flags)
        has_resp_compromise = any(k in text for k in dyspnea_keywords) or any("respiratory" in rf.lower() for rf in red_flags)

        if has_bloat and has_resp_compromise:
            flags.append("VET_BOVINE_ACUTE_TYMPANY_DYSPNEA")
            reasons.append("Acute ruminal tympany (bloat) with secondary respiratory compromise — severe risk of suffocation and cardiac failure.")
            actions.append("EMERGENCY BLOAT: Keep animal standing if possible with head elevated; avoid downhill posture.")
            actions.append("Transport immediately to Veterinary Dispensary or call emergency mobile veterinary service for stomach tube / cannula decompression.")
        elif has_bloat:
            flags.append("VET_BOVINE_RUMINAL_TYMPANY")
            reasons.append("Marked ruminal tympany (bloat) identified; requires prompt decompression evaluation.")
            actions.append("Monitor left paralumbar fossa distension closely; avoid fermentable green leguminous fodder.")

        # 2. Downer Cow / Recumbency / Milk Fever (EMERGENT)
        recumbency_keywords = ["downer", "unable to stand", "cannot stand", "lying down unable to rise", "down cow", "recumbent", "ଉଠିପାରୁନାହିଁ", "खड़ा नहीं हो पा रहा"]
        if any(k in text for k in recumbency_keywords) or any("downer" in rf.lower() for rf in red_flags):
            flags.append("VET_BOVINE_DOWNER_COW")
            reasons.append("Inability to rise / prolonged recumbency in cattle (Downer cow syndrome / hypocalcemia / spinal injury).")
            actions.append("Provide thick, dry straw bedding under animal to prevent pressure sores and decubital necrosis.")
            actions.append("Roll animal side-to-side every 2 hours if recumbent; keep in sternal position.")

        # 3. Acute Toxic Mastitis (EMERGENT)
        mastitis_keywords = ["mastitis", "swollen udder", "cold quarter", "black teat", "watery milk with clots", "udder hard and hot", "ଖିର ଖରାପ", "थन में सूजन"]
        if any(k in text for k in mastitis_keywords) or any("mastitis" in rf.lower() for rf in red_flags):
            flags.append("VET_BOVINE_ENDOTOXIC_MASTITIS")
            reasons.append("Signs of acute / gangrenous or endotoxic mastitis with systemic compromise.")
            actions.append("Segregate affected cow from milking parlor; strip affected quarter frequently into disinfectant container.")

        # 4. Choking / Esophageal Obstruction (CRITICAL)
        choke_keywords = ["choking", "choke", "salivating profusely", "head and neck extended", "coughing while eating", "coughing feed"]
        if any(k in text for k in choke_keywords):
            flags.append("VET_CHOKING_ESOPHAGEAL")
            reasons.append("Suspected esophageal obstruction / choke; high risk of secondary ruminal bloat and aspiration.")
            actions.append("Remove all food and water immediately. Do NOT massage esophagus roughly or force oral fluids.")

        # 5. Keratoconjunctivitis / Pinkeye (URGENT)
        pinkeye_keywords = ["pinkeye", "cloudy eye", "corneal opacity", "eye ulcer", "white spot in eye", "lacrimation", "ଆଖି ଧଳା"]
        if any(k in text for k in pinkeye_keywords):
            flags.append("VET_PINKEYE_CORNEAL")
            reasons.append("Corneal opacity / infectious bovine keratoconjunctivitis (Pinkeye) suspect.")
            actions.append("Shield animal from direct sunlight and fly exposure; inspect for foreign grass awns.")

        # 6. Massive Bleeding / Prolapse (CRITICAL)
        hemorrhage_keywords = ["prolapse", "uterine prolapse", "vaginal prolapse", "heavy bleeding", "continuous bleeding"]
        if any(k in text for k in hemorrhage_keywords):
            flags.append("VET_MASSIVE_HEMORRHAGE")
            reasons.append("Acute pelvic prolapse or active hemorrhage requiring emergency surgical reduction.")
            actions.append("Keep prolapsed tissue protected with clean moist cloth; do NOT let animal walk on rough ground.")

    @classmethod
    def _evaluate_canine_syndromes(
        cls, text: str, red_flags: List[str], age_category: Optional[str],
        flags: List[str], reasons: List[str], actions: List[str]
    ):
        """Species-specific canine clinical evaluation rules"""
        # 1. Gastric Dilatation-Volvulus (GDV) / Bloat (CRITICAL)
        gdv_keywords = ["non-productive retching", "dry heaving", "swollen stomach", "pacing and retching", "gdv", "twisted stomach", "trying to vomit nothing coming out"]
        if any(k in text for k in gdv_keywords) or any("gdv" in rf.lower() for rf in red_flags):
            flags.append("VET_CANINE_GDV_SUSPECT")
            reasons.append("Presentation highly suspicious for Gastric Dilatation-Volvulus (GDV) — surgical emergency requiring immediate decompression.")
            actions.append("CRITICAL GDV SUSPECT: Transport immediately to veterinary facility with surgical capacity.")
            actions.append("Minimize stress and movement; do NOT attempt home stomach pumping or feeding.")

        # 2. Status Epilepticus / Cluster Seizures (CRITICAL)
        seizure_keywords = ["seizure", "convulsions", "continuous fits", "status epilepticus", "fitting for 5 minutes", "cluster seizures", "ଚେତା ହରାଇବା"]
        if any(k in text for k in seizure_keywords) or any("seizure" in rf.lower() for rf in red_flags):
            flags.append("VET_STATUS_EPILEPTICUS")
            reasons.append("Active or cluster seizure activity presenting risk of hyperthermia, brain injury, or respiratory arrest.")
            actions.append("Do NOT put hands inside animal's mouth (animals cannot swallow their tongue).")
            actions.append("Dim ambient lighting, reduce noise, and pad surroundings to prevent head injury.")

        # 3. Acute Hemorrhagic Diarrhea / Suspected Canine Parvovirus (EMERGENT)
        parvo_keywords = ["bloody diarrhea", "hemorrhagic diarrhea", "foul smelling loose stool", "parvo", "bloody stool and vomiting", "parvovirus", "ରକ୍ତ ଝାଡ଼ା"]
        is_young = age_category and any(y in age_category.lower() for y in ["puppy", "young", "<1 year", "months"])
        if any(k in text for k in parvo_keywords) or any("parvo" in rf.lower() for rf in red_flags):
            flags.append("VET_CANINE_PARVO_HEMORRHAGIC")
            reasons.append("Acute hemorrhagic gastroenteritis / suspected Canine Parvoviral Enteritis with severe dehydration risk.")
            actions.append("Strict isolation required: highly contagious to other dogs via fomites.")
            actions.append("Do NOT administer human NSAIDs or oral anti-diarrheal drugs; prepare for sterile IV rehydration.")

        # 4. Urethral Obstruction / Blocked Bladder (EMERGENT)
        urinary_keywords = ["straining to pee", "cannot urinate", "crying while peeing", "bloody drops of urine", "blocked bladder", "posturing to urinate nothing"]
        if any(k in text for k in urinary_keywords) or any("urinary" in rf.lower() for rf in red_flags):
            flags.append("VET_URETHRAL_OBSTRUCTION")
            reasons.append("Straining to urinate with minimal or zero flow indicates possible urethral obstruction / urolithiasis.")
            actions.append("Prevent jumping or pressure on lower abdomen; proceed to clinic for catheterization assessment.")

        # 5. Suspected Toxin / Poison Ingestion (EMERGENT)
        toxin_keywords = ["poison", "rat poison", "rodenticide", "ate chocolate", "organophosphate", "insecticide", "snake bite", "বিষ"]
        if any(k in text for k in toxin_keywords) or any("toxin" in rf.lower() for rf in red_flags):
            flags.append("VET_TOXIN_INGESTION_SUSPECT")
            reasons.append("Suspected toxicant ingestion or envenomation requiring immediate antidote and decontamination evaluation.")
            actions.append("Bring packaging, chemical label, or sample of suspected toxin to the clinic if safe to handle.")
            actions.append("Do NOT induce vomiting with salt or chemicals without explicit veterinary telephone instructions.")

        # 6. Persistent Vomiting & Dehydration (URGENT)
        vomiting_keywords = ["vomiting for 2 days", "vomiting repeatedly", "persistent vomiting", "cannot keep water down", "ଅନବରତ ବାନ୍ତି"]
        if any(k in text for k in vomiting_keywords):
            flags.append("VET_PERSISTENT_VOMITING")
            reasons.append("Persistent vomiting presenting dehydration and electrolyte disturbance.")
            actions.append("Remove food bowl for 2 hours; provide small ice cubes instead of large bowls of water.")

        # 7. Severe Lameness (URGENT)
        lameness_keywords = ["cannot put leg down", "non weight bearing", "crying in leg pain", "fracture suspect", "broken leg"]
        if any(k in text for k in lameness_keywords):
            flags.append("VET_SEVERE_LAMENESS")
            reasons.append("Acute non-weight bearing lameness or suspected orthopedic trauma.")
            actions.append("Confine movement in small crate or leash; support body with blanket sling during transport.")

    @classmethod
    def detect_missing_info(
        cls,
        species: str,
        symptoms_raw: str,
        vitals: Optional[Dict[str, Any]] = None,
        duration_text: Optional[str] = None,
        history: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """Identifies diagnostic blind spots and prompts the veterinary practitioner"""
        vitals = vitals or {}
        history = (history or "").lower()
        symptoms_lower = (symptoms_raw or "").lower()
        duration_lower = (duration_text or "").lower()
        missing: List[Dict[str, str]] = []

        # 1. Symptom duration
        has_duration = any(d in duration_lower or d in symptoms_lower for d in ["hour", "day", "week", "since", "yesterday", "ଘଣ୍ଟା", "ଦିନ"])
        if not has_duration:
            missing.append({
                "field": "duration",
                "title": "Onset Timing & Duration Marker",
                "reason": "Crucial to differentiate hyperacute surgical emergencies from chronic metabolic disorders."
            })

        # 2. Species-Specific Core Vitals
        if vitals.get("temperature") is None:
            missing.append({
                "field": "vitals.temperature",
                "title": "Rectal Temperature (°F)",
                "reason": "Critical baseline to detect systemic sepsis, pyrexia, or hypothermic collapse."
            })

        if vitals.get("mucous_membrane_color") is None:
            missing.append({
                "field": "vitals.mucous_membrane_color",
                "title": "Mucous Membrane Color (Gums / Conjunctiva)",
                "reason": "Essential field assessment for peripheral perfusion, shock, and anemia."
            })

        # 3. Vaccination History
        if "vaccin" not in history and "ṭikā" not in history and "टीका" not in history:
            if species == "dog":
                missing.append({
                    "field": "history.vaccination",
                    "title": "Core Canine Vaccination Status (DHPPi / Rabies)",
                    "reason": "Essential to evaluate Parvovirus and Rabies risk profiles."
                })
            elif species == "cattle":
                missing.append({
                    "field": "history.vaccination",
                    "title": "Bovine Vaccination Status (FMD / HS / BQ / Anthrax)",
                    "reason": "Required for syndromic surveillance against national notifiable livestock diseases."
                })

        # 4. Species-Specific Inquiries
        if species == "cattle":
            if "ruminat" not in history and "cud" not in history and "feed" not in history:
                missing.append({
                    "field": "history.rumination",
                    "title": "Rumination & Cud Chewing Activity",
                    "reason": "Indicates ruminal motility and foregut metabolic function."
                })
        elif species == "dog":
            if "deworm" not in history and "worm" not in history:
                missing.append({
                    "field": "history.deworming",
                    "title": "Routine Deworming History",
                    "reason": "Relevant for gastrointestinal and parasitic anemia differential diagnosis."
                })

        return missing

    @classmethod
    def _build_beta_species_response(cls, species: str, symptoms_raw: str) -> Dict[str, Any]:
        """Handles upcoming beta species (cats, buffaloes, goats) with safe uncertainty state"""
        species_display = species.capitalize()
        return {
            "urgency_category": "UNCERTAIN",
            "urgency_code": "UNCERTAIN",
            "classification": f"Uncertain State: {species_display} (Beta Species)",
            "reasons": [
                f"{species_display} is currently classified under Beta Species in this MVP version.",
                "Species-specific physiological thresholds and drug contraindication rules are currently under veterinary panel review.",
                "Automated categorization suspended to prevent unsafe species cross-application."
            ],
            "flags": ["VET_BETA_SPECIES_UNCERTAINTY"],
            "critical_actions": [
                f"Obtain direct in-person evaluation by a Registered Veterinary Officer qualified in {species_display} medicine.",
                "Do NOT apply canine or bovine drug dosages, antiseptic washes, or triage algorithms to this animal.",
                "Isolate animal in quiet, temperature-regulated stall/carrier."
            ],
            "missing_info": [
                {
                    "field": "species_clearance",
                    "title": f"Veterinary Panel Validation for {species_display}",
                    "reason": "Pending formal clinical calibration in AROGYA-TRIAGE Engine v2.1."
                }
            ],
            "is_uncertain": True,
            "species": species,
            "disclaimer": VETERINARY_DISCLAIMER
        }

    @classmethod
    def _build_unsupported_species_response(cls, species: str) -> Dict[str, Any]:
        """Handles completely unrecognized animal species safely"""
        return {
            "urgency_category": "UNCERTAIN",
            "urgency_code": "UNCERTAIN",
            "classification": "Unsupported Animal Species",
            "reasons": [
                f"The species '{species or 'Unknown'}' is outside the verified safety boundary of this triage system.",
                "The system explicitly refuses to guess clinical risk without verified species-specific physiological models."
            ],
            "flags": ["VET_UNSUPPORTED_SPECIES"],
            "critical_actions": [
                "Refer immediately to a specialized veterinary facility or wildlife/exotic animal veterinarian.",
                "Do not attempt automated triage or administration of unverified treatments."
            ],
            "missing_info": [
                {
                    "field": "species",
                    "title": "Recognized Veterinary Species Profile",
                    "reason": "System only accepts supported species (Cattle, Dog) and beta species (Cat, Buffalo, Goat)."
                }
            ],
            "is_uncertain": True,
            "species": species,
            "disclaimer": VETERINARY_DISCLAIMER
        }
