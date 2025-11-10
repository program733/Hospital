import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [okMessage, setOkMessage] = useState(null);

  // form state
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/doctors")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setDoctors(data);
        setFiltered(data);
      })
      .catch((err) => setError(err.message || "Failed to load doctors"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query) {
      setFiltered(doctors);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      doctors.filter(
        (d) =>
          (d.name && d.name.toLowerCase().includes(q)) ||
          (d.specialization && d.specialization.toLowerCase().includes(q)) ||
          (d.contact_number && d.contact_number.toLowerCase().includes(q)) ||
          (d.email && d.email.toLowerCase().includes(q)) ||
          String(d.id).includes(q)
      )
    );
  }, [query, doctors]);

  const resetForm = () => {
    setName("");
    setSpecialization("");
    setContact("");
    setEmail("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!name.trim() || !contact.trim() || !email.trim()) {
      setError("Name, Contact Number, and Email are required.");
      return;
    }

    const payload = {
      name: name.trim(),
      specialization: specialization.trim() || null,
      contact_number: contact.trim(),
      email: email.trim(),
    };

    try {
      setSubmitting(true);
      const res = await api.post("/doctors", payload);
      const created = res.data;
      setDoctors((prev) => [created, ...prev]);
      setFiltered((prev) => [created, ...prev]);
      resetForm();
      setOkMessage("Doctor added successfully.");
      setTimeout(() => setOkMessage(null), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to add doctor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page doctors-page">
      <header className="hero">
        <div>
          <h1>👨‍⚕️ Hospital Management — Doctors</h1>
          <p className="hero-sub">Register new doctors and view doctor records</p>
        </div>
      </header>

      <div className="content-grid">
        <aside className="card form-card">
          <h3>Add Doctor</h3>
          <form onSubmit={handleSubmit} className="doctor-form">
            <label>
              Name <span className="muted">*</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </label>

            <label>
              Specialization
              <input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Cardiology" />
            </label>

            <label>
              Contact Number <span className="muted">*</span>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+1-555-555-5555" />
            </label>

            <label>
              Email <span className="muted">*</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@example.com" />
            </label>

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Doctor"}
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
            <h3>Doctor List</h3>
            <div>
              <input
                className="search"
                placeholder="Search by name, specialization, contact or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="center">Loading doctors...</div>
          ) : filtered.length === 0 ? (
            <div className="center muted">No doctors found.</div>
          ) : (
            <div className="table-wrap">
              <table className="striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Specialization</th>
                    <th>Contact</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id}>
                      <td className="mono">{d.id}</td>
                      <td>{d.name}</td>
                      <td>{d.specialization ?? "—"}</td>
                      <td>{d.contact_number ?? "—"}</td>
                      <td>{d.email ?? "—"}</td>
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
