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
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleViewHistory = (patient) => {
    setSelectedPatient(patient);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedPatient(null);
  };

  // Edit State
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('patients');
  const [editFormData, setEditFormData] = useState({});



  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
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

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setEditFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Determine endpoint based on selectedSection
      // sections keys match endpoints usually, but let's be safe
      const endpoint = selectedSection;

      await api.put(`/${endpoint}/${editingItem.id}`, editFormData);

      // Refresh data for this section
      const res = await api.get(`/${endpoint}`);
      setData(prev => ({ ...prev, [endpoint]: res.data }));

      handleModalClose();
    } catch (err) {
      alert("Failed to update item: " + (err.response?.data?.detail || err.message));
    }
  };

  const filteredData = data[selectedSection]?.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const sections = [
    {
      key: "patients", label: "Patients", columns: [
        { key: "id", label: "ID", editable: false },
        { key: "name", label: "Name", editable: true },
        { key: "age", label: "Age", editable: true, type: "number" },
        { key: "gender", label: "Gender", editable: true },
        { key: "contact_number", label: "Contact", editable: true },
      ]
    },
    {
      key: "doctors", label: "Doctors", columns: [
        { key: "id", label: "ID", editable: false },
        { key: "name", label: "Name", editable: true },
        { key: "specialization", label: "Specialization", editable: true },
        { key: "contact_number", label: "Contact", editable: true },
        { key: "email", label: "Email", editable: true },
        { key: "consultation_fee", label: "Fee", editable: true, type: "number" },
      ]
    },
    {
      key: "appointments", label: "Appointments", columns: [
        { key: "id", label: "ID", editable: false },
        { key: "patient_id", label: "Patient ID", editable: true },
        { key: "doctor_id", label: "Doctor ID", editable: true },
        { key: "appointment_time", label: "Date/Time", editable: true, type: "datetime-local" },
        { key: "status", label: "Status", editable: true },
      ]
    },
    {
      key: "medicines", label: "Medicines", columns: [
        { key: "id", label: "ID", editable: false },
        { key: "name", label: "Name", editable: true },
        { key: "stock", label: "Stock", editable: true, type: "number" },
        { key: "price", label: "Price", editable: true, type: "number" },
        { key: "expiry_date", label: "Expiry", editable: true, type: "date" },
      ]
    },
    {
      key: "prescriptions", label: "Prescriptions", columns: [
        { key: "id", label: "ID", editable: false },
        { key: "patient_id", label: "Patient ID", editable: true },
        { key: "doctor_id", label: "Doctor ID", editable: true },
        { key: "prescription_date", label: "Date", editable: true, type: "date" },
        { key: "instructions", label: "Instructions", editable: true },
      ]
    },
    {
      key: "bills", label: "Bills", columns: [
        { key: "id", label: "ID", editable: false },
        { key: "patient_id", label: "Patient ID", editable: true },
        { key: "amount", label: "Amount", editable: true, type: "number" },
        { key: "issue_date", label: "Issue Date", editable: true, type: "date" },
        { key: "status", label: "Status", editable: true },
      ]
    },
    {
      key: "staff", label: "Staff", columns: [
        { key: "id", label: "ID", editable: false },
        { key: "name", label: "Name", editable: true },
        { key: "position", label: "Position", editable: true },
        { key: "contact_number", label: "Contact", editable: true },
        { key: "email", label: "Email", editable: true },
      ]
    },
  ];

  const currentSectionConfig = sections.find(s => s.key === selectedSection);

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
                  {col.key.includes('date') || col.key.includes('time')
                    ? (item[col.key] ? new Date(item[col.key]).toLocaleDateString() : "—")
                    : item[col.key]}
                </td>
              ))}
              <td>
                <button
                  className="btn secondary"
                  style={{ marginRight: '0.5rem' }}
                  onClick={() => handleEditClick(item)}
                >
                  Edit
                </button>
                <button
                  className="btn danger"
                  onClick={() => handleDelete(endpoint, item.id)}
                >
                  Delete
                </button>
                {selectedSection === 'patients' && (
                  <button
                    className="btn primary"
                    style={{ marginLeft: '0.5rem' }}
                    onClick={() => handleViewHistory(item)}
                  >
                    History
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const getDoctorName = (doctorId) => {
    const doctor = data.doctors.find(doc => doc.id === doctorId);
    return doctor ? doctor.name : 'Unknown Doctor';
  };

  // Modal for appointment history
  const renderHistoryModal = () => {
    if (!showHistoryModal) return null;
    if (!selectedPatient) return null;
    const patientAppointments = data.appointments.filter(app => app.patient_id === selectedPatient.id);
    return (
      <div className={`modal-overlay ${showHistoryModal ? 'show' : ''}`}>
        <div className="modal">
          <div className="modal-header">
            <h3>Appointment History for {selectedPatient.name}</h3>
            <button className="close-btn" onClick={closeHistoryModal}>&times;</button>
          </div>
          <div className="modal-body">
            {patientAppointments.length === 0 ? (
              <p>No appointments found.</p>
            ) : (
              <table className="striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Doctor</th>
                    <th>Date/Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patientAppointments.map(app => (
                    <tr key={app.id}>
                      <td>{app.id}</td>
                      <td>{getDoctorName(app.doctor_id)}</td>
                      <td>{new Date(app.appointment_time).toLocaleString()}</td>
                      <td>{app.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={closeHistoryModal}>Close</button>
          </div>
        </div>
      </div>
    );
  };

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
        <h3>{currentSectionConfig?.label} Management</h3>
        {renderTable(filteredData, currentSectionConfig?.columns || [], selectedSection)}
      </div>

      {/* History Modal */}
      {renderHistoryModal()}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit {currentSectionConfig?.label.slice(0, -1)}</h3>
              <button className="close-btn" onClick={handleModalClose}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {currentSectionConfig?.columns.map(col => {
                  if (!col.editable) return null;
                  return (
                    <label key={col.key}>
                      {col.label}
                      <input
                        type={col.type || "text"}
                        name={col.key}
                        value={editFormData[col.key] || ""}
                        onChange={handleFormChange}
                        disabled={!col.editable}
                      />
                    </label>
                  );
                })}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={handleModalClose}>Cancel</button>
                <button type="submit" className="btn primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
