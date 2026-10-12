"""
Transactional Queue & SQLite State Storage for AROGYA-TRIAGE
Maintains human patient and veterinary triage records, priority live queue, and clinician override audit logs.
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
    """Initializes tables and indexes for low-latency priority ordering with schema migration"""
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
                esi_level INTEGER,
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
                test_case_id TEXT,
                domain TEXT NOT NULL DEFAULT 'human',
                species TEXT,
                breed TEXT,
                age_category TEXT,
                animal_tag_or_name TEXT,
                owner_contact_masked TEXT,
                veterinary_guidance_json TEXT,
                is_uncertain INTEGER DEFAULT 0,
                urgency_category TEXT
            )
        """)

        # Schema migration check for existing databases
        cursor.execute("PRAGMA table_info(triage_records)")
        existing_cols = {row["name"] for row in cursor.fetchall()}
        
        new_columns = [
            ("domain", "TEXT NOT NULL DEFAULT 'human'"),
            ("species", "TEXT"),
            ("breed", "TEXT"),
            ("age_category", "TEXT"),
            ("animal_tag_or_name", "TEXT"),
            ("owner_contact_masked", "TEXT"),
            ("veterinary_guidance_json", "TEXT"),
            ("is_uncertain", "INTEGER DEFAULT 0"),
            ("urgency_category", "TEXT")
        ]
        
        for col_name, col_def in new_columns:
            if col_name not in existing_cols:
                try:
                    cursor.execute(f"ALTER TABLE triage_records ADD COLUMN {col_name} {col_def}")
                except Exception as e:
                    print(f"Migration note for {col_name}: {e}")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS override_audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                record_id TEXT NOT NULL,
                previous_esi INTEGER,
                new_esi INTEGER,
                justification_reason TEXT NOT NULL,
                doctor_name TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                domain TEXT DEFAULT 'human',
                previous_urgency TEXT,
                new_urgency TEXT,
                FOREIGN KEY (record_id) REFERENCES triage_records (id)
            )
        """)

        # Migration check for override_audit_log
        cursor.execute("PRAGMA table_info(override_audit_log)")
        audit_cols = {row["name"]: dict(row) for row in cursor.fetchall()}
        
        # Ensure previous_esi and new_esi are nullable for veterinary overrides
        if audit_cols.get("previous_esi", {}).get("notnull") == 1 or audit_cols.get("new_esi", {}).get("notnull") == 1:
            try:
                cursor.execute("""
                    CREATE TABLE override_audit_log_migrated (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        record_id TEXT NOT NULL,
                        previous_esi INTEGER,
                        new_esi INTEGER,
                        justification_reason TEXT NOT NULL,
                        doctor_name TEXT NOT NULL,
                        timestamp TEXT NOT NULL,
                        domain TEXT DEFAULT 'human',
                        previous_urgency TEXT,
                        new_urgency TEXT,
                        FOREIGN KEY (record_id) REFERENCES triage_records (id)
                    )
                """)
                cursor.execute("""
                    INSERT INTO override_audit_log_migrated (
                        id, record_id, previous_esi, new_esi, justification_reason, doctor_name, timestamp, domain, previous_urgency, new_urgency
                    ) SELECT id, record_id, previous_esi, new_esi, justification_reason, doctor_name, timestamp, 
                             COALESCE(domain, 'human'), previous_urgency, new_urgency
                    FROM override_audit_log
                """)
                cursor.execute("DROP TABLE override_audit_log")
                cursor.execute("ALTER TABLE override_audit_log_migrated RENAME TO override_audit_log")
            except Exception as e:
                print(f"Audit log migration exception: {e}")
        else:
            existing_audit_cols = set(audit_cols.keys())
            for col_name, col_def in [("domain", "TEXT DEFAULT 'human'"), ("previous_urgency", "TEXT"), ("new_urgency", "TEXT")]:
                if col_name not in existing_audit_cols:
                    try:
                        cursor.execute(f"ALTER TABLE override_audit_log ADD COLUMN {col_name} {col_def}")
                    except Exception as e:
                        pass

        # Fast index for queue prioritization (sort priority rank ascending, timestamp descending)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_triage_priority 
            ON triage_records (status, domain, esi_level ASC, timestamp DESC)
        """)
        conn.commit()

