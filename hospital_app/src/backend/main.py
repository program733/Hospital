from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, database
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import datetime
from typing import Optional

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models for Patient Module
class PatientBase(BaseModel):
    name: str
    age: int
    gender: Optional[str] = None
    contact_number: str
    address: Optional[str] = None
    aadhar_number: Optional[str] = None
    blood_group: Optional[str] = None
    dob: Optional[datetime.datetime] = None
    email: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_number: Optional[str] = None
    marital_status: Optional[str] = None
    assigned_doctor_id: Optional[int] = None

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int
    class Config:
        from_attributes = True

# Pydantic Models for Doctor Module
class DoctorBase(BaseModel):
    name: str
    specialization: str
    contact_number: str
    email: str
    consultation_fee: int = 500

class DoctorCreate(DoctorBase):
    pass

class Doctor(DoctorBase):
    id: int
    class Config:
        from_attributes = True

# Pydantic Models for Appointment Module
class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_time: datetime.datetime
    reason: str
    status: str = "Scheduled"

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: int
    class Config:
        from_attributes = True

# Pydantic Models for Medical Record Module
class MedicalRecordBase(BaseModel):
    patient_id: int
    doctor_id: int
    diagnosis: str
    treatment: str
    record_date: datetime.datetime

class MedicalRecordCreate(MedicalRecordBase):
    pass

class MedicalRecord(MedicalRecordBase):
    id: int
    class Config:
        from_attributes = True

# Pydantic Models for Medicine Module
class MedicineBase(BaseModel):
    name: str
    description: str
    stock: int
    price: int
    expiry_date: datetime.datetime
    batch_number: str
    manufacture_date: datetime.datetime
    low_stock_threshold: int = 10
    category: str
    supplier: str

class MedicineCreate(MedicineBase):
    pass

class Medicine(MedicineBase):
    id: int
    class Config:
        from_attributes = True

# Pydantic Models for Prescription Module
class PrescriptionBase(BaseModel):
    patient_id: int
    doctor_id: int
    prescription_date: Optional[datetime.datetime] = None
    instructions: Optional[str] = None
    status: str = "Pending"

class PrescriptionCreate(PrescriptionBase):
    medicines: list[dict]  # List of {medicine_id: int, quantity: int}

class Prescription(PrescriptionBase):
    id: int
    medicines: Optional[list] = None
    class Config:
        from_attributes = True

# Pydantic Models for Prescription Medicine Link
class PrescriptionMedicineBase(BaseModel):
    prescription_id: int
    medicine_id: int
    quantity: int

class PrescriptionMedicineCreate(PrescriptionMedicineBase):
    pass

class PrescriptionMedicine(PrescriptionMedicineBase):
    class Config:
        from_attributes = True

# Pydantic Models for Bill Module
class BillBase(BaseModel):
    patient_id: int
    issue_date: datetime.datetime
    due_date: datetime.datetime
    status: str = "Pending"

class BillCreate(BillBase):
    amount: Optional[int] = None  # Make amount optional for auto-calculation

class Bill(BillBase):
    id: int
    amount: int
    paid_amount: Optional[int] = 0
    class Config:
        from_attributes = True

# Pydantic Models for User Module (for RBAC)
class UserBase(BaseModel):
    username: str
    password: str # This should be hashed in a real application
    role: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    hashed_password: str # Only return hashed password
    class Config:
        from_attributes = True

# Pydantic Models for Staff Module
class StaffBase(BaseModel):
    user_id: int
    name: str
    position: str
    contact_number: str
    email: str

class StaffCreate(StaffBase):
    pass

class Staff(StaffBase):
    id: int
    class Config:
        from_attributes = True

# Pydantic Models for Payment Module
class PaymentBase(BaseModel):
    bill_id: int
    amount: int
    payment_method: str
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    payment_date: datetime.datetime
    class Config:
        from_attributes = True

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# API Endpoints for Patient Module
@app.post("/patients/", response_model=Patient)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    try:
        db_patient = models.Patient(**patient.dict())
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        return db_patient
    except Exception as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e):
            if "aadhar_number" in str(e) or "patients.aadhar_number" in str(e):
                raise HTTPException(status_code=400, detail="Patient with this Aadhar Number already exists.")
            # Fallback for other unique constraints if any
            raise HTTPException(status_code=400, detail="Duplicate entry detected.")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patients/", response_model=list[Patient])
