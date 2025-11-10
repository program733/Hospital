import React from "react";
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
  return (
    <div className="app">
      <NavBar />
      <main className="main-content">
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
