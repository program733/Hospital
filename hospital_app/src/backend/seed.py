import requests
import datetime
import os

# Base URL for the API
BASE_URL = "http://localhost:8001"

# Sample Data
patients_data = [
    {
        "name": "Rahul Sharma",
        "age": 35,
        "gender": "Male",
        "contact_number": "9876543210",
        "address": "123, MG Road, Bangalore",
        "aadhar_number": "123456789012",
        "blood_group": "O+",
        "dob": "1988-05-15T00:00:00",
        "email": "rahul.sharma@example.com",
        "marital_status": "Married"
    },
    {
        "name": "Priya Patel",
        "age": 28,
        "gender": "Female",
        "contact_number": "8765432109",
        "address": "456, Park Street, Kolkata",
        "aadhar_number": "987654321098",
        "blood_group": "A+",
        "dob": "1995-08-20T00:00:00",
        "email": "priya.patel@example.com",
        "marital_status": "Single"
    },
    {
        "name": "Amit Singh",
        "age": 50,
        "gender": "Male",
        "contact_number": "7654321098",
        "address": "789, Connaught Place, Delhi",
        "aadhar_number": "456789012345",
        "blood_group": "B+",
        "dob": "1973-12-10T00:00:00",
        "email": "amit.singh@example.com",
        "marital_status": "Married"
    }
]

doctors_data = [
    {
        "name": "Dr. Rajesh Kumar",
        "specialization": "Cardiologist",
        "contact_number": "9988776655",
        "email": "rajesh.kumar@hospital.com",
        "consultation_fee": 1000
    },
    {
        "name": "Dr. Anita Desai",
        "specialization": "Pediatrician",
        "contact_number": "8877665544",
        "email": "anita.desai@hospital.com",
        "consultation_fee": 800
    },
    {
        "name": "Dr. Vikram Seth",
        "specialization": "General Physician",
        "contact_number": "7766554433",
        "email": "vikram.seth@hospital.com",
        "consultation_fee": 500
    }
]

