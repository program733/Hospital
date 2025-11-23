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
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  // Medicine search
  const [medicineSearch, setMedicineSearch] = useState("");
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);

  const instructionSuggestions = [
    "Take 2 times a day after meals",
    "Take 3 times a day before meals",
    "Take once daily at bedtime",
    "Take as needed for pain",
    "Apply topically 2 times daily",
    "Take 1 tablet every 6 hours",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [presRes, patRes, docRes, medRes] = await Promise.all([
          api.get("/prescriptions/"),
          api.get("/patients/"),
          api.get("/doctors/"),
          api.get("/medicines/"),
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
    setMedicineSearch("");
  };

  const addMedicine = (medicine) => {
    const existing = selectedMedicines.find(m => m.medicine_id === medicine.id);
    if (existing) {
      setError("Medicine already added");
      setTimeout(() => setError(null), 2000);
      return;
    }
    setSelectedMedicines(prev => [...prev, {
      medicine_id: medicine.id,
      medicine_name: medicine.name,
      quantity: 1,
      instruction: "Take 2 times a day after meals",
      price: medicine.price
    }]);
    setMedicineSearch("");
    setShowMedicineDropdown(false);
  };

  const updateMedicine = (medicineId, field, value) => {
    setSelectedMedicines(prev =>
      prev.map(m => m.medicine_id === medicineId ? { ...m, [field]: value } : m)
    );
  };

  const removeMedicine = (medicineId) => {
    setSelectedMedicines(prev => prev.filter(m => m.medicine_id !== medicineId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!patientId || !doctorId || selectedMedicines.length === 0) {
      setError("Please fill all required fields");
      return;
    }

    const payload = {
      patient_id: parseInt(patientId, 10),
      doctor_id: parseInt(doctorId, 10),
      instructions: selectedMedicines.map(m => `${m.medicine_name}: ${m.instruction}`).join("; "),
      medicines: selectedMedicines.map(m => ({
        medicine_id: m.medicine_id,
        quantity: parseInt(m.quantity) || 1
      })),
    };

    try {
      setSubmitting(true);
      const res = await api.post("/prescriptions/", payload);
      const created = res.data;
      setPrescriptions(prev => [created, ...prev]);
      setFiltered(prev => [created, ...prev]);
      resetForm();
      setOkMessage("✓ Prescription created");
      setTimeout(() => setOkMessage(null), 3000);
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
    const p = patients.find(pat => pat.id === id);
    return p ? p.name : `Patient ${id}`;
  };

  const getDoctorName = (id) => {
    const d = doctors.find(doc => doc.id === id);
    return d ? d.name : `Doctor ${id}`;
  };

  const getMedicineName = (id) => {
    const m = medicines.find(med => med.id === id);
    return m ? m.name : `Medicine ${id}`;
  };

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(medicineSearch.toLowerCase())
  );

  const totalCost = selectedMedicines.reduce((sum, m) => sum + (m.price * m.quantity), 0);

  return (
    <div className="page prescriptions-page">
       <header className="hero" style={{ padding: '5px 10px' }}>
         <div>
           <h3 style={{ margin: 0, fontSize: '1.2em' }}>📋 Prescriptions</h3>
           <p className="hero-sub" style={{ margin: '2px 0 0', fontSize: '0.85em' }}>Create and manage patient prescriptions</p>
         </div>
       </header>

      <div className="content-grid">
        <aside className="card form-card">
          <h3>Create Prescription</h3>
          <form onSubmit={handleSubmit} className="prescription-form">
            <label className="full-width">
              Doctor
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} required>
                <option value="">Select Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} - {d.specialization}
                  </option>
                ))}
              </select>
            </label>

            <label className="full-width">
              Patient
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
                <option value="">Select Patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ID: {p.id})
                  </option>
                ))}
              </select>
            </label>

            <div className="full-width medicine-section">
              <h4>Add Medicines</h4>

              <div className="medicine-search-wrapper">
                <input
                  type="text"
                  placeholder="Search medicine..."
                  value={medicineSearch}
                  onChange={(e) => {
                    setMedicineSearch(e.target.value);
                    setShowMedicineDropdown(true);
                  }}
                  onFocus={() => setShowMedicineDropdown(true)}
                />

                {showMedicineDropdown && medicineSearch && (
                  <div className="medicine-dropdown">
                    {filteredMedicines.length > 0 ? (
                      filteredMedicines.slice(0, 10).map(medicine => (
                        <div
                          key={medicine.id}
                          className="medicine-option"
                          onClick={() => addMedicine(medicine)}
                        >
                          <div>
                            <strong>{medicine.name}</strong>
                            <small className="muted"> - Stock: {medicine.stock}</small>
                          </div>
                          <span className="medicine-price">${medicine.price}</span>
                        </div>
                      ))
                    ) : (
                      <div className="medicine-option disabled">No medicines found</div>
                    )}
                  </div>
                )}
              </div>

              {selectedMedicines.map((med) => (
                <div key={med.medicine_id} className="medicine-row">
                  <div>
                    <strong>{med.medicine_name}</strong>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={med.quantity}
                    onChange={(e) => updateMedicine(med.medicine_id, 'quantity', e.target.value)}
                    placeholder="Qty"
                  />
                  <select
                    value={med.instruction}
                    onChange={(e) => updateMedicine(med.medicine_id, 'instruction', e.target.value)}
                  >
                    {instructionSuggestions.map((suggestion, idx) => (
                      <option key={idx} value={suggestion}>
                        {suggestion}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeMedicine(med.medicine_id)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}

              {selectedMedicines.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0f8ff', borderRadius: '4px' }}>
                  <strong>Total Cost: ${totalCost}</strong>
                </div>
              )}
            </div>

            <div className="form-actions full-width">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Prescription"}
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
            <h3>Prescription List</h3>
            <div>
              <input
                className="search"
                placeholder="Search prescriptions..."
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
                      <td className="instruction-cell">{p.instructions ?? "—"}</td>
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
