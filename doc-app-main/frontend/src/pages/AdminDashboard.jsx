import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API_BASE_URL = "http://localhost:5000/api/admin";

const StatCard = ({ title, value, icon, color }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-details">
      <h3>{title}</h3>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, totalAppointments: 0, pendingAppointments: 0 });
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, apptsRes, patientsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/appointments`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/patients`, { credentials: 'include' })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (apptsRes.ok) setAppointments(await apptsRes.json());
      if (patientsRes.ok) setPatients(await patientsRes.json());
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/");
    } else {
      fetchData();
    }
  }, [currentUser, navigate]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/patient/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (!currentUser || currentUser.role !== "admin") return null;

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <span>🏥</span> Admin Panel
        </div>
        <nav className="admin-nav">
          <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Overview</button>
          <button className={activeTab === "appointments" ? "active" : ""} onClick={() => setActiveTab("appointments")}>Appointments</button>
          <button className={activeTab === "patients" ? "active" : ""} onClick={() => setActiveTab("patients")}>Patients</button>
          <button onClick={logout} className="admin-logout-btn">Logout</button>
        </nav>
      </div>

      <div className="admin-main">
        <header className="admin-header">
          <h1>Welcome, {currentUser.name || "Admin"}</h1>
          <div className="admin-user">
            <span>{currentUser.email}</span>
            <div className="admin-avatar">A</div>
          </div>
        </header>

        <div className="admin-content">
          <div className="stats-grid">
            <StatCard title="Total Patients" value={stats.totalPatients} icon="👥" color="blue" />
            <StatCard title="Total Appointments" value={stats.totalAppointments} icon="📅" color="green" />
            <StatCard title="Total Doctors" value={stats.totalDoctors} icon="👨‍⚕️" color="purple" />
            <StatCard title="Pending Review" value={stats.pendingAppointments} icon="⌛" color="orange" />
          </div>

          <div className="admin-sections">
            {activeTab === "overview" || activeTab === "appointments" ? (
              <div className="admin-card">
                <div className="card-header">
                  <h2>Appointment Management</h2>
                </div>
                {loading ? <p>Loading...</p> : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(app => (
                        <tr key={app._id}>
                          <td>{app.patient?.name || 'Unknown'}</td>
                          <td>{app.doctor?.name || 'Unknown'}</td>
                          <td>{new Date(app.date).toLocaleDateString()}</td>
                          <td><span className={`status-badge ${app.status}`}>{app.status}</span></td>
                          <td>
                            <div className="action-btns">
                              {app.status === 'scheduled' && (
                                <button className="approve-btn" onClick={() => handleUpdateStatus(app._id, 'confirmed')}>Approve</button>
                              )}
                              {app.status !== 'cancelled' && (
                                <button className="reject-btn" onClick={() => handleUpdateStatus(app._id, 'cancelled')}>Reject</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : null}

            {activeTab === "patients" && (
              <div className="admin-card">
                <div className="card-header">
                  <h2>Patient Accounts</h2>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(p => (
                      <tr key={p._id}>
                        <td>{p.name}</td>
                        <td>{p.email}</td>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="reject-btn" onClick={() => handleDeletePatient(p._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
