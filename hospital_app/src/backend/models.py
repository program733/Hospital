from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    gender = Column(String)
    contact_number = Column(String, index=True)
    address = Column(String)
    aadhar_number = Column(String, unique=True, index=True)
    blood_group = Column(String)
    dob = Column(DateTime)
    email = Column(String)
    emergency_contact_name = Column(String)
    emergency_contact_number = Column(String)
    marital_status = Column(String)
    assigned_doctor_id = Column(Integer, ForeignKey("doctors.id"))

    appointments = relationship("Appointment", back_populates="patient")
    medical_records = relationship("MedicalRecord", back_populates="patient")
    bills = relationship("Bill", back_populates="patient")
    assigned_doctor = relationship("Doctor")

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    specialization = Column(String)
    contact_number = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    consultation_fee = Column(Integer, default=500)

    appointments = relationship("Appointment", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    appointment_time = Column(DateTime, default=datetime.datetime.utcnow)
    reason = Column(String)
    status = Column(String, default="Scheduled") # Scheduled, Completed, Cancelled

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    diagnosis = Column(String)
    treatment = Column(String)
    record_date = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="medical_records")
    doctor = relationship("Doctor") # No back_populates needed if not listing medical records from doctor side

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    stock = Column(Integer)
    price = Column(Integer)
    expiry_date = Column(DateTime)
    batch_number = Column(String, index=True)
    manufacture_date = Column(DateTime)
    low_stock_threshold = Column(Integer, default=10)
    category = Column(String, index=True)
    supplier = Column(String)

    prescriptions = relationship("PrescriptionMedicine", back_populates="medicine")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    prescription_date = Column(DateTime, default=datetime.datetime.utcnow)
    instructions = Column(String)
    status = Column(String, default="Pending") # Pending, Billed

    patient = relationship("Patient")
    doctor = relationship("Doctor", back_populates="prescriptions")
    medicines = relationship("PrescriptionMedicine", back_populates="prescription")

class PrescriptionMedicine(Base):
    __tablename__ = "prescription_medicines"

    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), primary_key=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), primary_key=True)
    quantity = Column(Integer)

    prescription = relationship("Prescription", back_populates="medicines")
    medicine = relationship("Medicine", back_populates="prescriptions")

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    amount = Column(Integer)
    paid_amount = Column(Integer, default=0)
    issue_date = Column(DateTime, default=datetime.datetime.utcnow)
    due_date = Column(DateTime)
    status = Column(String, default="Pending") # Pending, Paid, Overdue, Partial

    patient = relationship("Patient", back_populates="bills")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"))
    amount = Column(Integer)
    payment_method = Column(String)  # Cash, Card, PhonePay, GPay, etc.
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # Admin, Doctor, Nurse, Pharmacy, Patient

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    position = Column(String)
    contact_number = Column(String)
    email = Column(String, unique=True, index=True)

    user = relationship("User")
