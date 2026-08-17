"""Generate realistic pharmaceutical complaint samples (text-based PDF + email)."""

from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / "samples"
SAMPLES.mkdir(exist_ok=True)


PDF_BODY = """
CUSTOMER COMPLAINT NOTIFICATION
Confidential - Quality Assurance Use Only

Document No.: CCN/API/2026/0418
Date of Complaint: 12 August 2026
Received by: Customer Quality Liaison, Finished Goods / API Desk

1. ORIGIN & CUSTOMER
Complaint Source: Export customer / Formulator
Customer Name: HelixForm Laboratories Pvt. Ltd., Hyderabad
Contact: Head - Incoming Quality, API Warehouse

2. PRODUCT & BATCH IDENTIFICATION
Product Name: Metformin Hydrochloride API
Product Strength / Grade: IP / BP
Pharmacopoeial Status: Complies IP 2022 / BP 2024 (as per CoA)
Batch / Lot Number: MFH260712A
Manufacturing Date: 12 July 2026
Expiry / Retest Date: 11 July 2030
Quantity Affected: 50 kg (2 x 25 kg HDPE drums with double PE liner)
Drum IDs: DR-4418, DR-4419
Manufacturing Site: Unit-II, API Block, Solapur

3. NATURE OF COMPLAINT
Complaint Type: Appearance / Discoloration
Detailed Description:
During incoming visual inspection of Metformin Hydrochloride API batch MFH260712A, the customer
observed a pale yellow to off-white discoloration in material from drum DR-4419. The typical
appearance on the Certificate of Analysis is white crystalline powder. No unusual odor was noted.
The second drum (DR-4418) appeared within the expected white range. The customer has quarantined
both drums and requests investigation, retain-sample comparison, and a replacement consignment.

Related testing at customer (in-house, not OOS yet): description fails vs. white crystalline powder;
identification by IR still matches. Assay not completed at time of complaint.

4. REQUESTED ACTION
- Investigate manufacturing, drying, and packaging of batch MFH260712A
- Check retain sample and related batches on the same campaign
- Advise on disposition and replacement of 50 kg (2 HDPE drums)

Prepared by: R. Menon, Customer Quality
Distribution: QA Head, API Production, Warehouse
""".strip()


MEDICINE_PDF = """
CUSTOMER PRODUCT QUALITY COMPLAINT
Finished Dosage Form  -  Oral Solid Dose

Complaint No.: PCQ/FDF/2026/0882
Complaint Date: 08 August 2026
Complaint Source: Retail pharmacy chain
Customer Name: Apollo Pharmacy, Bengaluru (Koramangala store)
Reported by: Store Pharmacist

------------------------------------------------------------
MEDICINE IDENTIFICATION
------------------------------------------------------------
Product Name: Amoxicillin Capsules
Product Strength / Grade: 500 mg
Dosage Form: Hard gelatin capsules
Generic Name: Amoxicillin trihydrate
Pharmacopoeial Status: IP
Marketing Authorization Holder: Aurora Formulations Pvt. Ltd.
Manufacturing Site: FDF Block, Unit-I, Hyderabad

Batch / Lot Number: BMX24601
Manufacturing Date: 04 March 2026
Expiry Date: 03 March 2028
Pack Style: Alu-Alu blister, 24 capsules per pack
Quantity Affected: 48 capsules (2 packs of 24)
Pack IDs isolated: AP-KOR-8821, AP-KOR-8822

------------------------------------------------------------
COMPLAINT DETAILS
------------------------------------------------------------
Complaint Type: Appearance / Discoloration

Detailed Description:
The pharmacist reported that several Amoxicillin Capsules 500 mg from pack AP-KOR-8822
show a brownish-yellow discoloration of the capsule shell. Remaining units in pack
AP-KOR-8821 are the expected ivory / off-white. No unusual odor. Patients were not
dispensed the affected packs. The store has quarantined 48 capsules and requests
QA investigation, retain-sample comparison, and replacement.

Patient exposure: None reported
Requested action: Route to QA investigation and issue replacement of 48 capsules.

Prepared by: K. Rao, Customer Quality Desk
Distribution: QA Head, FDF Production, Warehouse, Regulatory Affairs
""".strip()


