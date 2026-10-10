"""
Transactional Queue & SQLite State Storage for AROGYA-TRIAGE
Maintains patient triage records, priority live queue, and doctor override audit logs.
"""
import sqlite3
import json
import datetime
from typing import Dict, Any, List, Optional
from .config import DB_PATH

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes tables and indexes for low-latency priority ordering"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS triage_records (
                id TEXT PRIMARY KEY,
                patient_pseudonym TEXT NOT NULL,
                abha_id TEXT,
                facility_id TEXT NOT NULL,
                facility_name TEXT NOT NULL,
                district TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                vernacular_language TEXT,
                symptoms_raw TEXT,
                translated_english TEXT,
                symptoms_json TEXT,
                timeline_json TEXT,
                vitals_json TEXT,
                labs_json TEXT,
                lab_analysis_json TEXT,
                esi_level INTEGER NOT NULL,
                urgency_code TEXT NOT NULL,
                classification TEXT NOT NULL,
                reasons_json TEXT,
                flags_json TEXT,
                critical_actions_json TEXT,
                missing_info_json TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
                reviewer_doctor TEXT,
                reviewed_at TEXT,
                override_reason TEXT,
                previous_esi_level INTEGER,
                pii_redactions_json TEXT,
                lab_image_path TEXT,
                test_case_id TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS override_audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                record_id TEXT NOT NULL,
                previous_esi INTEGER NOT NULL,
                new_esi INTEGER NOT NULL,
                justification_reason TEXT NOT NULL,
                doctor_name TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (record_id) REFERENCES triage_records (id)
            )
        """)

        # Fast index for queue prioritization (ESI level ascending: 1, 2 first, then timestamp)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_triage_priority 
            ON triage_records (status, esi_level ASC, timestamp DESC)
        """)
        conn.commit()

