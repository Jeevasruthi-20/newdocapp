import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiFetch, apiJson } from "../lib/api";
import "./AdminDashboard.css";

const API_BASE_URL = "/api/admin";

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

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, apptsData, patientsData] = await Promise.all([
        apiJson(`${API_BASE_URL}/stats`).catch(() => null),
        apiJson(`${API_BASE_URL}/appointments`).catch(() => []),
        apiJson(`${API_BASE_URL}/patients`).catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (apptsData) setAppointments(apptsData);
      if (patientsData) setPatients(patientsData);
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
      await apiFetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient? This action cannot be undone.")) return;
    try {
      await apiFetch(`${API_BASE_URL}/patient/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // ---- Filtering & Sorting Logic ----
  const getFilteredAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    const monthEnd = new Date(today);
    monthEnd.setDate(today.getDate() + 30);

    return appointments
      .filter((app) => {
        // Text search: patient or doctor name
        const search = searchTerm.toLowerCase();
        const patientName = (app.patient?.name || "").toLowerCase();
        const doctorName = (app.doctor?.name || "").toLowerCase();
        const reason = (app.reason || "").toLowerCase();
        if (search && !patientName.includes(search) && !doctorName.includes(search) && !reason.includes(search)) {
          return false;
        }

        // Status filter
        if (statusFilter !== "all" && app.status !== statusFilter) return false;

        // Date filter
        if (dateFilter !== "all") {
          const appDate = new Date(app.date);
          appDate.setHours(0, 0, 0, 0);
          if (dateFilter === "today" && appDate.getTime() !== today.getTime()) return false;
          if (dateFilter === "tomorrow" && appDate.getTime() !== tomorrow.getTime()) return false;
          if (dateFilter === "week" && (appDate < today || appDate > weekEnd)) return false;
          if (dateFilter === "month" && (appDate < today || appDate > monthEnd)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  };

  const filteredAppointments = getFilteredAppointments();

  // Count for quick tabs
  const countByStatus = (status) => appointments.filter((a) => a.status === status).length;

  if (!currentUser || currentUser.role !== "admin") return null;

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <span>🏥</span> Admin Panel
        </div>
        <nav className="admin-nav">
          <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>📊 Overview</button>
          <button className={activeTab === "appointments" ? "active" : ""} onClick={() => setActiveTab("appointments")}>📅 Appointments</button>
          <button className={activeTab === "patients" ? "active" : ""} onClick={() => setActiveTab("patients")}>👥 Patients</button>
          <button onClick={logout} className="admin-logout-btn">🚪 Logout</button>
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
            {(activeTab === "overview" || activeTab === "appointments") && (
              <div className="admin-card">
                <div className="card-header">
                  <h2>Appointment Management</h2>
                  <div className="appt-count-badges">
                    <span className="count-badge scheduled" onClick={() => setStatusFilter("scheduled")}>
                      ⏳ Waiting: {countByStatus("scheduled")}
                    </span>
                    <span className="count-badge confirmed" onClick={() => setStatusFilter("confirmed")}>
                      ✅ Confirmed: {countByStatus("confirmed")}
                    </span>
                    <span className="count-badge cancelled" onClick={() => setStatusFilter("cancelled")}>
                      ❌ Rejected: {countByStatus("cancelled")}
                    </span>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="admin-filters-bar">
                  <div className="filter-search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search patient, doctor, reason..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button className="clear-search" onClick={() => setSearchTerm("")}>✕</button>
                    )}
                  </div>

                  <div className="filter-group">
                    <label>Date</label>
                    <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="week">Next 7 Days</option>
                      <option value="month">Next 30 Days</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Status</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Statuses</option>
                      <option value="scheduled">Waiting / Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Rejected / Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Sort</label>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>

                  {(searchTerm || statusFilter !== "all" || dateFilter !== "all") && (
                    <button
                      className="clear-all-filters"
                      onClick={() => { setSearchTerm(""); setStatusFilter("all"); setDateFilter("all"); }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Results count */}
                <div className="filter-results-info">
                  Showing <strong>{filteredAppointments.length}</strong> of <strong>{appointments.length}</strong> appointments
                </div>

                {loading ? <p className="loading-text">Loading...</p> : (
                  filteredAppointments.length === 0 ? (
                    <div className="no-results">
                      <span>🔍</span>
                      <p>No appointments found matching your filters.</p>
                      <button onClick={() => { setSearchTerm(""); setStatusFilter("all"); setDateFilter("all"); }}>
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Doctor</th>
                          <th>Date</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map(app => (
                          <tr key={app._id}>
                            <td>
                              <div className="patient-cell">
                                <div className="patient-avatar">{(app.patient?.name || "?")[0].toUpperCase()}</div>
                                {app.patient?.name || 'Unknown'}
                              </div>
                            </td>
                            <td>{app.doctor?.name || 'Unknown'}</td>
                            <td>
                              <div className="date-cell">
                                <span className="date-main">{new Date(app.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                {app.startTime && <span className="date-time">{app.startTime}</span>}
                              </div>
                            </td>
                            <td className="reason-cell">{app.reason || '—'}</td>
                            <td>
                              <span className={`status-badge ${app.status}`}>
                                {app.status === 'scheduled' ? '⏳ Waiting' :
                                 app.status === 'confirmed' ? '✅ Confirmed' :
                                 app.status === 'cancelled' ? '❌ Rejected' :
                                 app.status === 'completed' ? '🏁 Completed' :
                                 app.status}
                              </span>
                            </td>
                            <td>
                              <div className="action-btns">
                                {(app.status === 'scheduled' || app.status === 'pending') && (
                                  <button className="approve-btn" onClick={() => handleUpdateStatus(app._id, 'confirmed')}>Approve</button>
                                )}
                                {app.status !== 'cancelled' && app.status !== 'completed' && (
                                  <button className="reject-btn" onClick={() => handleUpdateStatus(app._id, 'cancelled')}>Reject</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}
              </div>
            )}

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
                        <td>
                          <div className="patient-cell">
                            <div className="patient-avatar">{(p.name || "?")[0].toUpperCase()}</div>
                            {p.name}
                          </div>
                        </td>
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
