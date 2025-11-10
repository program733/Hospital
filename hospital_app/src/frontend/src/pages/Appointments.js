import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [okMessage, setOkMessage] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // form state
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("Scheduled");
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, patRes, docRes] = await Promise.all([
          api.get("/appointments"),
          api.get("/patients"),
          api.get("/doctors"),
        ]);
        const appts = Array.isArray(apptRes.data) ? apptRes.data : [];
        setAppointments(appts);
        setFiltered(appts);
        setPatients(Array.isArray(patRes.data) ? patRes.data : []);
        setDoctors(Array.isArray(docRes.data) ? docRes.data : []);
      } catch (err) {
        setError(err.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!query) {
      setFiltered(appointments);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      appointments.filter(
        (a) =>
          String(a.id).includes(q) ||
          (a.patient_id && String(a.patient_id).includes(q)) ||
          (a.doctor_id && String(a.doctor_id).includes(q)) ||
          (a.status && a.status.toLowerCase().includes(q)) ||
          (a.reason && a.reason.toLowerCase().includes(q))
      )
    );
  }, [query, appointments]);

  const resetForm = () => {
    setPatientId("");
    setDoctorId("");
    setAppointmentTime("");
    setReason("");
    setStatus("Scheduled");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setOkMessage(null);

    if (!patientId || !doctorId || !appointmentTime) {
      setError("Patient, Doctor, and Appointment Time are required.");
      return;
    }

    const payload = {
      patient_id: parseInt(patientId, 10),
      doctor_id: parseInt(doctorId, 10),
      appointment_time: new Date(appointmentTime).toISOString(),
      reason: reason.trim() || null,
      status: status,
    };

    try {
      setSubmitting(true);
      const res = await api.post("/appointments", payload);
      const created = res.data;
      setAppointments((prev) => [created, ...prev]);
      setFiltered((prev) => [created, ...prev]);
      resetForm();
      setOkMessage("Appointment scheduled successfully.");
      setTimeout(() => setOkMessage(null), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to schedule appointment");
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

  return (
    <div className="page appointments-page">
      <header className="hero">
        <div>
          <h1>📅 Hospital Management — Appointments</h1>
          <p className="hero-sub">Schedule and manage patient appointments</p>
        </div>
      </header>

      <div className="content-grid">
        <aside className="card form-card">
          <h3>Schedule Appointment</h3>
          <form onSubmit={handleSubmit} className="appointment-form">
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
              Appointment Time <span className="muted">*</span>
              <input
                type="datetime-local"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
              />
            </label>

            <label>
              Reason
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Check-up" />
            </label>

            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? "Scheduling..." : "Schedule Appointment"}
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
            <h3>Appointment List</h3>
            <div>
              <input
                className="search"
                placeholder="Search by ID, patient, doctor, status..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="center">Loading appointments...</div>
          ) : filtered.length === 0 ? (
            <div className="center muted">No appointments found.</div>
          ) : (
            <div className="table-wrap">
              <table className="striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td className="mono">{a.id}</td>
                      <td>{getPatientName(a.patient_id)}</td>
                      <td>{getDoctorName(a.doctor_id)}</td>
                      <td>{a.appointment_time ? new Date(a.appointment_time).toLocaleString() : "—"}</td>
                      <td>{a.reason ?? "—"}</td>
                      <td>{a.status ?? "—"}</td>
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
