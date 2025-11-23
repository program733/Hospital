import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Medicines from "./pages/Medicines";
import Prescriptions from "./pages/Prescriptions";
import Bills from "./pages/Bills";
import Staff from "./pages/Staff";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app">
      <NavBar isOpen={sidebarOpen} />
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? '☰' : '☰'}
        </button>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/staff" element={<Staff />} />
        </Routes>
      </main>
    </div>
  );
}
