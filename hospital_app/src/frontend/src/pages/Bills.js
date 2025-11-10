import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [okMessage, setOkMessage] = useState(null);
  const [patients, setPatients] = useState([]);

  // form state
  const [patientId, setPatientId] = useState("");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Pending");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billRes, patRes] = await Promise.all([
          api.get("/bills"),
          api.get("/patients"),
        ]);
        const billsData = Array.isArray(billRes.data) ? billRes.data : [];
        setBills(billsData);
        setFiltered(billsData);
        setPatients(Array.isArray(patRes.data) ? patRes.data : []);
      } catch (err) {
        setError(err.message || "Failed to load bills");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!query) {
      setFiltered(bills);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      bills.filter(
        (b) =>
          String(b.id).includes(q) ||
          (b.patient_id && String(b.patient_id).includes(q)) ||
          (b.status && b.status.toLowerCase().includes(q)) ||
          (b.amount && String(b.amount).includes(q))
      )
    );
  }, [query, bills]);

  const resetForm = () => {
    setPatientId("");
    setAmount("");
    setIssueDate("");
    setDueDate("");
    setStatus("Pending");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!patientId || !amount || !issueDate || !dueDate) {
      setError("Patient, Amount, Issue Date, and Due Date are required.");
      return;
    }

    const payload = {
      patient_id: parseInt(patientId, 10),
      amount: parseInt(amount, 10),
      issue_date: new Date(issueDate).toISOString(),
      due_date: new Date(dueDate).toISOString(),
      status: status,
    };

    try {
      setSubmitting(true);
      const res = await api.post("/bills", payload);
      const created = res.data;
      setBills((prev) => [created, ...prev]);
      setFiltered((prev) => [created, ...prev]);
      resetForm();
      setOkMessage("Bill created successfully.");
      setTimeout(() => setOkMessage(null), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  const getPatientName = (id) => {
    const p = patients.find((pat) => pat.id === id);
    return p ? p.name : `Patient ${id}`;
  };

  return (
    <div className="page bills-page">
      <header className="hero">
        <div>
          <h1>💰 Hospital Management — Bills</h1>
          <p className="hero-sub">Create and manage patient billing</p>
        </div>
      </header>

      <div className="content-grid">
        <aside className="card form-card">
          <h3>Create Bill</h3>
          <form onSubmit={handleSubmit} className="bill-form">
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
              Amount <span className="muted">*</span>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 150"
              />
            </label>

            <div className="row">
              <label>
                Issue Date <span className="muted">*</span>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </label>

              <label>
                Due Date <span className="muted">*</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
            </div>

            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </label>

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Bill"}
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
            <h3>Bill List</h3>
            <div>
              <input
                className="search"
                placeholder="Search by ID, patient, amount or status..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="center">Loading bills...</div>
          ) : filtered.length === 0 ? (
            <div className="center muted">No bills found.</div>
          ) : (
            <div className="table-wrap">
              <table className="striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id}>
                      <td className="mono">{b.id}</td>
                      <td>{getPatientName(b.patient_id)}</td>
                      <td>${b.amount ?? "—"}</td>
                      <td>{b.status ?? "—"}</td>
                      <td>{b.issue_date ? new Date(b.issue_date).toLocaleDateString() : "—"}</td>
                      <td>{b.due_date ? new Date(b.due_date).toLocaleDateString() : "—"}</td>
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
