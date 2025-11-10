import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [okMessage, setOkMessage] = useState(null);

  // form state
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/staff")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setStaff(data);
        setFiltered(data);
      })
      .catch((err) => setError(err.message || "Failed to load staff"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query) {
      setFiltered(staff);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      staff.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.position && s.position.toLowerCase().includes(q)) ||
          (s.contact_number && s.contact_number.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          String(s.id).includes(q)
      )
    );
  }, [query, staff]);

  const resetForm = () => {
    setUserId("");
    setName("");
    setPosition("");
    setContact("");
    setEmail("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!userId.trim() || !name.trim() || !contact.trim() || !email.trim()) {
      setError("User ID, Name, Contact Number, and Email are required.");
      return;
    }

    const payload = {
      user_id: userId.trim(),
      name: name.trim(),
      position: position.trim() || null,
      contact_number: contact.trim(),
      email: email.trim(),
    };

    try {
      setSubmitting(true);
      const res = await api.post("/staff", payload);
      const created = res.data;
      setStaff((prev) => [created, ...prev]);
      setFiltered((prev) => [created, ...prev]);
      resetForm();
      setOkMessage("Staff member added successfully.");
      setTimeout(() => setOkMessage(null), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to add staff");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page staff-page">
      <header className="hero">
        <div>
          <h1>👥 Hospital Management — Staff</h1>
          <p className="hero-sub">Manage hospital staff members</p>
        </div>
      </header>

      <div className="content-grid">
        <aside className="card form-card">
          <h3>Add Staff Member</h3>
          <form onSubmit={handleSubmit} className="staff-form">
            <label>
              User ID <span className="muted">*</span>
              <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Unique user ID" />
            </label>

            <label>
              Name <span className="muted">*</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </label>

            <label>
              Position
              <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Nurse, Admin" />
            </label>

            <label>
              Contact Number <span className="muted">*</span>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+1-555-555-5555" />
            </label>

            <label>
              Email <span className="muted">*</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" />
            </label>

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Staff"}
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
            <h3>Staff List</h3>
            <div>
              <input
                className="search"
                placeholder="Search by name, position, contact or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="center">Loading staff...</div>
          ) : filtered.length === 0 ? (
            <div className="center muted">No staff found.</div>
          ) : (
            <div className="table-wrap">
              <table className="striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Contact</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{s.id}</td>
                      <td>{s.user_id ?? "—"}</td>
                      <td>{s.name}</td>
                      <td>{s.position ?? "—"}</td>
                      <td>{s.contact_number ?? "—"}</td>
                      <td>{s.email ?? "—"}</td>
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