def read_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    patients = db.query(models.Patient).offset(skip).limit(limit).all()
    return patients

@app.get("/patients/{patient_id}", response_model=Patient)
def read_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.put("/patients/{patient_id}", response_model=Patient)
def update_patient(patient_id: int, patient: PatientCreate, db: Session = Depends(get_db)):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    for key, value in patient.dict().items():
        setattr(db_patient, key, value)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.delete("/patients/{patient_id}", response_model=Patient)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(db_patient)
    db.commit()
    return db_patient

# API Endpoints for Doctor Module
@app.post("/doctors/", response_model=Doctor)
def create_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    db_doctor = models.Doctor(**doctor.dict())
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

@app.get("/doctors/", response_model=list[Doctor])
def read_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    doctors = db.query(models.Doctor).offset(skip).limit(limit).all()
    return doctors

@app.get("/doctors/{doctor_id}", response_model=Doctor)
def read_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

@app.put("/doctors/{doctor_id}", response_model=Doctor)
def update_doctor(doctor_id: int, doctor: DoctorCreate, db: Session = Depends(get_db)):
    db_doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    for key, value in doctor.dict().items():
        setattr(db_doctor, key, value)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

@app.delete("/doctors/{doctor_id}", response_model=Doctor)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    db_doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if db_doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db.delete(db_doctor)
    db.commit()
    return db_doctor

# API Endpoints for Appointment Module
@app.post("/appointments/", response_model=Appointment)
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    db_appointment = models.Appointment(**appointment.dict())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@app.get("/appointments/", response_model=list[Appointment])
def read_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    appointments = db.query(models.Appointment).offset(skip).limit(limit).all()
    return appointments

@app.get("/appointments/{appointment_id}", response_model=Appointment)
def read_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@app.put("/appointments/{appointment_id}", response_model=Appointment)
def update_appointment(appointment_id: int, appointment: AppointmentCreate, db: Session = Depends(get_db)):
    db_appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    for key, value in appointment.dict().items():
        setattr(db_appointment, key, value)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@app.delete("/appointments/{appointment_id}", response_model=Appointment)
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    db_appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if db_appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(db_appointment)
    db.commit()
    return db_appointment

# API Endpoints for Medical Record Module
@app.post("/medical_records/", response_model=MedicalRecord)
def create_medical_record(medical_record: MedicalRecordCreate, db: Session = Depends(get_db)):
    db_medical_record = models.MedicalRecord(**medical_record.dict())
    db.add(db_medical_record)
    db.commit()
    db.refresh(db_medical_record)
    return db_medical_record

@app.get("/medical_records/", response_model=list[MedicalRecord])
def read_medical_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    medical_records = db.query(models.MedicalRecord).offset(skip).limit(limit).all()
    return medical_records

@app.get("/medical_records/{record_id}", response_model=MedicalRecord)
def read_medical_record(record_id: int, db: Session = Depends(get_db)):
    medical_record = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == record_id).first()
    if medical_record is None:
        raise HTTPException(status_code=404, detail="Medical Record not found")
    return medical_record

@app.put("/medical_records/{record_id}", response_model=MedicalRecord)
def update_medical_record(record_id: int, medical_record: MedicalRecordCreate, db: Session = Depends(get_db)):
    db_medical_record = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == record_id).first()
    if db_medical_record is None:
        raise HTTPException(status_code=404, detail="Medical Record not found")
    for key, value in medical_record.dict().items():
        setattr(db_medical_record, key, value)
    db.commit()
    db.refresh(db_medical_record)
    return db_medical_record

@app.delete("/medical_records/{record_id}", response_model=MedicalRecord)
def delete_medical_record(record_id: int, db: Session = Depends(get_db)):
    db_medical_record = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == record_id).first()
    if db_medical_record is None:
        raise HTTPException(status_code=404, detail="Medical Record not found")
    db.delete(db_medical_record)
    db.commit()
    return db_medical_record

# API Endpoints for Medicine Module
@app.post("/medicines/", response_model=Medicine)
def create_medicine(medicine: MedicineCreate, db: Session = Depends(get_db)):
    db_medicine = models.Medicine(**medicine.dict())
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

