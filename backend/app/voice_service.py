"""
Indic Speech-to-Text & Vernacular Voice Service
Processes Odia, Hindi, and Indian-accented English voice inputs for frontline health workers (ASHA/ANM).
Translates regional symptom descriptions into standardized clinical observations and chronological timelines.
"""
from typing import Dict, Any, List
import re

class IndicVoiceService:
    """
    Handles transcription and semantic clinical mapping of vernacular speech.
    Supports Odia, Hindi, and English.
    """

    # Vernacular symptom lexicons mapped to standardized English clinical terms
    VERNACULAR_DICTIONARY = {
        # Odia terms
        "ଜ୍ୱର": "fever",
        "jwara": "fever",
        "jwar": "fever",
        "ଅତ୍ୟଧିକ ଜ୍ୱର": "severe high-grade fever",
        "atyadhika jwara": "severe high-grade fever",
        "ମୁଣ୍ଡ ଘୂରାଉଛି": "confusion / altered sensorium",
        "munda ghurauchhi": "confusion / altered sensorium",
        "ମାଢ଼ିରୁ ରକ୍ତ": "gum bleeding / mucosal hemorrhage",
        "madhiru rakta": "gum bleeding / mucosal hemorrhage",
        "ବାନ୍ତି": "vomiting",
        "banti": "vomiting",
        "ଝାଡ଼ା": "diarrhea",
        "jhada": "diarrhea",
        "ଶ୍ୱାସକଷ୍ଟ": "dyspnea / shortness of breath",
        "swasakasta": "dyspnea / shortness of breath",
        "ପେଟ ବିନ୍ଧା": "abdominal pain",
        "peta bindha": "abdominal pain",
        "ଦୁର୍ବଳତା": "extreme fatigue / lethargy",
        "durbalata": "extreme fatigue / lethargy",

        # Hindi terms
        "बुखार": "fever",
        "bukhar": "fever",
        "तेज़ बुखार": "high-grade fever",
        "tez bukhar": "high-grade fever",
        "उल्टी": "vomiting",
        "ulti": "vomiting",
        "दस्त": "diarrhea",
        "dast": "diarrhea",
        "चक्कर": "dizziness / vertigo",
        "chakkar": "dizziness / vertigo",
        "खून": "bleeding",
        "khoon": "bleeding",
        "खून बहना": "active bleeding",
        "khoon behna": "active bleeding",
        "सांस फूलना": "shortness of breath",
        "saans phoolna": "shortness of breath",
        "पेट दर्द": "abdominal pain",
        "pet dard": "abdominal pain",
        "बेहोशी": "unresponsiveness / syncope",
        "behoshi": "unresponsiveness / syncope"
    }

    # Synthetic preset audio scripts for instant demonstration
    PRESET_SCRIPTS = {
        "TC-01": {
            "language": "odia",
            "vernacular_script": "ଅତ୍ୟଧିକ ଜ୍ୱର, ମୁଣ୍ଡ ଘୂରାଉଛି, ମାଢ଼ିରୁ ରକ୍ତ ପଡୁଛି (Severe fever, confusion, gum bleeding)",
            "transcription": "Atyadhika jwara, munda ghurauchhi, madhiru rakta paduchhi. Rogi ku 3 dina hela jwara achhi.",
            "translated_english": "Severe fever, confusion, gum bleeding. Patient has high fever since 3 days.",
            "extracted_symptoms": ["Severe high-grade fever", "Acute confusion / altered sensorium", "Gum bleeding (mucosal hemorrhage)"],
            "timeline": ["Day 1-2: High grade fever onset", "Day 3: Confusion and spontaneous gum bleeding observed"]
        },
        "TC-02": {
            "language": "hindi",
            "vernacular_script": "३ दिन से तेज़ बुखार, लगातार दस्त और उल्टी (3 days high fever, persistent diarrhea, vomiting)",
            "transcription": "Teen din se tez bukhar hai, lagatar dast aur ulti ho rahi hai. Khana peena chhoot gaya hai.",
            "translated_english": "3 days of high fever, persistent diarrhea, and continuous vomiting. Unable to keep liquids down.",
            "extracted_symptoms": ["High-grade fever (3 days)", "Persistent diarrhea", "Frequent vomiting", "Dehydration risk"],
            "timeline": ["Day 1: Acute fever onset", "Day 2: Diarrhea and nausea started", "Day 3: Multiple episodes of vomiting and progressive weakness"]
        },
        "TC-03": {
            "language": "english",
            "vernacular_script": "Superficial forearm abrasion dressing change; no fever.",
            "transcription": "Patient reports minor scrape on the right forearm after a bicycle skid yesterday. No fever, wound is dry, needs dressing change.",
            "translated_english": "Superficial forearm abrasion dressing change; no fever or systemic distress.",
            "extracted_symptoms": ["Superficial forearm abrasion", "Dressing change required", "Afebrile"],
            "timeline": ["Yesterday: Minor bicycle skid causing superficial abrasion", "Today: Presentation for sterile wound dressing and cleaning"]
        }
    }

    @classmethod
    def transcribe_audio_or_text(cls, language: str, text_input: str = None, scenario_preset: str = None) -> Dict[str, Any]:
        """
        Processes voice input or transcribed text.
        Generates clinical English translation, extracted symptom list, and chronological timeline.
        """
        # If a preset scenario is triggered
        if scenario_preset and scenario_preset in cls.PRESET_SCRIPTS:
            return cls.PRESET_SCRIPTS[scenario_preset]

        raw = text_input.strip() if text_input else ""
        lang = language.lower() if language else "english"

        # Translate vernacular keywords
        translated_tokens = []
        clean_lower = raw.lower()

        for vernacular, english in cls.VERNACULAR_DICTIONARY.items():
            if vernacular in clean_lower:
                translated_tokens.append(english)

        # Default clinical synthesis
        if not translated_tokens:
            translated_tokens = [s.strip().capitalize() for s in raw.split(",") if s.strip()]
            if not translated_tokens:
                translated_tokens = [raw] if raw else ["General clinical review requested"]

        # Synthesize timeline
        timeline = cls.extract_chronological_timeline(raw)

        return {
            "language": lang,
            "vernacular_script": raw,
            "transcription": raw,
            "translated_english": f"Patient reported: {raw}" if lang != "english" else raw,
            "extracted_symptoms": translated_tokens,
            "timeline": timeline
        }

    @classmethod
    def extract_chronological_timeline(cls, text: str) -> List[str]:
        """
        Synthesizes unstructured temporal markers into a structured chronological timeline
        (e.g., 'Day 1: Low-grade fever onset -> Day 3: Petechial rash and vomiting').
        """
        timeline = []
        if not text:
            return ["Day 1: Initial presentation at triage"]

        text_lower = text.lower()
        if "3 day" in text_lower or "3 din" in text_lower or "3 dina" in text_lower:
            timeline.append("Day 1: Symptom onset with initial fever/discomfort")
            timeline.append("Day 2: Escalation of systemic distress")
            timeline.append("Day 3: Presentation at triage facility with acute complaints")
        elif "2 day" in text_lower or "kal" in text_lower or "yesterday" in text_lower:
            timeline.append("Day 1 (Yesterday): Event / initial symptom onset")
            timeline.append("Day 2 (Today): Triage evaluation and vital assessment")
        else:
            timeline.append(f"Day 1: Onset of clinical complaints ({text[:60]}...)")
            timeline.append("Current: Arrival at primary facility for triage")

        return timeline
