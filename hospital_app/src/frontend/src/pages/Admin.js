import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Admin() {
  const [data, setData] = useState({
    patients: [],
    doctors: [],
    appointments: [],
    medicines: [],
    prescriptions: [],
    bills: [],
    staff: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState("patients");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          patientsRes,
          doctorsRes,
          appointmentsRes,
          medicinesRes,
          prescriptionsRes,
          billsRes,
          staffRes,
        ] = await Promise.all([
          api.get("/patients"),
          api.get("/doctors"),
          api.get("/appointments"),
          api.get("/medicines"),
          api.get("/prescriptions"),
          api.get("/bills"),
          api.get("/staff"),
        ]);

        setData({
          patients: patientsRes.data,
          doctors: doctorsRes.data,
          appointments: appointmentsRes.data,
          medicines: medicinesRes.data,
          prescriptions: prescriptionsRes.data,
          bills: billsRes.data,
          staff: staffRes.data,
        });
      } catch (err) {
        setError("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleDelete = async (endpoint, id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await api.delete(`/${endpoint}/${id}`);
        // Refresh data
        const res = await api.get(`/${endpoint}`);
        setData(prev => ({ ...prev, [endpoint]: res.data }));
      } catch (err) {
        setError("Failed to delete item");
      }
    }
  };

  const filteredData = data[selectedSection]?.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const renderTable = (items, columns, endpoint) => (
    <div className="table-wrap">
      <table className="striped">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.key === 'appointment_time' || col.key === 'prescription_date' || col.key === 'issue_date' || col.key === 'due_date' || col.key === 'expiry_date'
                    ? new Date(item[col.key]).toLocaleDateString()
                    : item[col.key]}
                </td>
              ))}
              <td>
                <button
                  className="btn danger"
                  onClick={() => handleDelete(endpoint, item.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const sections = [
    { key: "patients", label: "Patients", columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "age", label: "Age" },
      { key: "gender", label: "Gender" },
      { key: "contact_number", label: "Contact" },
    ]},
    { key: "doctors", label: "Doctors", columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "specialization", label: "Specialization" },
      { key: "contact_number", label: "Contact" },
      { key: "email", label: "Email" },
    ]},
    { key: "appointments", label: "Appointments", columns: [
      { key: "id", label: "ID" },
      { key: "patient_id", label: "Patient ID" },
      { key: "doctor_id", label: "Doctor ID" },
      { key: "appointment_time", label: "Date/Time" },
      { key: "status", label: "Status" },
    ]},
    { key: "medicines", label: "Medicines", columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "stock", label: "Stock" },
      { key: "price", label: "Price" },
      { key: "expiry_date", label: "Expiry" },
    ]},
    { key: "prescriptions", label: "Prescriptions", columns: [
      { key: "id", label: "ID" },
      { key: "patient_id", label: "Patient ID" },
      { key: "doctor_id", label: "Doctor ID" },
      { key: "prescription_date", label: "Date" },
      { key: "instructions", label: "Instructions" },
    ]},
    { key: "bills", label: "Bills", columns: [
      { key: "id", label: "ID" },
      { key: "patient_id", label: "Patient ID" },
      { key: "amount", label: "Amount" },
      { key: "issue_date", label: "Issue Date" },
      { key: "status", label: "Status" },
    ]},
    { key: "staff", label: "Staff", columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "position", label: "Position" },
      { key: "contact_number", label: "Contact" },
      { key: "email", label: "Email" },
    ]},
  ];

  if (loading) return <div className="spinner"></div>;
  if (error) return <div className="alert error">{error}</div>;

  return (
    <div className="page admin-page">
      <header className="hero">
        <div>
          <h1>🔧 Admin Panel</h1>
          <p className="hero-sub">Manage all hospital data and services</p>
        </div>
      </header>

      <div className="admin-controls">
        <div className="section-tabs">
          {sections.map(section => (
            <button
              key={section.key}
              className={`btn ${selectedSection === section.key ? 'primary' : 'secondary'}`}
              onClick={() => setSelectedSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="search">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h3>{sections.find(s => s.key === selectedSection)?.label} Management</h3>
        {renderTable(filteredData, sections.find(s => s.key === selectedSection)?.columns || [], selectedSection)}
      </div>
    </div>
  );
}