class TriageDatabase:
    @staticmethod
    def save_record(record: Dict[str, Any]) -> str:
        rec_id = record.get("id")
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO triage_records (
                    id, patient_pseudonym, abha_id, facility_id, facility_name, district,
                    timestamp, vernacular_language, symptoms_raw, translated_english,
                    symptoms_json, timeline_json, vitals_json, labs_json, lab_analysis_json,
                    esi_level, urgency_code, classification, reasons_json, flags_json,
                    critical_actions_json, missing_info_json, status, reviewer_doctor,
                    reviewed_at, override_reason, previous_esi_level, pii_redactions_json,
                    lab_image_path, test_case_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rec_id,
                record.get("display_pseudonym", "Patient-ANON"),
                record.get("abha_id", f"91-{rec_id[:4]}-{rec_id[4:8]}-8842"),
                record.get("facility_id", "FAC-ROU-01"),
                record.get("facility", "CHC Panposh, Rourkela"),
                record.get("district", "Sundargarh (Rourkela)"),
                record.get("timestamp", datetime.datetime.now(datetime.timezone.utc).isoformat()),
                record.get("vernacular_language", "english"),
                record.get("symptoms_raw", ""),
                record.get("translated_english", ""),
                json.dumps(record.get("symptoms", [])),
                json.dumps(record.get("timeline", [])),
                json.dumps(record.get("vitals", {})),
                json.dumps(record.get("labs", {})),
                json.dumps(record.get("lab_analysis", {})),
                int(record.get("esi_level", 3)),
                record.get("urgency_code", "YELLOW"),
                record.get("classification", "Urgent Evaluation"),
                json.dumps(record.get("reasons", [])),
                json.dumps(record.get("flags", [])),
                json.dumps(record.get("critical_actions", [])),
                json.dumps(record.get("missing_info", [])),
                record.get("status", "PENDING_REVIEW"),
                record.get("reviewer_doctor"),
                record.get("reviewed_at"),
                record.get("override_reason"),
                record.get("previous_esi_level"),
                json.dumps(record.get("pii_redactions", [])),
                record.get("lab_image_path"),
                record.get("test_case_id")
            ))
            conn.commit()
        return rec_id

    @staticmethod
    def get_queue(status_filter: Optional[str] = None, district_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Returns priority-ordered triage queue:
        ESI Level 1 & 2 (RED) always at the top, followed by 3 (YELLOW), then 4 & 5 (GREEN).
        """
        query = "SELECT * FROM triage_records WHERE 1=1"
        params = []
        if status_filter and status_filter != "ALL":
            query += " AND status = ?"
            params.append(status_filter)
        if district_filter and district_filter != "ALL":
            query += " AND district = ?"
            params.append(district_filter)

        # Order by ESI level ascending (1 is highest emergency, 5 is routine), then timestamp descending
        query += " ORDER BY esi_level ASC, timestamp DESC"

        records = []
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            for row in cursor.fetchall():
                records.append(TriageDatabase._format_row(row))
        return records

    @staticmethod
    def get_record_by_id(rec_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM triage_records WHERE id = ?", (rec_id,))
            row = cursor.fetchone()
            if row:
                return TriageDatabase._format_row(row)
        return None

    @staticmethod
    def approve_record(rec_id: str, doctor_name: str) -> bool:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE triage_records 
                SET status = 'APPROVED', reviewer_doctor = ?, reviewed_at = ?
                WHERE id = ?
            """, (doctor_name, now, rec_id))
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def override_esi(rec_id: str, new_esi: int, reason: str, doctor_name: str) -> bool:
        """Mandatory audit logging of clinical overrides per PRD FR-3.3"""
        rec = TriageDatabase.get_record_by_id(rec_id)
        if not rec:
            return False

        old_esi = rec["esi_level"]
        urgency_code = "RED" if new_esi <= 2 else ("YELLOW" if new_esi == 3 else "GREEN")
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        with get_db() as conn:
            cursor = conn.cursor()
            # 1. Update record
            cursor.execute("""
                UPDATE triage_records
                SET esi_level = ?, urgency_code = ?, status = 'OVERRIDDEN',
                    previous_esi_level = ?, override_reason = ?,
                    reviewer_doctor = ?, reviewed_at = ?
                WHERE id = ?
            """, (new_esi, urgency_code, old_esi, reason, doctor_name, now, rec_id))

            # 2. Insert into immutable audit log
            cursor.execute("""
                INSERT INTO override_audit_log (
                    record_id, previous_esi, new_esi, justification_reason, doctor_name, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (rec_id, old_esi, new_esi, reason, doctor_name, now))

            conn.commit()
            return True

    @staticmethod
    def get_audit_logs() -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM override_audit_log ORDER BY timestamp DESC LIMIT 50")
            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def _format_row(row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "display_pseudonym": row["patient_pseudonym"],
            "abha_id": row["abha_id"],
            "facility_id": row["facility_id"],
            "facility": row["facility_name"],
            "district": row["district"],
            "timestamp": row["timestamp"],
            "vernacular_language": row["vernacular_language"],
            "symptoms_raw": row["symptoms_raw"],
            "translated_english": row["translated_english"],
            "symptoms": json.loads(row["symptoms_json"] or "[]"),
            "timeline": json.loads(row["timeline_json"] or "[]"),
            "vitals": json.loads(row["vitals_json"] or "{}"),
            "labs": json.loads(row["labs_json"] or "{}"),
            "lab_analysis": json.loads(row["lab_analysis_json"] or "{}"),
            "esi_level": row["esi_level"],
            "urgency_code": row["urgency_code"],
            "classification": row["classification"],
            "reasons": json.loads(row["reasons_json"] or "[]"),
            "flags": json.loads(row["flags_json"] or "[]"),
            "critical_actions": json.loads(row["critical_actions_json"] or "[]"),
            "missing_info": json.loads(row["missing_info_json"] or "[]"),
            "status": row["status"],
            "reviewer_doctor": row["reviewer_doctor"],
            "reviewed_at": row["reviewed_at"],
            "override_reason": row["override_reason"],
            "previous_esi_level": row["previous_esi_level"],
            "pii_redactions": json.loads(row["pii_redactions_json"] or "[]"),
            "lab_image_path": row["lab_image_path"],
            "test_case_id": row["test_case_id"]
        }
