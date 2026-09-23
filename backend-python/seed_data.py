import json
import sqlite3
from database import get_db_connection, init_db
from security import hash_password

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if already seeded
    existing_users = cursor.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if existing_users > 0:
        print("Database already contains data. Updating essential reference tables...")

    # 1. Seed Departments
    departments = [
        ("dept_revenue", "REV", "Revenue & Disaster Management", "fa-landmark", "Land records, caste certificates, income certificates, encumbrance and title deeds.", 42, 5),
        ("dept_education", "EDU", "School & Higher Education", "fa-graduation-cap", "Fee reimbursement, scholarship schemes, admission entitlements, and student welfare.", 28, 7),
        ("dept_health", "HLT", "Health, Medical & Family Welfare", "fa-heart-pulse", "YSR Aarogyasri cashless hospitalization, health cards, public clinic dispensaries.", 35, 3),
        ("dept_municipal", "MAUD", "Municipal Administration & Urban Dev", "fa-city", "Water supply, sanitation, property tax, trade licenses, and urban town planning.", 54, 7),
        ("dept_agriculture", "AGR", "Agriculture & Farmers Welfare", "fa-seedling", "Rythu Bharosa inputs, crop insurance e-Crop booking, farm mechanization subsidies.", 31, 10),
        ("dept_transport", "TRN", "Transport Department", "fa-car", "Driving licenses, vehicle registration, road tax payment, permit renewals.", 24, 7),
        ("dept_housing", "HSG", "Housing Department", "fa-house-chimney", "Navaratnalu Pedalandariki Illu housing allotments, construction subsidy disbursements.", 18, 14),
        ("dept_social", "SOC", "Social & Tribal Welfare", "fa-hand-holding-heart", "Special assistance schemes, post-matric hostel admissions, skill development.", 22, 7)
    ]

    for d in departments:
        cursor.execute("""
            INSERT OR REPLACE INTO departments (id, code, name, icon, description, service_count, grievance_sla_days)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, d)

    # 2. Seed Schemes
    schemes = [
        (
            "SCH-001", "JVD-2026", "Jagananna Vidya Deevena (Fee Reimbursement)", "dept_education", "Higher Education",
            json.dumps({"max_annual_income": 250000, "caste_categories": ["OC", "BC", "SC", "ST", "Minority"], "min_age": 17, "max_age": 28}),
            "100% tuition fee reimbursement directly credited to mother's bank account every quarter.",
            "30 Nov 2026", "Active", "fa-graduation-cap",
            json.dumps(["Aadhaar Card", "College Admission Allotment Letter", "Income Certificate / Rice Card", "Mother's Bank Passbook"])
        ),
        (
            "SCH-002", "YSR-ASRI", "Dr. YSR Aarogyasri Universal Health Scheme", "dept_health", "Healthcare",
            json.dumps({"max_annual_income": 500000, "caste_categories": ["OC", "BC", "SC", "ST", "Minority"], "min_age": 0, "max_age": 100}),
            "Cashless treatment up to ₹25 Lakhs across 3,257 listed super-specialty medical procedures.",
            "Open All Year", "Active", "fa-heart-pulse",
            json.dumps(["White Ration Card / Rice Card", "Aadhaar Card", "Patient Photo", "Doctor Referral Note"])
        ),
        (
            "SCH-003", "YSR-RB", "YSR Rythu Bharosa - PM KISAN", "dept_agriculture", "Agriculture",
            json.dumps({"max_annual_income": 400000, "caste_categories": ["OC", "BC", "SC", "ST", "Minority"], "min_age": 18, "max_age": 75}),
            "₹13,500 annual input financial support per farmer family including tenant and RoFR farmers.",
            "15 May 2026", "Active", "fa-seedling",
            json.dumps(["Pattadar Passbook / 1B", "CCRC Agreement for Tenant Farmers", "Aadhaar Card", "Aadhaar-seeded Bank Account"])
        ),
        (
            "SCH-004", "AP-REV-01", "Integrated Caste & Residence Certificate", "dept_revenue", "Citizen Certificates",
            json.dumps({"max_annual_income": 1000000, "caste_categories": ["OC", "BC", "SC", "ST", "Minority"], "min_age": 5, "max_age": 100}),
            "Digitally signed permanent integrated certificate delivered within 7 working days.",
            "Open All Year", "Active", "fa-certificate",
            json.dumps(["Application Form", "Aadhaar Card", "School Transfer Certificate / Study Certificate", "Ration Card"])
        ),
        (
            "SCH-005", "AP-REV-02", "Income & Asset Certificate", "dept_revenue", "Citizen Certificates",
            json.dumps({"max_annual_income": 1000000, "caste_categories": ["OC", "BC", "SC", "ST", "Minority"], "min_age": 18, "max_age": 100}),
            "Official income verification document valid for all state and central entitlements.",
            "Open All Year", "Active", "fa-file-invoice-dollar",
            json.dumps(["Salary Slip / IT Returns / Mandal VRO Inspection Report", "Aadhaar Card", "Electricity Bill"])
        ),
        (
            "SCH-006", "YSR-HSG", "YSR Jagananna Pedalandariki Illu", "dept_housing", "Housing",
            json.dumps({"max_annual_income": 150000, "caste_categories": ["BC", "SC", "ST", "Minority", "EWS"], "min_age": 21, "max_age": 60}),
            "Free house site title patta + ₹1.80 Lakhs construction financial assistance + free sand and cement.",
            "31 Dec 2026", "Active", "fa-house-chimney",
            json.dumps(["Rice Card", "Aadhaar of Female Head of Household", "No-Own-House Affidavit", "Bank Passbook"])
        )
    ]

    for s in schemes:
        cursor.execute("""
            INSERT OR REPLACE INTO schemes (id, code, title, department_id, category, eligibility_criteria, benefits, deadline, status, icon, required_docs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, s)

    # 3. Seed Demo Users
    users = [
        ("usr_citizen_001", "citizen@ap.gov.in", hash_password("Citizen@123"), "Kiran Kumar", "+91 98765 43210", "citizen", None),
        ("usr_officer_001", "officer@ap.gov.in", hash_password("Officer@123"), "Sri R. Venkat Rao", "+91 94401 23456", "officer", "dept_revenue"),
        ("usr_admin_001", "admin@ap.gov.in", hash_password("Admin@123"), "State IT Nodal Administrator", "+91 86624 55555", "admin", None)
    ]

    for u in users:
        cursor.execute("""
            INSERT OR REPLACE INTO users (id, email, password_hash, name, phone, role, department_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, u)

    # 4. Seed Citizen Profile
    cursor.execute("""
        INSERT OR REPLACE INTO citizen_profiles (
            id, user_id, name, email, phone, aadhaar, dob, gender, district, mandal,
            address, avatar, annual_income, caste_category, occupation, qualification
        ) VALUES (
            1, 'usr_citizen_001', 'Kiran Kumar', 'citizen@ap.gov.in', '+91 98765 43210',
            '4532 8901 2345', '1998-05-14', 'Male', 'Visakhapatnam', 'Gajuwaka',
            'Door No: 12-4-5/A, Srinivas Nagar, Gajuwaka, Visakhapatnam - 530026',
            '/citizen_avatar.png', 120000, 'BC', 'Software Engineer', 'B.Tech'
        )
    """)

    # 5. Clear all dummy applications & grievances to start cleanly at ZERO
    cursor.execute("DELETE FROM application_timelines")
    cursor.execute("DELETE FROM applications")
    cursor.execute("DELETE FROM grievance_updates")
    cursor.execute("DELETE FROM grievances")
    cursor.execute("DELETE FROM notifications")
    cursor.execute("DELETE FROM documents")

    conn.commit()
    conn.close()
    print("PrajaSeva Enterprise Database reset: applications, grievances, and stats set to 0. Ready for live user submissions!")

if __name__ == "__main__":
    seed_database()