@app.get("/medicines/", response_model=list[Medicine])
def read_medicines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    medicines = db.query(models.Medicine).offset(skip).limit(limit).all()
    return medicines

# Additional Medicine Endpoints for Inventory Management
@app.get("/medicines/low-stock", response_model=list[Medicine])
def get_low_stock_medicines(db: Session = Depends(get_db)):
    medicines = db.query(models.Medicine).filter(models.Medicine.stock <= models.Medicine.low_stock_threshold).all()
    return medicines

@app.get("/medicines/expiring-soon", response_model=list[Medicine])
def get_expiring_soon_medicines(days: int = 30, db: Session = Depends(get_db)):
    expiry_threshold = datetime.datetime.utcnow() + datetime.timedelta(days=days)
    medicines = db.query(models.Medicine).filter(models.Medicine.expiry_date <= expiry_threshold).all()
    return medicines

@app.get("/medicines/batches/{batch_number}", response_model=list[Medicine])
def get_medicines_by_batch(batch_number: str, db: Session = Depends(get_db)):
    medicines = db.query(models.Medicine).filter(models.Medicine.batch_number == batch_number).all()
    return medicines

@app.get("/medicines/{medicine_id}", response_model=Medicine)
def read_medicine(medicine_id: int, db: Session = Depends(get_db)):
    medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if medicine is None:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return medicine

@app.put("/medicines/{medicine_id}", response_model=Medicine)
def update_medicine(medicine_id: int, medicine: MedicineCreate, db: Session = Depends(get_db)):
    db_medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if db_medicine is None:
        raise HTTPException(status_code=404, detail="Medicine not found")
    for key, value in medicine.dict().items():
        setattr(db_medicine, key, value)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

@app.delete("/medicines/{medicine_id}", response_model=Medicine)
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)):
    db_medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if db_medicine is None:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.delete(db_medicine)
    db.commit()
    return db_medicine

# API Endpoints for Prescription Module
@app.post("/prescriptions/", response_model=Prescription)
def create_prescription(prescription: PrescriptionCreate, db: Session = Depends(get_db)):
    # Create prescription without medicines field
    prescription_data = prescription.dict()
    medicines = prescription_data.pop('medicines', [])

    db_prescription = models.Prescription(**prescription_data)
    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)

    # Add prescription medicines
    for med in medicines:
        pm = models.PrescriptionMedicine(
            prescription_id=db_prescription.id,
            medicine_id=med['medicine_id'],
            quantity=med['quantity']
        )
        db.add(pm)
    db.commit()

    # Fetch the complete prescription with medicines for response
    prescription_with_medicines = db.query(models.Prescription).filter(models.Prescription.id == db_prescription.id).first()
    prescription_medicines = db.query(models.PrescriptionMedicine).filter(
        models.PrescriptionMedicine.prescription_id == db_prescription.id
    ).all()

    # Build response with medicines
    response_data = prescription_with_medicines.__dict__.copy()
    response_data['medicines'] = [{'medicine_id': pm.medicine_id, 'quantity': pm.quantity} for pm in prescription_medicines]
    response_data.pop('_sa_instance_state', None)

    return response_data

@app.get("/prescriptions/", response_model=list[Prescription])
def read_prescriptions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    prescriptions = db.query(models.Prescription).offset(skip).limit(limit).all()
    result = []
    for p in prescriptions:
        p_dict = p.__dict__.copy()
        p_dict.pop('_sa_instance_state', None)
        # Get medicines for this prescription
        pms = db.query(models.PrescriptionMedicine).filter(
            models.PrescriptionMedicine.prescription_id == p.id
        ).all()
        p_dict['medicines'] = [{'medicine_id': pm.medicine_id, 'quantity': pm.quantity} for pm in pms]
        result.append(p_dict)
    return result

@app.get("/prescriptions/{prescription_id}", response_model=Prescription)
def read_prescription(prescription_id: int, db: Session = Depends(get_db)):
    prescription = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
    if prescription is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return prescription

@app.put("/prescriptions/{prescription_id}", response_model=Prescription)
def update_prescription(prescription_id: int, prescription: PrescriptionCreate, db: Session = Depends(get_db)):
    db_prescription = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
    if db_prescription is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    for key, value in prescription.dict().items():
        setattr(db_prescription, key, value)
    db.commit()
    db.refresh(db_prescription)
    return db_prescription

