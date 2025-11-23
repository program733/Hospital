import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function NavBar({ isOpen }) {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Dashboard", icon: "icon-dashboard" },
    { to: "/admin", label: "Admin", icon: "icon-admin" },
    { to: "/patients", label: "Patients", icon: "icon-patient" },
    { to: "/doctors", label: "Doctors", icon: "icon-doctor" },
    { to: "/appointments", label: "Appointments", icon: "icon-appointment" },
    { to: "/medicines", label: "Medicines", icon: "icon-medicine" },
    { to: "/prescriptions", label: "Prescriptions", icon: "icon-prescription" },
    { to: "/bills", label: "Bills", icon: "icon-bill" },
    { to: "/staff", label: "Staff", icon: "icon-staff" },
  ];

  return (
    <nav className={`sidebar-nav ${isOpen ? 'open' : 'closed'}`}>
      <div className="nav-header">
        <h2>{isOpen ? '🏥 Janta Hospital' : '🏥'}</h2>
      </div>
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className={location.pathname === item.to ? "active" : ""}
              title={item.label}
            >
              <span className={item.icon}></span>
              {isOpen && item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
