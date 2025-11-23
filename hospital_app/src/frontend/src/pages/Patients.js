import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [okMessage, setOkMessage] = useState(null);

  // form state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [assignedDoctorId, setAssignedDoctorId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patRes, docRes] = await Promise.all([
          api.get("/patients/"),
          api.get("/doctors/"),
        ]);
        const patientsData = Array.isArray(patRes.data) ? patRes.data : [];
        setPatients(patientsData);
        setFiltered(patientsData);
        setDoctors(Array.isArray(docRes.data) ? docRes.data : []);
      } catch (err) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!query) {
      setFiltered(patients);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      patients.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.contact_number && p.contact_number.toLowerCase().includes(q)) ||
          (p.aadhar_number && p.aadhar_number.includes(q)) ||
          String(p.id).includes(q)
      )
    );
  }, [query, patients]);

  const resetForm = () => {
    setName("");
    setAge("");
    setGender("");
    setContact("");
    setAddress("");
    setAadhar("");
    setBloodGroup("");
    setDob("");
    setEmail("");
    setEmergencyName("");
    setEmergencyContact("");
    setMaritalStatus("");
    setAssignedDoctorId("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!name.trim() || !contact.trim()) {
      setError("Please fill all required fields");
      return;
    }

    if (contact.length !== 10) {
      setError("Contact Number must be exactly 10 digits");
      return;
    }

    const payload = {
      name: name.trim(),
      age: age ? parseInt(age, 10) : 0,
      gender: gender || null,
      contact_number: contact.trim(),
      address: address.trim() || null,
      aadhar_number: aadhar.trim() || null,
      blood_group: bloodGroup || null,
      dob: dob ? new Date(dob).toISOString() : null,
      email: email.trim() || null,
      emergency_contact_name: emergencyName.trim() || null,
      emergency_contact_number: emergencyContact.trim() || null,
      marital_status: maritalStatus || null,
      assigned_doctor_id: assignedDoctorId ? parseInt(assignedDoctorId, 10) : null,
    };

    try {
      setSubmitting(true);
      const res = await api.post("/patients/", payload);
      const created = res.data;
      setPatients((prev) => [created, ...prev]);
      setFiltered((prev) => [created, ...prev]);
      resetForm();
      setOkMessage("✓ Patient registered");
      setTimeout(() => setOkMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to add patient");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setContact(value);
    }
  };

  const getDoctorName = (id) => {
    const doc = doctors.find(d => d.id === id);
    return doc ? doc.name : "—";
  };

  const handlePrintPatient = (patient) => {
    const printWindow = window.open("", "_blank");
    const doctorName = patient.assigned_doctor_id ? getDoctorName(patient.assigned_doctor_id) : "Not Assigned";
    const doctor = doctors.find(d => d.id === patient.assigned_doctor_id);
    const doctorSpec = doctor ? doctor.specialization : "";

    printWindow.document.write(`
      <html>
        <head>
          <title>Patient Card - ${patient.name}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              position: relative;
            }
            
            /* Header - Hospital & Doctor Info */
            .header {
              background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
              color: white;
              padding: 20mm 15mm;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            
            .hospital-info {
              flex: 1;
            }
            
            .hospital-logo {
              font-size: 48px;
              margin-bottom: 10px;
            }
            
            .hospital-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .hospital-tagline {
              font-size: 12px;
              opacity: 0.9;
            }
            
            .doctor-info {
              text-align: right;
              background: rgba(255,255,255,0.1);
              padding: 15px;
              border-radius: 8px;
              min-width: 200px;
            }
            
            .doctor-label {
              font-size: 11px;
              opacity: 0.8;
              margin-bottom: 5px;
            }
            
            .doctor-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 3px;
            }
            
            .doctor-spec {
              font-size: 13px;
              opacity: 0.9;
            }
            
            /* Blank space for doctor notes */
            .notes-area {
              min-height: 160mm;
              padding: 15mm;
              border-left: 3px solid #e3f2fd;
              border-right: 3px solid #e3f2fd;
              background: linear-gradient(to bottom, 
                transparent 0%, 
                transparent calc(100% - 1px), 
                #e0e0e0 calc(100% - 1px), 
                #e0e0e0 100%) 0 0 / 100% 8mm;
            }
            
            .notes-title {
              color: #666;
              font-size: 14px;
              margin-bottom: 10mm;
              text-align: center;
              font-style: italic;
            }
            
            /* Footer - Patient Details */
            .footer {
              background: #f5f5f5;
              padding: 15mm;
              border-top: 3px solid #1976d2;
            }
            
            .patient-details {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              margin-bottom: 10px;
            }
            
            .detail-item {
              padding: 8px;
              background: white;
              border-radius: 4px;
              border-left: 3px solid #1976d2;
            }
            
            .detail-label {
              font-size: 10px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 3px;
            }
            
            .detail-value {
              font-size: 13px;
              color: #333;
              font-weight: 600;
            }
            
            .footer-note {
              text-align: center;
              font-size: 10px;
              color: #999;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
            }
            
            @media print {
              body {
                width: 210mm;
                height: 297mm;
              }
              
              .header {
                break-inside: avoid;
              }
              
              .footer {
                break-inside: avoid;
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
              }
            }
          </style>
        </head>
        <body>
          <!-- Header: Hospital & Doctor Info -->
          <div class="header">
            <div class="hospital-info">
              <div class="hospital-logo">🏥</div>
              <div class="hospital-name">Janta Hospital</div>
              <div class="hospital-tagline">Jarangdih Phusro, Bokaro</div>
            </div>
            <div class="doctor-info">
              <div class="doctor-label">CONSULTING PHYSICIAN</div>
              <div class="doctor-name">Dr. ${doctorName}</div>
              <div class="doctor-spec">${doctorSpec}</div>
            </div>
          </div>
          
          <!-- Blank area for doctor's notes -->
          <div class="notes-area">
            <div class="notes-title">— Doctor's Notes & Observations —</div>
          </div>
          
          <!-- Footer: Patient Details -->
          <div class="footer">
            <div class="patient-details">
              <div class="detail-item">
                <div class="detail-label">Patient ID</div>
                <div class="detail-value">#${patient.id}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Patient Name</div>
                <div class="detail-value">${patient.name}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Age / Gender</div>
                <div class="detail-value">${patient.age} yrs / ${patient.gender || 'N/A'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Blood Group</div>
                <div class="detail-value">${patient.blood_group || 'N/A'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Contact</div>
                <div class="detail-value">+91 ${patient.contact_number}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Date</div>
                <div class="detail-value">${new Date().toLocaleDateString('en-IN')}</div>
              </div>
            </div>
            <div class="footer-note">
              This is a computer-generated document. For appointments: +91-XXXX-XXXX | Email: info@cityhospital.com
            </div>
          </div>

          <script>
            window.onload = function() { 
              setTimeout(() => window.print(), 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="page patients-page">
       <header className="hero" style={{ padding: '5px 10px' }}>
         <div>
           <h3 style={{ margin: 0, fontSize: '1.2em' }}>👤 Patients</h3>
           <p className="hero-sub" style={{ margin: '2px 0 0', fontSize: '0.85em' }}>Register new patients and view patient records</p>
         </div>
       </header>

      <div className="content-grid">
        <aside className="card form-card">
          <h3>Add Patient</h3>
          <form onSubmit={handleSubmit} className="patient-form">
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
            </label>

            <label>
              Age
              <input type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 30" />
            </label>

            <label>
              Gender
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Date of Birth
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </label>

            <label>
              Blood Group
              <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </label>

            <label>
              Aadhar Number (UID)
              <input value={aadhar} onChange={(e) => setAadhar(e.target.value)} placeholder="12-digit UID" maxLength="12" />
            </label>

            <label>
              Contact Number
              <input
                value={contact}
                onChange={handleContactChange}
                placeholder="10-digit mobile"
                type="tel"
                required
              />
            </label>

            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@example.com" />
            </label>

            <label className="full-width">
              Address
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, State" />
            </label>

            <label>
              Marital Status
              <select value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)}>
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </label>

            <label>
              Assigned Doctor
              <select value={assignedDoctorId} onChange={(e) => setAssignedDoctorId(e.target.value)} required>
                <option value="">Select Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} - {d.specialization}
                  </option>
                ))}
              </select>
              <small className="help-text">Primary doctor for this patient</small>
            </label>

            <label>
              Emergency Contact Name
              <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} placeholder="Contact Name" />
            </label>

            <label>
              Emergency Contact Number
              <input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Contact Number" />
            </label>

            <div className="form-actions full-width">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Add Patient"}
              </button>
              <button className="btn" type="button" onClick={resetForm} disabled={submitting}>
                Reset
              </button>
            </div>

            {error && <div className="alert error compact">{error}</div>}
            {okMessage && <div className="alert success compact">{okMessage}</div>}
          </form>
        </aside>

        <section className="card list-card">
          <div className="list-header">
            <h3>Patient List</h3>
            <div>
              <input
                className="search"
                placeholder="Search by name, contact, Aadhar or ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="center">Loading patients...</div>
          ) : filtered.length === 0 ? (
            <div className="center muted">No patients found.</div>
          ) : (
            <div className="table-wrap">
              <table className="striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Age/Gender</th>
                    <th>Contact</th>
                    <th>Doctor</th>
                    <th>Blood Group</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.age} / {p.gender}</td>
                      <td>{p.contact_number}</td>
                      <td>{getDoctorName(p.assigned_doctor_id)}</td>
                      <td>{p.blood_group ?? "—"}</td>
                      <td>
                        <button
                          className="btn small secondary"
                          onClick={() => handlePrintPatient(p)}
                        >
                          🖨 Print Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}