@app.delete("/prescriptions/{prescription_id}", response_model=Prescription)
def delete_prescription(prescription_id: int, db: Session = Depends(get_db)):
    db_prescription = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
    if db_prescription is None:
        raise HTTPException(status_code=404, detail="Prescription not found")
    db.delete(db_prescription)
    db.commit()
    return db_prescription

# API Endpoints for Prescription Medicine Link
@app.post("/prescription_medicines/", response_model=PrescriptionMedicine)
def create_prescription_medicine(pm: PrescriptionMedicineCreate, db: Session = Depends(get_db)):
    db_pm = models.PrescriptionMedicine(**pm.dict())
    db.add(db_pm)
    db.commit()
    db.refresh(db_pm)
    return db_pm

@app.get("/prescription_medicines/", response_model=list[PrescriptionMedicine])
def read_prescription_medicines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    pms = db.query(models.PrescriptionMedicine).offset(skip).limit(limit).all()
    return pms

@app.get("/prescription_medicines/{prescription_id}/{medicine_id}", response_model=PrescriptionMedicine)
def read_prescription_medicine(prescription_id: int, medicine_id: int, db: Session = Depends(get_db)):
    pm = db.query(models.PrescriptionMedicine).filter(
        models.PrescriptionMedicine.prescription_id == prescription_id,
        models.PrescriptionMedicine.medicine_id == medicine_id
    ).first()
    if pm is None:
        raise HTTPException(status_code=404, detail="Prescription Medicine link not found")
    return pm

@app.put("/prescription_medicines/{prescription_id}/{medicine_id}", response_model=PrescriptionMedicine)
def update_prescription_medicine(prescription_id: int, medicine_id: int, pm: PrescriptionMedicineCreate, db: Session = Depends(get_db)):
    db_pm = db.query(models.PrescriptionMedicine).filter(
        models.PrescriptionMedicine.prescription_id == prescription_id,
        models.PrescriptionMedicine.medicine_id == medicine_id
    ).first()
    if db_pm is None:
        raise HTTPException(status_code=404, detail="Prescription Medicine link not found")
    for key, value in pm.dict().items():
        setattr(db_pm, key, value)
    db.commit()
    db.refresh(db_pm)
    return db_pm

@app.delete("/prescription_medicines/{prescription_id}/{medicine_id}", response_model=PrescriptionMedicine)
def delete_prescription_medicine(prescription_id: int, medicine_id: int, db: Session = Depends(get_db)):
    db_pm = db.query(models.PrescriptionMedicine).filter(
        models.PrescriptionMedicine.prescription_id == prescription_id,
        models.PrescriptionMedicine.medicine_id == medicine_id
    ).first()
    if db_pm is None:
        raise HTTPException(status_code=404, detail="Prescription Medicine link not found")
    db.delete(db_pm)
    db.commit()
    return db_pm

# API Endpoints for Bill Module
@app.post("/bills/", response_model=Bill)
def create_bill(bill: BillCreate, db: Session = Depends(get_db)):
    # Auto-calculate bill amount based on patient's prescriptions and medicines
    patient = db.query(models.Patient).filter(models.Patient.id == bill.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    total_amount = 0
    medicines_to_update = []

    # Get all pending prescriptions for the patient
    prescriptions = db.query(models.Prescription).filter(
        models.Prescription.patient_id == bill.patient_id,
        models.Prescription.status == "Pending"
    ).all()

    for prescription in prescriptions:
        # Get medicines for each prescription
        prescription_medicines = db.query(models.PrescriptionMedicine).filter(
            models.PrescriptionMedicine.prescription_id == prescription.id
        ).all()

        for pm in prescription_medicines:
            medicine = db.query(models.Medicine).filter(models.Medicine.id == pm.medicine_id).first()
            if medicine:
                if medicine.stock < pm.quantity:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Insufficient stock for medicine: {medicine.name}. Available: {medicine.stock}, Required: {pm.quantity}"
                    )
                total_amount += medicine.price * pm.quantity
                medicines_to_update.append((medicine, pm.quantity))

    # Deduct stock
    for medicine, quantity in medicines_to_update:
        medicine.stock -= quantity

    # Mark prescriptions as Billed and add doctor's consultation fee
    for prescription in prescriptions:
        prescription.status = "Billed"
        
        # Add consultation fee for the doctor who prescribed
        doctor = db.query(models.Doctor).filter(models.Doctor.id == prescription.doctor_id).first()
        if doctor:
            total_amount += doctor.consultation_fee
        else:
            # Fallback if doctor not found (shouldn't happen ideally)
            total_amount += 500

    # Create bill with calculated amount
    bill_data = bill.dict()
    bill_data['amount'] = total_amount

    db_bill = models.Bill(**bill_data)
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    return db_bill

