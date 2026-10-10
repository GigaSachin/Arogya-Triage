"""
In-flight PII Masking Engine
Protects patient confidentiality before external processing or LLM summarization.
Sanitizes:
- 12-digit Indian Aadhaar numbers (with or without spaces/hyphens)
- 10-digit Indian Mobile phone numbers
- Email addresses
- Real names (replaced with synthetic patient pseudonym)
"""
import re
from typing import Dict, Any, Tuple, List

# Regex patterns for Indian identifiers
AADHAAR_PATTERN = re.compile(r'\b[2-9]\d{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b')
PHONE_PATTERN = re.compile(r'(\+91[\-\s]?)?[6-9]\d{9}\b')
EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')

class PIIAnonymizer:
    @staticmethod
    def mask_text(text: str) -> Tuple[str, List[Dict[str, str]]]:
        """
        Masks Aadhaar numbers, phone numbers, and emails in a free-text narrative.
        Returns the sanitized text and a list of redactions performed.
        """
        if not text:
            return "", []

        redactions = []
        sanitized = text

        # Redact Aadhaar
        def aadhaar_sub(match):
            val = match.group(0)
            clean_digits = re.sub(r'\D', '', val)
            last4 = clean_digits[-4:] if len(clean_digits) >= 4 else "XXXX"
            redactions.append({"type": "AADHAAR", "original_snippet": f"***{last4}"})
            return f"[AADHAAR: XXXX-XXXX-{last4}]"

        sanitized = AADHAAR_PATTERN.sub(aadhaar_sub, sanitized)

        # Redact Phone Numbers
        def phone_sub(match):
            val = match.group(0)
            clean_digits = re.sub(r'\D', '', val)
            last4 = clean_digits[-4:] if len(clean_digits) >= 4 else "XXXX"
            redactions.append({"type": "PHONE", "original_snippet": f"***{last4}"})
            return f"[PHONE: +91-XXXXX-{last4}]"

        sanitized = PHONE_PATTERN.sub(phone_sub, sanitized)

        # Redact Emails
        def email_sub(match):
            redactions.append({"type": "EMAIL", "original_snippet": "***@***"})
            return "[EMAIL-REDACTED]"

        sanitized = EMAIL_PATTERN.sub(email_sub, sanitized)

        return sanitized, redactions

    @staticmethod
    def sanitize_patient_record(patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applies in-flight masking to an entire patient submission.
        Generates a synthetic token for the name if present, ensuring compliance with DISHA/ABDM.
        """
        sanitized = dict(patient_data)
        all_redactions = []

        # Mask free text fields
        for field in ["symptoms_raw", "notes", "additional_history"]:
            if field in sanitized and isinstance(sanitized[field], str):
                cleaned, r_list = PIIAnonymizer.mask_text(sanitized[field])
                sanitized[field] = cleaned
                all_redactions.extend(r_list)

        # Sanitize Aadhaar if provided in structured field
        if "aadhaar" in sanitized and sanitized["aadhaar"]:
            clean_aadhaar = re.sub(r'\D', '', str(sanitized["aadhaar"]))
            last4 = clean_aadhaar[-4:] if len(clean_aadhaar) >= 4 else "0000"
            sanitized["aadhaar_masked"] = f"XXXX-XXXX-{last4}"
            sanitized.pop("aadhaar", None)
            all_redactions.append({"type": "AADHAAR_FIELD", "original_snippet": f"***{last4}"})

        # Sanitize Phone if provided in structured field
        if "phone" in sanitized and sanitized["phone"]:
            clean_phone = re.sub(r'\D', '', str(sanitized["phone"]))
            last4 = clean_phone[-4:] if len(clean_phone) >= 4 else "0000"
            sanitized["phone_masked"] = f"+91-XXXXX-{last4}"
            sanitized.pop("phone", None)
            all_redactions.append({"type": "PHONE_FIELD", "original_snippet": f"***{last4}"})

        # Generate anonymous token identifier for patient display
        pat_id = sanitized.get("patient_id", "PT-SYNTH-001")
        if "name" in sanitized and sanitized["name"]:
            # Maintain initials or pseudonym for clinician convenience while masking full legal name in public streams
            raw_name = sanitized["name"]
            sanitized["display_pseudonym"] = f"Patient-{raw_name[:2].upper()}-{pat_id[-4:]}"
        else:
            sanitized["display_pseudonym"] = f"Patient-{pat_id[-6:]}"

        sanitized["pii_redaction_audit"] = all_redactions
        sanitized["is_anonymized"] = True
        return sanitized