medicines_data = [
    {
        "name": "Paracetamol 500mg",
        "description": "Pain reliever and fever reducer",
        "stock": 500,
        "price": 20,
        "expiry_date": "2025-12-31T00:00:00",
        "batch_number": "BATCH001",
        "manufacture_date": "2023-01-01T00:00:00",
        "category": "Tablet",
        "supplier": "PharmaCorp"
    },
    {
        "name": "Amoxicillin 500mg",
        "description": "Antibiotic used to treat bacterial infections",
        "stock": 200,
        "price": 50,
        "expiry_date": "2024-10-15T00:00:00",
        "batch_number": "BATCH002",
        "manufacture_date": "2023-02-01T00:00:00",
        "category": "Capsule",
        "supplier": "MediLife"
    },
    {
        "name": "Cough Syrup",
        "description": "Relieves cough and throat irritation",
        "stock": 100,
        "price": 120,
        "expiry_date": "2024-08-01T00:00:00",
        "batch_number": "BATCH003",
        "manufacture_date": "2023-03-01T00:00:00",
        "category": "Syrup",
        "supplier": "HealthCare Ltd"
    },
    {
        "name": "Ibuprofen 400mg",
        "description": "Nonsteroidal anti-inflammatory drug (NSAID)",
        "stock": 300,
        "price": 30,
        "expiry_date": "2025-06-30T00:00:00",
        "batch_number": "BATCH004",
        "manufacture_date": "2023-04-01T00:00:00",
        "category": "Tablet",
        "supplier": "PharmaCorp"
    },
    {
        "name": "Cetirizine 10mg",
        "description": "Antihistamine for allergy relief",
        "stock": 400,
        "price": 15,
        "expiry_date": "2025-09-30T00:00:00",
        "batch_number": "BATCH005",
        "manufacture_date": "2023-05-01T00:00:00",
        "category": "Tablet",
        "supplier": "MediLife"
    },
    {
        "name": "Metformin 500mg",
        "description": "Used to treat type 2 diabetes",
        "stock": 600,
        "price": 25,
        "expiry_date": "2026-01-31T00:00:00",
        "batch_number": "BATCH006",
        "manufacture_date": "2023-06-01T00:00:00",
        "category": "Tablet",
        "supplier": "DiabetesCare"
    },
    {
        "name": "Atorvastatin 10mg",
        "description": "Lowers cholesterol",
        "stock": 350,
        "price": 40,
        "expiry_date": "2025-11-30T00:00:00",
        "batch_number": "BATCH007",
        "manufacture_date": "2023-07-01T00:00:00",
        "category": "Tablet",
        "supplier": "HeartHealth"
    },
    {
        "name": "Omeprazole 20mg",
        "description": "Treats acid reflux and ulcers",
        "stock": 250,
        "price": 35,
        "expiry_date": "2025-03-31T00:00:00",
        "batch_number": "BATCH008",
        "manufacture_date": "2023-08-01T00:00:00",
        "category": "Capsule",
        "supplier": "GastroMed"
    },
    {
        "name": "Aspirin 75mg",
        "description": "Blood thinner and pain reliever",
        "stock": 800,
        "price": 10,
        "expiry_date": "2026-05-31T00:00:00",
        "batch_number": "BATCH009",
        "manufacture_date": "2023-09-01T00:00:00",
        "category": "Tablet",
        "supplier": "PharmaCorp"
    },
    {
        "name": "Azithromycin 500mg",
        "description": "Antibiotic for various infections",
        "stock": 150,
        "price": 60,
        "expiry_date": "2024-12-31T00:00:00",
        "batch_number": "BATCH010",
        "manufacture_date": "2023-10-01T00:00:00",
        "category": "Tablet",
        "supplier": "MediLife"
    },
    {
        "name": "Pantoprazole 40mg",
        "description": "Reduces stomach acid",
        "stock": 300,
        "price": 45,
        "expiry_date": "2025-04-30T00:00:00",
        "batch_number": "BATCH011",
        "manufacture_date": "2023-11-01T00:00:00",
        "category": "Tablet",
        "supplier": "GastroMed"
    },
    {
        "name": "Losartan 50mg",
        "description": "Treats high blood pressure",
        "stock": 400,
        "price": 30,
        "expiry_date": "2025-08-31T00:00:00",
        "batch_number": "BATCH012",
        "manufacture_date": "2023-12-01T00:00:00",
        "category": "Tablet",
        "supplier": "HeartHealth"
    },
    {
        "name": "Gabapentin 300mg",
        "description": "Treats nerve pain and seizures",
        "stock": 200,
        "price": 55,
        "expiry_date": "2025-02-28T00:00:00",
        "batch_number": "BATCH013",
        "manufacture_date": "2024-01-01T00:00:00",
        "category": "Capsule",
        "supplier": "NeuroCare"
    },
    {
        "name": "Levothyroxine 50mcg",
        "description": "Treats hypothyroidism",
        "stock": 500,
        "price": 20,
        "expiry_date": "2026-03-31T00:00:00",
        "batch_number": "BATCH014",
        "manufacture_date": "2024-02-01T00:00:00",
        "category": "Tablet",
        "supplier": "ThyroMed"
    },
    {
        "name": "Prednisone 10mg",
        "description": "Corticosteroid for inflammation",
        "stock": 250,
        "price": 25,
        "expiry_date": "2025-07-31T00:00:00",
        "batch_number": "BATCH015",
        "manufacture_date": "2024-03-01T00:00:00",
        "category": "Tablet",
        "supplier": "PharmaCorp"
    },
    {
        "name": "Albuterol Inhaler",
        "description": "Bronchodilator for asthma",
        "stock": 100,
        "price": 200,
        "expiry_date": "2025-05-31T00:00:00",
        "batch_number": "BATCH016",
        "manufacture_date": "2024-04-01T00:00:00",
        "category": "Inhaler",
        "supplier": "RespiraCare"
    },
    {
        "name": "Insulin Glargine",
        "description": "Long-acting insulin for diabetes",
        "stock": 50,
        "price": 500,
        "expiry_date": "2024-11-30T00:00:00",
        "batch_number": "BATCH017",
        "manufacture_date": "2024-05-01T00:00:00",
        "category": "Injection",
        "supplier": "DiabetesCare"
    },
    {
        "name": "Clopidogrel 75mg",
        "description": "Antiplatelet medication",
        "stock": 300,
        "price": 40,
        "expiry_date": "2025-10-31T00:00:00",
        "batch_number": "BATCH018",
        "manufacture_date": "2024-06-01T00:00:00",
        "category": "Tablet",
        "supplier": "HeartHealth"
    },
    {
        "name": "Furosemide 40mg",
        "description": "Diuretic for fluid retention",
        "stock": 350,
        "price": 15,
        "expiry_date": "2025-12-31T00:00:00",
        "batch_number": "BATCH019",
        "manufacture_date": "2024-07-01T00:00:00",
        "category": "Tablet",
        "supplier": "MediLife"
    },
    {
        "name": "Vitamin D3 60k",
        "description": "Vitamin D supplement",
        "stock": 600,
        "price": 30,
        "expiry_date": "2026-06-30T00:00:00",
        "batch_number": "BATCH020",
        "manufacture_date": "2024-08-01T00:00:00",
        "category": "Capsule",
        "supplier": "NutriHealth"
    }
]