@app.get("/bills/", response_model=list[Bill])
def read_bills(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    bills = db.query(models.Bill).offset(skip).limit(limit).all()
    return bills

@app.get("/bills/{bill_id}", response_model=Bill)
def read_bill(bill_id: int, db: Session = Depends(get_db)):
    bill = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    if bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill

@app.put("/bills/{bill_id}", response_model=Bill)
def update_bill(bill_id: int, bill: BillCreate, db: Session = Depends(get_db)):
    db_bill = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    if db_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    for key, value in bill.dict().items():
        setattr(db_bill, key, value)
    db.commit()
    db.refresh(db_bill)
    return db_bill

@app.delete("/bills/{bill_id}", response_model=Bill)
def delete_bill(bill_id: int, db: Session = Depends(get_db)):
    db_bill = db.query(models.Bill).filter(models.Bill.id == bill_id).first()
    if db_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    db.delete(db_bill)
    db.commit()
    return db_bill

# API Endpoints for User Module (Authentication/Authorization will be added later)
@app.post("/users/", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # In a real application, hash the password before storing
    hashed_password = user.password + "notreallyhashed" # Placeholder
    db_user = models.User(username=user.username, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=list[User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.get("/users/{user_id}", response_model=User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    hashed_password = user.password + "notreallyhashed" # Placeholder
    db_user.username = user.username
    db_user.hashed_password = hashed_password
    db_user.role = user.role
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/users/{user_id}", response_model=User)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return db_user

# API Endpoints for Staff Module
@app.post("/staff/", response_model=Staff)
def create_staff(staff: StaffCreate, db: Session = Depends(get_db)):
    db_staff = models.Staff(**staff.dict())
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

@app.get("/staff/", response_model=list[Staff])
def read_staff(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    staff = db.query(models.Staff).offset(skip).limit(limit).all()
    return staff

@app.get("/staff/{staff_id}", response_model=Staff)
def read_staff_member(staff_id: int, db: Session = Depends(get_db)):
    staff_member = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if staff_member is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff_member

@app.put("/staff/{staff_id}", response_model=Staff)
def update_staff(staff_id: int, staff: StaffCreate, db: Session = Depends(get_db)):
    db_staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if db_staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    for key, value in staff.dict().items():
        setattr(db_staff, key, value)
    db.commit()
    db.refresh(db_staff)
    return db_staff

@app.delete("/staff/{staff_id}", response_model=Staff)
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    db_staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if db_staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    db.delete(db_staff)
    db.commit()
    return db_staff

# API Endpoints for Payment Module
@app.post("/payments/", response_model=Payment)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    # Create payment record
    db_payment = models.Payment(**payment.dict())
    db.add(db_payment)
    
    # Update bill's paid_amount
    bill = db.query(models.Bill).filter(models.Bill.id == payment.bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    bill.paid_amount = (bill.paid_amount or 0) + payment.amount
    
    # Update bill status
    if bill.paid_amount >= bill.amount:
        bill.status = "Paid"
    elif bill.paid_amount > 0:
        bill.status = "Partial"
    
    db.commit()
    db.refresh(db_payment)
    return db_payment

@app.get("/payments/", response_model=list[Payment])
def read_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    payments = db.query(models.Payment).offset(skip).limit(limit).all()
    return payments

@app.get("/payments/bill/{bill_id}", response_model=list[Payment])
def get_payments_by_bill(bill_id: int, db: Session = Depends(get_db)):
    payments = db.query(models.Payment).filter(models.Payment.bill_id == bill_id).all()
    return payments
