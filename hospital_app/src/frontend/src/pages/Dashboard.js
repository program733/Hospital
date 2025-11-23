import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    medicines: 0,
    prescriptions: 0,
    bills: 0,
    staff: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [lowStockMedicines, setLowStockMedicines] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          patientsRes,
          doctorsRes,
          appointmentsRes,
          medicinesRes,
          prescriptionsRes,
          billsRes,
          staffRes,
          lowStockRes,
        ] = await Promise.all([
          api.get("/patients"),
          api.get("/doctors"),
          api.get("/appointments"),
          api.get("/medicines"),
          api.get("/prescriptions"),
          api.get("/bills"),
          api.get("/staff"),
          api.get("/medicines/low-stock"),
        ]);

        setStats({
          patients: patientsRes.data.length,
          doctors: doctorsRes.data.length,
          appointments: appointmentsRes.data.length,
          medicines: medicinesRes.data.length,
          prescriptions: prescriptionsRes.data.length,
          bills: billsRes.data.length,
          staff: staffRes.data.length,
        });

        // Get recent patients (last 5)
        setRecentPatients(patientsRes.data.slice(-5).reverse());

        // Get recent appointments (last 5)
        setRecentAppointments(appointmentsRes.data.slice(-5).reverse());

        // Set low stock medicines
        setLowStockMedicines(lowStockRes.data);
      } catch (err) {
        setError("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="spinner"></div>;
  if (error) return <div className="alert error">{error}</div>;

  return (
    <div className="page dashboard-page">
       <header className="hero" style={{ padding: '5px 10px' }}>
         <div>
           <h3 style={{ margin: 0, fontSize: '1.2em' }}>🏥 Dashboard</h3>
           <p className="hero-sub" style={{ margin: '2px 0 0', fontSize: '0.85em' }}>Overview of hospital operations and statistics</p>
         </div>
       </header>

      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>{stats.patients}</h3>
          <p>Total Patients</p>
        </div>
        <div className="stat-card">
          <h3>{stats.doctors}</h3>
          <p>Total Doctors</p>
        </div>
        <div className="stat-card">
          <h3>{stats.appointments}</h3>
          <p>Active Appointments</p>
        </div>
        <div className="stat-card">
          <h3>{stats.medicines}</h3>
          <p>Medicines in Stock</p>
        </div>
        <div className="stat-card">
          <h3>{stats.prescriptions}</h3>
          <p>Total Prescriptions</p>
        </div>
        <div className="stat-card">
          <h3>{stats.bills}</h3>
          <p>Pending Bills</p>
        </div>
        <div className="stat-card">
          <h3>{stats.staff}</h3>
          <p>Staff Members</p>
        </div>
      </div>

      {lowStockMedicines.length > 0 && (
        <div className="alert warning" style={{ margin: "20px 0" }}>
          <h3>⚠️ Low Stock Alert</h3>
          <p>The following medicines are running low on stock:</p>
          <ul>
            {lowStockMedicines.map((med) => (
              <li key={med.id}>
                <strong>{med.name}</strong>: {med.stock} remaining (Threshold: {med.low_stock_threshold})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dashboard-content">
        <div className="card">
          <h3>Recent Patients</h3>
          {recentPatients.length > 0 ? (
            <table className="striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.id}</td>
                    <td>{patient.name}</td>
                    <td>{patient.contact_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="center">No patients registered yet.</p>
          )}
        </div>

        <div className="card">
          <h3>Recent Appointments</h3>
          {recentAppointments.length > 0 ? (
            <table className="striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{appointment.id}</td>
                    <td>{appointment.patient_id}</td>
                    <td>{appointment.doctor_id}</td>
                    <td>{appointment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="center">No appointments scheduled yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <p>Welcome to the Hospital Management System. Use the sidebar navigation to manage patients, doctors, appointments, and more.</p>
      </div>
    </div>
  );
}