staff_data = [
    {
        "user_id": 101,
        "name": "Suresh Babu",
        "position": "Receptionist",
        "contact_number": "9123456780",
        "email": "suresh.babu@hospital.com"
    },
    {
        "user_id": 102,
        "name": "Meena Kumari",
        "position": "Nurse",
        "contact_number": "9012345678",
        "email": "meena.kumari@hospital.com"
    }
]

def seed_database():
    print("Starting database seeding...")

    # 1. Add Patients
    print("Adding Patients...")
    patient_ids = []
    for p in patients_data:
        try:
            res = requests.post(f"{BASE_URL}/patients/", json=p)
            if res.status_code == 200:
                patient_ids.append(res.json()['id'])
                print(f"  Added patient: {p['name']}")
            else:
                print(f"  Failed to add patient {p['name']}: {res.text}")
        except Exception as e:
            print(f"  Error adding patient {p['name']}: {e}")

    # 2. Add Doctors
    print("Adding Doctors...")
    doctor_ids = []
    for d in doctors_data:
        try:
            res = requests.post(f"{BASE_URL}/doctors/", json=d)
            if res.status_code == 200:
                doctor_ids.append(res.json()['id'])
                print(f"  Added doctor: {d['name']}")
            else:
                print(f"  Failed to add doctor {d['name']}: {res.text}")
        except Exception as e:
            print(f"  Error adding doctor {d['name']}: {e}")

    # 3. Add Medicines
    print("Adding Medicines...")
    medicine_ids = []
    for m in medicines_data:
        try:
            res = requests.post(f"{BASE_URL}/medicines/", json=m)
            if res.status_code == 200:
                medicine_ids.append(res.json()['id'])
                print(f"  Added medicine: {m['name']}")
            else:
                print(f"  Failed to add medicine {m['name']}: {res.text}")
        except Exception as e:
            print(f"  Error adding medicine {m['name']}: {e}")

    # 4. Add Staff
    print("Adding Staff...")
    for s in staff_data:
        try:
            res = requests.post(f"{BASE_URL}/staff/", json=s)
            if res.status_code == 200:
                print(f"  Added staff: {s['name']}")
            else:
                print(f"  Failed to add staff {s['name']}: {res.text}")
        except Exception as e:
            print(f"  Error adding staff {s['name']}: {e}")

    # 5. Create Prescriptions (if we have enough data)
    if patient_ids and doctor_ids and medicine_ids:
        print("Creating Prescriptions...")
        
        # Prescription 1: Patient 0, Doctor 0, Medicine 0 (Qty 2)
        p1 = {
            "patient_id": patient_ids[0],
            "doctor_id": doctor_ids[0],
            "prescription_date": datetime.datetime.now().isoformat(),
            "instructions": "Take twice daily after food.",
            "status": "Pending",
            "medicines": [
                {"medicine_id": medicine_ids[0], "quantity": 2}
            ]
        }
        try:
            res = requests.post(f"{BASE_URL}/prescriptions/", json=p1)
            if res.status_code == 200:
                print("  Created prescription 1")
            else:
                print(f"  Failed to create prescription 1: {res.text}")
        except Exception as e:
            print(f"  Error creating prescription 1: {e}")

        # Prescription 2: Patient 1, Doctor 1, Medicine 1 (Qty 5)
        p2 = {
            "patient_id": patient_ids[1],
            "doctor_id": doctor_ids[1],
            "prescription_date": datetime.datetime.now().isoformat(),
            "instructions": "Complete the course.",
            "status": "Pending",
            "medicines": [
                {"medicine_id": medicine_ids[1], "quantity": 5}
            ]
        }
        try:
            res = requests.post(f"{BASE_URL}/prescriptions/", json=p2)
            if res.status_code == 200:
                print("  Created prescription 2")
            else:
                print(f"  Failed to create prescription 2: {res.text}")
        except Exception as e:
            print(f"  Error creating prescription 2: {e}")

    print("Database seeding completed.")

if __name__ == "__main__":
    seed_database()
