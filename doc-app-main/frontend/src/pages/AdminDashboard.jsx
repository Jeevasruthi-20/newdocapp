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

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // Delay form state
  const [delayMinutes, setDelayMinutes] = useState("");
  const [delayStartTime, setDelayStartTime] = useState("");

  // Prescription modal state
  const [prescriptionTarget, setPrescriptionTarget] = useState(null);
  const [prescriptionText, setPrescriptionText] = useState("");

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

  const handleReportDelay = async () => {
    if (!delayMinutes || !delayStartTime) {
      alert("Please enter minutes and starting time.");
      return;
    }
    try {
      await apiJson(`/api/appointments/doctor-delay`, {
        method: "PUT",
        body: JSON.stringify({
          delayMinutes: Number(delayMinutes),
          date: new Date().toISOString().split('T')[0],
          fromTime: delayStartTime
        })
      });
      alert(`Successfully added a ${delayMinutes} min delay starting at ${delayStartTime}`);
      setDelayMinutes("");
      setDelayStartTime("");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to report delay.");
    }
  };

  const handleSavePrescription = async () => {
    if (!prescriptionText.trim()) return;
    try {
      await apiJson(`/api/appointments/${prescriptionTarget._id}/prescription`, {
        method: "PUT",
        body: JSON.stringify({ prescription: prescriptionText })
      });
      alert("Prescription saved successfully!");
      setPrescriptionTarget(null);
      setPrescriptionText("");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to save prescription.");
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

                <div className="admin-delay-bar" style={{ padding: '1rem', background: '#fff5f5', borderLeft: '4px solid #ff4b4b', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <strong style={{ color: '#c53030' }}>⚠️ Report Delay:</strong>
                  <input type="number" placeholder="Mins (e.g. 30)" value={delayMinutes} onChange={e => setDelayMinutes(e.target.value)} style={{ width: '120px', padding: '0.5rem' }} />
                  <span>from</span>
                  <input type="time" value={delayStartTime} onChange={e => setDelayStartTime(e.target.value)} style={{ padding: '0.5rem' }} />
                  <button className="btn" onClick={handleReportDelay} style={{ background: '#ff4b4b', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply Delay</button>
                  <small style={{ color: '#718096' }}>All subsequent appointments will be pushed back automatically.</small>
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
                                {app.delayMinutes > 0 && <span className="date-time" style={{color: 'red', fontSize:'0.75rem'}}>Delayed {app.delayMinutes}m (Now: {app.expectedStartTime})</span>}
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
                              {app.checkInTime && <div style={{ fontSize: '0.75rem', color: '#38a169', marginTop: '4px', fontWeight: 'bold' }}>📍 Checked In (#{app.queueNumber})</div>}
                              {app.prescription && <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>📄 Prescribed</div>}
                            </td>
                            <td>
                              <div className="action-btns" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {(app.status === 'scheduled' || app.status === 'pending') && (
                                    <button className="approve-btn" onClick={() => handleUpdateStatus(app._id, 'confirmed')}>Approve</button>
                                  )}
                                  {app.status !== 'cancelled' && app.status !== 'completed' && (
                                    <button className="reject-btn" onClick={() => handleUpdateStatus(app._id, 'cancelled')}>Reject</button>
                                  )}
                                </div>
                                {app.type === 'video' && app.meetLink && (
                                  <a href={app.meetLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: '#3b82f6', color: '#fff', textAlign: 'center', textDecoration: 'none', padding: '4px' }}>
                                    📹 Join Video Call
                                  </a>
                                )}
                                {(app.status === 'confirmed' || app.status === 'in-progress' || app.checkInTime) && !app.prescription && (
                                  <button className="btn btn-sm" style={{ background: '#10b981', color: 'white', padding: '4px' }} onClick={() => { setPrescriptionTarget(app); setPrescriptionText(""); }}>
                                    ✍️ Write Prescription
                                  </button>
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

      {/* Prescription Writing Modal */}
      {prescriptionTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1rem' }}>Write Prescription</h2>
            <p style={{ marginBottom: '1rem', color: '#4a5568' }}>Patient: {prescriptionTarget.patient?.name}</p>
            <textarea 
              rows="6" 
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', marginBottom: '1rem' }} 
              placeholder="Rx..."
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn outline-btn" onClick={() => setPrescriptionTarget(null)}>Cancel</button>
              <button className="btn" style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }} onClick={handleSavePrescription}>Save & Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