class TriageDatabase:
    @classmethod
    def clear_all(cls):
        """Clears all clinical and veterinary records from the queue and audit log."""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM triage_records")
            cursor.execute("DELETE FROM override_audit_log")
            conn.commit()

    @staticmethod
    def save_record(record: Dict[str, Any]) -> str:
        rec_id = record.get("id")
        domain = record.get("domain", "human")
        
        # Internal sort priority for SQLite indexing: 
        # Human uses esi_level (1-5).
        # Veterinary maps urgency category to priority index (1=CRITICAL, 2=EMERGENT, 3=URGENT, 4=UNCERTAIN, 5=ROUTINE)
        # Note: esi_level is ONLY populated if human or used as internal sort key
        sort_priority = record.get("esi_level")
        if sort_priority is None:
            vti = record.get("urgency_category", record.get("urgency_code", "ROUTINE")).upper()
            if "CRITICAL" in vti or "RESUSCITATION" in vti:
                sort_priority = 1
            elif "EMERGENT" in vti or "HIGH" in vti:
                sort_priority = 2
            elif "URGENT" in vti:
                sort_priority = 3
            elif "UNCERTAIN" in vti:
                sort_priority = 4
            else:
                sort_priority = 5

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
                    lab_image_path, test_case_id, domain, species, breed, age_category,
                    animal_tag_or_name, owner_contact_masked, veterinary_guidance_json,
                    is_uncertain, urgency_category
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rec_id,
                record.get("display_pseudonym", record.get("animal_tag_or_name", "ANON")),
                record.get("abha_id", f"91-{rec_id[:4]}-{rec_id[4:8]}-8842" if domain == "human" else None),
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
                sort_priority,
                record.get("urgency_code", "YELLOW"),
                record.get("classification", "Evaluation Required"),
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
                record.get("test_case_id"),
                domain,
                record.get("species"),
                record.get("breed"),
                record.get("age_category"),
                record.get("animal_tag_or_name"),
                record.get("owner_contact_masked"),
                json.dumps(record.get("veterinary_guidance", {})),
                1 if record.get("is_uncertain") else 0,
                record.get("urgency_category", record.get("urgency_code"))
            ))
            conn.commit()
        return rec_id

    @staticmethod
    def get_all_records() -> List[Dict[str, Any]]:
        """Returns all records across all domains and statuses"""
        return TriageDatabase.get_queue(status_filter="ALL", district_filter="ALL", domain_filter="ALL")

    @staticmethod
    def get_queue(
        status_filter: Optional[str] = "ALL", 
        district_filter: Optional[str] = "ALL",
        domain_filter: Optional[str] = "ALL"
    ) -> List[Dict[str, Any]]:
        """
        Returns priority-ordered triage queue:
        Emergent/Critical cases always at top, followed by Urgent, then Routine.
        Optionally filtered by status, district, and domain (human vs veterinary).
        """
        query = "SELECT * FROM triage_records WHERE 1=1"
        params = []
        if status_filter and status_filter != "ALL":
            query += " AND status = ?"
            params.append(status_filter)
        if district_filter and district_filter != "ALL":
            query += " AND district = ?"
            params.append(district_filter)
        if domain_filter and domain_filter != "ALL":
            query += " AND domain = ?"
            params.append(domain_filter)

        # Order by sort priority ascending (1 is highest emergency, 5 is routine), then timestamp descending
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
    def approve_record(rec_id: str, reviewer_name: str) -> bool:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE triage_records 
                SET status = 'APPROVED', reviewer_doctor = ?, reviewed_at = ?
                WHERE id = ?
            """, (reviewer_name, now, rec_id))
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def override_esi(rec_id: str, new_esi: int, reason: str, doctor_name: str) -> bool:
        """Mandatory audit logging of clinical overrides for human cases per PRD FR-3.3"""
        rec = TriageDatabase.get_record_by_id(rec_id)
        if not rec:
            return False

        old_esi = rec.get("esi_level")
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
                    record_id, previous_esi, new_esi, justification_reason, doctor_name, timestamp, domain
                ) VALUES (?, ?, ?, ?, ?, ?, 'human')
            """, (rec_id, old_esi, new_esi, reason, doctor_name, now))

            conn.commit()
            return True

    @staticmethod
    def override_veterinary_urgency(rec_id: str, new_urgency: str, reason: str, reviewer_name: str) -> bool:
        """Audit logging of veterinary triage category overrides by qualified veterinary officer"""
        rec = TriageDatabase.get_record_by_id(rec_id)
        if not rec:
            return False

        old_urgency = rec.get("urgency_category") or rec.get("urgency_code")
        
        urgency_upper = new_urgency.upper()
        if "CRITICAL" in urgency_upper:
            sort_priority = 1
            urgency_code = "RED"
        elif "EMERGENT" in urgency_upper:
            sort_priority = 2
            urgency_code = "RED"
        elif "URGENT" in urgency_upper:
            sort_priority = 3
            urgency_code = "YELLOW"
        else:
            sort_priority = 5
            urgency_code = "GREEN"

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE triage_records
                SET esi_level = ?, urgency_code = ?, urgency_category = ?, status = 'OVERRIDDEN',
                    override_reason = ?, reviewer_doctor = ?, reviewed_at = ?
                WHERE id = ?
            """, (sort_priority, urgency_code, urgency_upper, reason, reviewer_name, now, rec_id))

            cursor.execute("""
                INSERT INTO override_audit_log (
                    record_id, previous_urgency, new_urgency, justification_reason, doctor_name, timestamp, domain
                ) VALUES (?, ?, ?, ?, ?, ?, 'veterinary')
            """, (rec_id, str(old_urgency), urgency_upper, reason, reviewer_name, now))

            conn.commit()
            return True

    @staticmethod
    def get_audit_logs(domain_filter: Optional[str] = "ALL") -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            if domain_filter and domain_filter != "ALL":
                cursor.execute("""
                    SELECT * FROM override_audit_log 
                    WHERE domain = ? 
                    ORDER BY timestamp DESC LIMIT 50
                """, (domain_filter,))
            else:
                cursor.execute("SELECT * FROM override_audit_log ORDER BY timestamp DESC LIMIT 50")
            return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def _format_row(row: sqlite3.Row) -> Dict[str, Any]:
        keys = row.keys()
        domain = row["domain"] if "domain" in keys and row["domain"] else "human"
        
        # Base record
        rec = {
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
            "esi_level": row["esi_level"] if domain == "human" else None,  # NEVER expose ESI level for animals
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
            "previous_esi_level": row["previous_esi_level"] if domain == "human" else None,
            "pii_redactions": json.loads(row["pii_redactions_json"] or "[]"),
            "lab_image_path": row["lab_image_path"],
            "test_case_id": row["test_case_id"],
            "domain": domain
        }

        # Veterinary fields
        if "species" in keys:
            rec["species"] = row["species"]
            rec["breed"] = row["breed"]
            rec["age_category"] = row["age_category"]
            rec["animal_tag_or_name"] = row["animal_tag_or_name"]
            rec["owner_contact_masked"] = row["owner_contact_masked"]
            rec["veterinary_guidance"] = json.loads(row["veterinary_guidance_json"] or "{}")
            rec["is_uncertain"] = bool(row["is_uncertain"])
            rec["urgency_category"] = row["urgency_category"] or row["urgency_code"]

        return rec
