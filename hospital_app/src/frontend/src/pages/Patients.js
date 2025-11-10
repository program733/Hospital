import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [okMessage, setOkMessage] = useState(null);

  // form state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/patients")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setPatients(data);
        setFiltered(data);
      })
      .catch((err) => setError(err.message || "Failed to load patients"))
      .finally(() => setLoading(false));
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!name.trim() || !contact.trim()) {
      setError("Name and Contact Number are required.");
      return;
    }
    const payload = {
      name: name.trim(),
      age: age ? parseInt(age, 10) : null,
      gender: gender || null,
      contact_number: contact.trim(),
      address: address.trim() || null,
    };

    try {
      setSubmitting(true);
      const res = await api.post("/patients", payload);
      const created = res.data;
      setPatients((prev) => [created, ...prev]);
      setFiltered((prev) => [created, ...prev]);
      resetForm();
      setOkMessage("Patient added successfully.");
      setTimeout(() => setOkMessage(null), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to add patient");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page patients-page">
      <header className="hero">
        <div>
          <h1>Hospital Management — Patients</h1>
          <p className="hero-sub">Register new patients and view patient records</p>
        </div>
      </header>

      <div className="content-grid">
        <aside className="card form-card">
          <h3>Add Patient</h3>
          <form onSubmit={handleSubmit} className="patient-form">
            <label>
              Name <span className="muted">*</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </label>

            <div className="row">
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
            </div>

            <label>
              Contact Number <span className="muted">*</span>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+1-555-555-5555" />
            </label>

            <label>
              Address
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, State" />
            </label>

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Patient"}
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
            <h3>Patient List</h3>
            <div>
              <input
                className="search"
                placeholder="Search by name, contact or ID..."
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
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.age ?? "—"}</td>
                      <td>{p.gender ?? "—"}</td>
                      <td>{p.contact_number ?? "—"}</td>
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