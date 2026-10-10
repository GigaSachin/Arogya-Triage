"""
Configuration & Clinical Standards for AROGYA-TRIAGE
Aligned with ICMR/WHO triage norms, Ayushman Bharat Digital Mission (ABDM),
and Google BigQuery district syndromic surveillance specifications.
"""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PDF_DIR = DATA_DIR / "referrals"
PDF_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "arogya_triage.db"

# Regulatory Non-Diagnostic Disclaimer (Mandatory on all views and outputs)
REGULATORY_DISCLAIMER = (
    "ADVISORY ONLY: Decision-support tool for qualified medical personnel. "
    "Non-diagnostic. Does not replace professional clinical examination. "
    "Zero automated prescriptions permitted."
)

# BigQuery Enterprise Telemetry Configuration
BIGQUERY_PROJECT = "arogya-triage-prod"
BIGQUERY_DATASET = "health_surveillance_odisha"
BIGQUERY_TABLE = "district_triage_telemetry"

# District mapping for Odisha (Aligned with BPUT Hackathon & State Health Directorates)
ODISHA_DISTRICTS = [
    "Sundargarh (Rourkela)",
    "Khordha (Bhubaneswar)",
    "Cuttack",
    "Sambalpur",
    "Mayurbhanj",
    "Ganjam (Berhampur)",
    "Balasore",
    "Jharsuguda",
    "Koraput",
    "Puri"
]

FACILITIES = [
    {"id": "FAC-ROU-01", "name": "Community Health Center (CHC) Panposh, Rourkela", "district": "Sundargarh (Rourkela)", "type": "CHC"},
    {"id": "FAC-ROU-02", "name": "Ispat General Hospital (IGH) Casualty, Rourkela", "district": "Sundargarh (Rourkela)", "type": "District Hospital"},
    {"id": "FAC-BBSR-01", "name": "Primary Health Center (PHC) Chandrasekharpur", "district": "Khordha (Bhubaneswar)", "type": "PHC"},
    {"id": "FAC-BBSR-02", "name": "Capital Hospital Emergency Wing, Bhubaneswar", "district": "Khordha (Bhubaneswar)", "type": "District Hospital"},
    {"id": "FAC-CTC-01", "name": "SCB Medical College & Hospital Triage, Cuttack", "district": "Cuttack", "type": "Tertiary Medical College"},
    {"id": "FAC-IND-01", "name": "Rourkela Steel Plant Industrial Health Unit", "district": "Sundargarh (Rourkela)", "type": "Industrial Clinic"},
    {"id": "FAC-CAMP-01", "name": "BPUT Campus Health & Wellness Center", "district": "Sundargarh (Rourkela)", "type": "Campus Health"}
]

# Standard ICMR & WHO Clinical Reference Intervals for Lab Parameters
CLINICAL_REFERENCE_INTERVALS = {
    "platelets": {
        "name": "Platelet Count",
        "unit": "/µL",
        "normal_min": 150000,
        "normal_max": 450000,
        "critical_low": 20000,
        "severe_low": 50000,
        "moderate_low": 100000,
        "critical_flag": "CRITICAL_THROMBOCYTOPENIA",
        "description": "High hemorrhagic & dengue shock risk below 20,000/µL"
    },
    "hemoglobin": {
        "name": "Hemoglobin (Hb)",
        "unit": "g/dL",
        "normal_min": 12.0,
        "normal_max": 17.5,
        "critical_low": 7.0,
        "severe_low": 8.0,
        "moderate_low": 10.0,
        "critical_flag": "SEVERE_ANEMIA_ALERT",
        "description": "Immediate transfusion evaluation if Hb < 7.0 g/dL"
    },
    "wbc": {
        "name": "Total Leukocyte Count (TLC / WBC)",
        "unit": "/µL",
        "normal_min": 4000,
        "normal_max": 11000,
        "critical_high": 20000,
        "critical_low": 2000,
        "critical_flag": "SEVERE_SEPSIS_LEUKOCYTE_ANOMALY",
        "description": "Severe leukocytosis or leukopenia indicating severe systemic infection"
    },
    "fasting_blood_sugar": {
        "name": "Fasting Blood Sugar (FBS)",
        "unit": "mg/dL",
        "normal_min": 70,
        "normal_max": 100,
        "critical_high": 300,
        "critical_low": 50,
        "critical_flag": "METABOLIC_CRISIS_ALERT",
        "description": "DKA risk if > 300 mg/dL or severe hypoglycemia if < 50 mg/dL"
    },
    "serum_creatinine": {
        "name": "Serum Creatinine",
        "unit": "mg/dL",
        "normal_min": 0.6,
        "normal_max": 1.2,
        "critical_high": 3.0,
        "critical_flag": "ACUTE_KIDNEY_INJURY_ALERT",
        "description": "Marked renal impairment"
    },
    "total_bilirubin": {
        "name": "Total Bilirubin",
        "unit": "mg/dL",
        "normal_min": 0.2,
        "normal_max": 1.2,
        "critical_high": 5.0,
        "critical_flag": "HEPATIC_DYSFUNCTION_ALERT",
        "description": "Deep jaundice / acute liver failure signal"
    }
}

# Vital Signs Reference & Danger Thresholds
VITALS_THRESHOLDS = {
    "spo2": {
        "critical": 90,   # < 90% -> HYPOXEMIA_ALERT (ESI 2)
        "warning": 94     # < 94% -> Mild hypoxia
    },
    "pulse": {
        "critical_high": 130, # Severe tachycardia
        "warning_high": 100,  # Tachycardia
        "critical_low": 50    # Severe bradycardia
    },
    "systolic_bp": {
        "critical_low": 90,   # Hypotension / Shock
        "critical_high": 180  # Hypertensive crisis
    },
    "diastolic_bp": {
        "critical_low": 60,
        "critical_high": 110
    },
    "temperature": {
        "high_fever": 102.5,  # °F High-grade febrile
        "hyperpyrexia": 104.0 # °F Critical febrile
    },
    "respiration_rate": {
        "critical_high": 30,  # Tachypnea
        "critical_low": 10    # Bradypnea / Respiratory failure
    }
}
