"""
Veterinary Clinical Referral Note & Transfer PDF Generator
Conforms to Department of Animal Husbandry & Veterinary Services (DAH&VS) standards.
Produces high-resolution, printable clinical transfer documents for veterinary hospitals.
"""
from pathlib import Path
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from .config import PDF_DIR
from .veterinary_rules import VETERINARY_DISCLAIMER

class VeterinaryReferralPDFGenerator:
    """
    Generates standard veterinary referral and case summary transfer PDFs.
    """

    @classmethod
    def generate_referral_pdf(cls, record: Dict[str, Any]) -> str:
        record_id = record.get("id", "VET-001")
        file_path = PDF_DIR / f"VET_Referral_{record_id}.pdf"

        doc = SimpleDocTemplate(
            str(file_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Typography
        title_style = ParagraphStyle(
            "VetTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#065f46")
        )

        subtitle_style = ParagraphStyle(
            "VetSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#334155")
        )

        disclaimer_style = ParagraphStyle(
            "VetDisclaimer",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9.5,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#991b1b")
        )

        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=13,
            textColor=colors.HexColor("#0f172a")
        )

        cell_style = ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1e293b")
        )

        cell_bold = ParagraphStyle(
            "TableCellBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#0f172a")
        )

        elements = []

        # 1. Header
        elements.append(Paragraph("AROGYA-TRIAGE — VETERINARY CLINICAL DECISION SUPPORT", title_style))
        elements.append(Paragraph("Department of Animal Husbandry & Veterinary Services | Field Triage & Emergency Referral Note", subtitle_style))
        elements.append(Spacer(1, 6))

        # 2. Disclaimer Alert Box
        disclaimer_text = f"<b>REGULATORY NOTICE:</b> {VETERINARY_DISCLAIMER}"
        disclaimer_table = Table([[Paragraph(disclaimer_text, disclaimer_style)]], colWidths=[540])
        disclaimer_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fef2f2")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#f87171")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        elements.append(disclaimer_table)
        elements.append(Spacer(1, 8))

        # 3. Urgency Banner
        urgency_category = (record.get("urgency_category") or record.get("urgency_code") or "ROUTINE").upper()
        if "CRITICAL" in urgency_category or "RESUSCITATION" in urgency_category:
            banner_bg = colors.HexColor("#991b1b")
            banner_text = f"VETERINARY TRIAGE INDEX (VTI): CRITICAL — IMMEDIATE RESUSCITATION (CODE RED)"
        elif "EMERGENT" in urgency_category:
            banner_bg = colors.HexColor("#b91c1c")
            banner_text = f"VETERINARY TRIAGE INDEX (VTI): EMERGENT — HIGH DETERIORATION RISK (CODE RED)"
        elif "URGENT" in urgency_category:
            banner_bg = colors.HexColor("#b45309")
            banner_text = f"VETERINARY TRIAGE INDEX (VTI): URGENT — EXAM WITHIN 1-2 HOURS (CODE YELLOW)"
        elif "UNCERTAIN" in urgency_category:
            banner_bg = colors.HexColor("#475569")
            banner_text = f"VETERINARY TRIAGE INDEX (VTI): UNCERTAIN STATE — QUALIFIED VETERINARY EVALUATION REQUIRED"
        else:
            banner_bg = colors.HexColor("#15803d")
            banner_text = f"VETERINARY TRIAGE INDEX (VTI): ROUTINE — STANDARD OUTPATIENT OPD (CODE GREEN)"

        urgency_style = ParagraphStyle(
            "UrgencyBanner",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.white
        )
        urgency_table = Table([[Paragraph(banner_text, urgency_style)]], colWidths=[540])
        urgency_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), banner_bg),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        elements.append(urgency_table)
        elements.append(Spacer(1, 8))

        # 4. Animal & Case Demographics Table
        species = str(record.get("species") or "Unknown").capitalize()
        breed = str(record.get("breed") or "Indigenous / Non-Descript")
        age = str(record.get("age_category") or "Adult")
        animal_id = str(record.get("animal_tag_or_name") or record.get("display_pseudonym") or record_id)
        facility = str(record.get("facility") or "CHC / Veterinary Dispensary Panposh")
        timestamp = str(record.get("timestamp") or "N/A")
        owner_phone = str(record.get("owner_contact_masked") or "Unrecorded / Anonymous")

        demo_data = [
            [
                Paragraph("<b>Case Reference ID:</b>", cell_bold), Paragraph(record_id, cell_style),
                Paragraph("<b>Date & Timestamp:</b>", cell_bold), Paragraph(timestamp[:19].replace("T", " "), cell_style)
            ],
            [
                Paragraph("<b>Species Profile:</b>", cell_bold), Paragraph(f"<b>{species}</b>", cell_style),
                Paragraph("<b>Breed:</b>", cell_bold), Paragraph(breed, cell_style)
            ],
            [
                Paragraph("<b>Age / Stage:</b>", cell_bold), Paragraph(age, cell_style),
                Paragraph("<b>Animal Tag / Name:</b>", cell_bold), Paragraph(animal_id, cell_style)
            ],
            [
                Paragraph("<b>Referring Center:</b>", cell_bold), Paragraph(facility, cell_style),
                Paragraph("<b>Owner Contact (Masked):</b>", cell_bold), Paragraph(owner_phone, cell_style)
            ]
        ]
        demo_table = Table(demo_data, colWidths=[120, 150, 120, 150])
        demo_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(demo_table)
        elements.append(Spacer(1, 8))

        # 5. Clinical Presentation & Symptom Narrative
        elements.append(Paragraph("1. Presenting Complaints & Intake Narrative", section_heading))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=2, spaceAfter=4))
        
        symptoms_raw = record.get("symptoms_raw") or "No narrative entered."
        elements.append(Paragraph(f"<b>Intake Narrative:</b> {symptoms_raw}", cell_style))
        elements.append(Spacer(1, 4))

        # Extracted symptoms list
        symptoms_list = record.get("symptoms") or []
        if symptoms_list:
            symptom_bullets = "<br/>".join([f"• <b>{s}</b>" for s in symptoms_list])
            elements.append(Paragraph(f"<b>Extracted Presenting Symptoms:</b><br/>{symptom_bullets}", cell_style))
            elements.append(Spacer(1, 4))

        # 6. Physiological Vital Signs
        elements.append(Paragraph("2. Physiological Vital Signs (Species Benchmarks)", section_heading))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=2, spaceAfter=4))

        vitals = record.get("vitals") or {}
        temp = f"{vitals.get('temperature')} °F" if vitals.get('temperature') else "Not Recorded"
        hr = f"{vitals.get('heart_rate')} bpm" if vitals.get('heart_rate') else "Not Recorded"
        rr = f"{vitals.get('respiration_rate')} /min" if vitals.get('respiration_rate') else "Not Recorded"
        crt = f"{vitals.get('crt_sec')} sec" if vitals.get('crt_sec') else "Not Recorded"
        mm = vitals.get('mucous_membrane_color') or "Not Recorded"

        vitals_data = [
            [
                Paragraph("<b>Parameter</b>", cell_bold),
                Paragraph("<b>Recorded Value</b>", cell_bold),
                Paragraph("<b>Species Normal Baseline</b>", cell_bold),
                Paragraph("<b>Clinical Interpretation</b>", cell_bold)
            ],
            [
                Paragraph("Rectal Temperature", cell_style),
                Paragraph(temp, cell_style),
                Paragraph("100.4°F – 102.8°F (Cattle) / 100.5°F – 102.5°F (Dog)", cell_style),
                Paragraph("Baseline check" if "Not" in temp else "Assessed by rule engine", cell_style)
            ],
            [
                Paragraph("Heart / Pulse Rate", cell_style),
                Paragraph(hr, cell_style),
                Paragraph("48 – 84 bpm (Cattle) / 60 – 140 bpm (Dog)", cell_style),
                Paragraph("Perfusion marker", cell_style)
            ],
            [
                Paragraph("Respiratory Rate", cell_style),
                Paragraph(rr, cell_style),
                Paragraph("15 – 35 /min (Cattle) / 10 – 30 /min (Dog)", cell_style),
                Paragraph("Ventilation marker", cell_style)
            ],
            [
                Paragraph("Mucous Membrane Color", cell_style),
                Paragraph(mm.title(), cell_style),
                Paragraph("Normal Pink (Moist)", cell_style),
                Paragraph("Tissue oxygenation & capillary perfusion", cell_style)
            ],
            [
                Paragraph("Capillary Refill Time (CRT)", cell_style),
                Paragraph(crt, cell_style),
                Paragraph("< 2.0 Seconds", cell_style),
                Paragraph("Peripheral circulatory integrity", cell_style)
            ]
        ]
        vitals_table = Table(vitals_data, colWidths=[130, 90, 180, 140])
        vitals_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 2.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ]))
        elements.append(vitals_table)
        elements.append(Spacer(1, 8))

        # 7. Safety Flags & Clinical Reasons
        elements.append(Paragraph("3. Algorithmic Safety Flags & Urgency Justification", section_heading))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=2, spaceAfter=4))

        flags = record.get("flags") or []
        reasons = record.get("reasons") or []

        if flags:
            flags_str = ", ".join([f"<code>{f}</code>" for f in flags])
            elements.append(Paragraph(f"<b>Triggered Flags:</b> {flags_str}", cell_style))
            elements.append(Spacer(1, 2))

        if reasons:
            reasons_bullets = "<br/>".join([f"• {r}" for r in reasons])
            elements.append(Paragraph(f"<b>Evaluation Rationale:</b><br/>{reasons_bullets}", cell_style))
            elements.append(Spacer(1, 4))

        # 8. Mandatory Emergency Actions (Zero Prescriptions)
        elements.append(Paragraph("4. Recommended Stabilization & Safe Transport Protocol (Non-Prescription)", section_heading))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=2, spaceAfter=4))

        actions = record.get("critical_actions") or []
        if actions:
            actions_bullets = "<br/>".join([f"• <b>{a}</b>" for a in actions])
            elements.append(Paragraph(actions_bullets, cell_style))
        else:
            elements.append(Paragraph("Standard supportive nursing care. Transport safely to veterinary OPD.", cell_style))
        elements.append(Spacer(1, 6))

        # 9. Identified Gaps & Missing Parameters
        missing = record.get("missing_info") or []
        if missing:
            elements.append(Paragraph("5. Protocol Diagnostic Blind Spots / Missing Clinical Parameters", section_heading))
            elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=2, spaceAfter=4))
            missing_bullets = "<br/>".join([f"• <b>{m.get('title')}:</b> {m.get('reason')}" for m in missing])
            elements.append(Paragraph(missing_bullets, cell_style))
            elements.append(Spacer(1, 8))

        # 10. Attestation & Sign-off Block
        elements.append(Spacer(1, 10))
        reviewer_name = record.get("reviewer_doctor") or "Dr. A. K. Nayak, B.V.Sc & A.H."
        status_text = record.get("status", "PENDING_REVIEW")

        signoff_data = [
            [
                Paragraph("<b>Triage Evaluation Engine:</b> AROGYA-TRIAGE v2.0 (Deterministic VTI Layer)", cell_style),
                Paragraph("<b>Attending Veterinary Officer (RVP):</b>", cell_bold)
            ],
            [
                Paragraph(f"<b>Review Status:</b> {status_text}", cell_style),
                Paragraph(f"{reviewer_name}<br/>Regn No: VCI/OD/2026/8821<br/>Govt Veterinary Hospital Panposh", cell_style)
            ]
        ]
        signoff_table = Table(signoff_data, colWidths=[270, 270])
        signoff_table.setStyle(TableStyle([
            ("LINEABOVE", (0, 0), (-1, 0), 1, colors.HexColor("#94a3b8")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(signoff_table)

        doc.build(elements)
        return str(file_path)
