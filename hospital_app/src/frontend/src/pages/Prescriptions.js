import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [okMessage, setOkMessage] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [medicines, setMedicines] = useState([]);

  // form state
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [presRes, patRes, docRes, medRes] = await Promise.all([
          api.get("/prescriptions"),
          api.get("/patients"),
          api.get("/doctors"),
          api.get("/medicines"),
        ]);
        const pres = Array.isArray(presRes.data) ? presRes.data : [];
        setPrescriptions(pres);
        setFiltered(pres);
        setPatients(Array.isArray(patRes.data) ? patRes.data : []);
        setDoctors(Array.isArray(docRes.data) ? docRes.data : []);
        setMedicines(Array.isArray(medRes.data) ? medRes.data : []);
      } catch (err) {
        setError(err.message || "Failed to load prescriptions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!query) {
      setFiltered(prescriptions);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      prescriptions.filter(
        (p) =>
          String(p.id).includes(q) ||
          (p.patient_id && String(p.patient_id).includes(q)) ||
          (p.doctor_id && String(p.doctor_id).includes(q)) ||
          (p.instructions && p.instructions.toLowerCase().includes(q))
      )
    );
  }, [query, prescriptions]);

  const resetForm = () => {
    setPatientId("");
    setDoctorId("");
    setSelectedMedicines([]);
    setInstructions("");
  };

  const handleMedicineChange = (medicineId, quantity) => {
    const medId = parseInt(medicineId, 10);
    const qty = parseInt(quantity, 10);
    setSelectedMedicines((prev) => {
      const existing = prev.find((m) => m.medicine_id === medId);
      if (existing) {
        return prev.map((m) => (m.medicine_id === medId ? { ...m, quantity: qty } : m));
      } else {
        return [...prev, { medicine_id: medId, quantity: qty }];
      }
    });
  };

  const removeMedicine = (medicineId) => {
    setSelectedMedicines((prev) => prev.filter((m) => m.medicine_id !== medicineId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!patientId || !doctorId || selectedMedicines.length === 0) {
      setError("Patient, Doctor, and at least one medicine are required.");
      return;
    }

    // Filter out medicines with empty medicine_id
    const validMedicines = selectedMedicines.filter(med => med.medicine_id && med.medicine_id !== "");

    if (validMedicines.length === 0) {
      setError("At least one valid medicine must be selected.");
      return;
    }

    const payload = {
      patient_id: parseInt(patientId, 10),
      doctor_id: parseInt(doctorId, 10),
      instructions: instructions.trim() || null,
      medicines: validMedicines,
    };

    try {
      setSubmitting(true);
      const res = await api.post("/prescriptions", payload);
      const created = res.data;
      setPrescriptions((prev) => [created, ...prev]);
      setFiltered((prev) => [created, ...prev]);
      resetForm();
      setOkMessage("Prescription created successfully.");
      setTimeout(() => setOkMessage(null), 3500);
    } catch (err) {
      let errorMsg = "Failed to create prescription";
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map(d => d.msg).join(", ");
        } else {
          errorMsg = err.response.data.detail;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getPatientName = (id) => {
    const p = patients.find((pat) => pat.id === id);
    return p ? p.name : `Patient ${id}`;
  };

  const getDoctorName = (id) => {
    const d = doctors.find((doc) => doc.id === id);
    return d ? d.name : `Doctor ${id}`;
  };

  const getMedicineName = (id) => {
    const m = medicines.find((med) => med.id === id);
    return m ? m.name : `Medicine ${id}`;
  };

  return (
    <div className="page prescriptions-page">
      <header className="hero">
        <div>
          <h1>📋 Hospital Management — Prescriptions</h1>
          <p className="hero-sub">Create and manage patient prescriptions</p>
        </div>
      </header>

      <div className="content-grid">
        <aside className="card form-card">
          <h3>Create Prescription</h3>
          <form onSubmit={handleSubmit} className="prescription-form">
            <label>
              Patient <span className="muted">*</span>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ID: {p.id})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Doctor <span className="muted">*</span>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">Select Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} - {d.specialization} (ID: {d.id})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Instructions
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Dosage instructions, e.g. Take 2 tablets daily"
                rows="3"
              />
            </label>

            <div>
              <h4>Medicines <span className="muted">*</span></h4>
              {selectedMedicines.map((med) => (
                <div key={med.medicine_id} className="row" style={{ marginBottom: "0.5rem" }}>
                  <select
                    value={med.medicine_id}
                    onChange={(e) => handleMedicineChange(e.target.value, med.quantity)}
                  >
                    <option value="">Select Medicine</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={med.quantity}
                    onChange={(e) => handleMedicineChange(med.medicine_id, e.target.value)}
                    placeholder="Qty"
                  />
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => removeMedicine(med.medicine_id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn secondary"
                onClick={() => setSelectedMedicines((prev) => [...prev, { medicine_id: "", quantity: 1 }])}
              >
                Add Medicine
              </button>
            </div>

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Prescription"}
              </button>
              <button className="btn" type="button" onClick={resetForm} disabled={submitting}>
                Reset
              </button>
            </div>

            {error && <div className="alert error">{error}</div>}
            {okMessage && <div className="alert success">{okMessage}</div>}
            <p className="footnote">Required fields marked with *</p>
          </form>
        </aside>

        <section className="card list-card">
          <div className="list-header">
            <h3>Prescription List</h3>
            <div>
              <input
                className="search"
                placeholder="Search by ID, patient, doctor or instructions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="center">Loading prescriptions...</div>
          ) : filtered.length === 0 ? (
            <div className="center muted">No prescriptions found.</div>
          ) : (
            <div className="table-wrap">
              <table className="striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Medicines</th>
                    <th>Instructions</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{p.id}</td>
                      <td>{getPatientName(p.patient_id)}</td>
                      <td>{getDoctorName(p.doctor_id)}</td>
                      <td>
                        {p.medicines && p.medicines.length > 0
                          ? p.medicines.map((m) => `${getMedicineName(m.medicine_id)} (${m.quantity})`).join(", ")
                          : "—"}
                      </td>
                      <td>{p.instructions ?? "—"}</td>
                      <td>{p.prescription_date ? new Date(p.prescription_date).toLocaleDateString() : "—"}</td>
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