class ComplaintPDF(FPDF):
    banner = "AURORA APIs  |  Quality Management System  |  ICH Q7 / 21 CFR 211.198"

    def header(self):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(15, 110, 107)
        self.cell(0, 6, self.banner, align="L")
        self.ln(8)
        self.set_draw_color(15, 110, 107)
        self.set_line_width(0.4)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, "Uncontrolled if printed  -  Page " + str(self.page_no()), align="C")


class MedicinePDF(ComplaintPDF):
    banner = "AURORA FORMULATIONS  |  FDF Quality  |  21 CFR 211.198 / EU GMP Ch. 8"


def write_pdf_from_text(body: str, filename: str, cls=ComplaintPDF):
    pdf = cls()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    pdf.set_text_color(18, 35, 44)
    pdf.set_font("Helvetica", size=11)
    usable = pdf.w - pdf.l_margin - pdf.r_margin
    for line in body.split("\n"):
        safe = line.encode("latin-1", "replace").decode("latin-1")
        pdf.set_x(pdf.l_margin)
        if not safe.strip():
            pdf.ln(4)
            continue
        pdf.multi_cell(usable, 6, safe)
    path = SAMPLES / filename
    pdf.output(path)
    print("wrote", path)
    return path


def write_pdf():
    write_pdf_from_text(PDF_BODY, "metformin_hcl_api_complaint.pdf")
    write_pdf_from_text(MEDICINE_PDF, "apollo_amoxicillin_complaint.pdf", cls=MedicinePDF)


EML = """From: incoming.qa@helixform.com
To: complaints@aurora-api.example
Cc: qa.head@aurora-api.example
Subject: Customer complaint - Metformin Hydrochloride API batch MFH260712A - discoloration
Date: Wed, 12 Aug 2026 09:42:00 +0530
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8

Dear Aurora QA,

This is a formal product quality complaint from HelixForm Laboratories Pvt. Ltd., Hyderabad.

Product: Metformin Hydrochloride API
Grade: IP/BP
Batch/Lot: MFH260712A
Manufacturing date: 12-Jul-2026
Retest date: 11-Jul-2030
Quantity affected: 50 kg in 2 HDPE drums (25 kg each), drum IDs DR-4418 and DR-4419

Observation: pale yellow / off-white discoloration in drum DR-4419 versus white crystalline powder on CoA. Drum DR-4418 appears acceptable. Both drums are quarantined at our warehouse.

Please investigate, compare retain samples, assess related batches, and arrange replacement of the 50 kg (2 HDPE drums).

Regards,
Incoming Quality
HelixForm Laboratories
""".strip() + "\n"


APOLLO_TXT = """
Apollo Pharmacy - Product Quality Complaint

Date: 08 August 2026
Complaint source: Retail pharmacy chain
Customer name: Apollo Pharmacy, Bengaluru (Koramangala store)

Product name: Amoxicillin Capsules
Product strength/grade: 500 mg
Batch/lot number: BMX24601
Manufacturing date: 04 March 2026
Expiry date: 03 March 2028
Quantity affected: 48 capsules (2 packs of 24)

Complaint type: Appearance / Discoloration

Description:
The pharmacist reported that several Amoxicillin 500 mg capsules from pack 2 show a brownish-yellow discoloration of the capsule shell compared with the remaining units, which are the expected ivory/off-white. Patients were not dispensed the affected packs. Store has isolated 48 capsules and requests investigation and replacement.

Requested action: QA investigation, retain check, replacement of 48 capsules.
""".strip()


PACKAGING = """
Subject: Packaging complaint - Atorvastatin Tablets 20 mg - scuffed cartons

From: MedSupply Distributors, Pune
Date: 05 August 2026

Product: Atorvastatin Tablets
Strength: 20 mg
Batch: ATV250918B
Mfg: 18-Sep-2025
Exp: 17-Sep-2027
Qty affected: 12 cartons (10 x 10 blisters each)

Complaint type: Packaging (cosmetic)

Secondary cartons arrived with scuffing and crushed corners after transport. Blisters and tablets appear intact. No patient complaints. Request credit note and packaging review. Severity expected: Minor.
""".strip()


def main():
    write_pdf()
    (SAMPLES / "helixform_metformin_complaint.eml").write_text(EML, encoding="utf-8")
    (SAMPLES / "apollo_amoxicillin_complaint.txt").write_text(APOLLO_TXT, encoding="utf-8")
    (SAMPLES / "atorvastatin_packaging_complaint.txt").write_text(PACKAGING, encoding="utf-8")
    print("samples ready in", SAMPLES)


if __name__ == "__main__":
    main()
