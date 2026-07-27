import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiFetch, apiJson } from "../lib/api";
import AdminAnalytics from "../components/AdminAnalytics";
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
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalPrescriptions: 0,
    todayAppointments: 0,
    totalBlockedDates: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [doctorSchedule, setDoctorSchedule] = useState(null);
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // Notifications
  const [unreadCount, setUnreadCount] = useState(0);

  // Prescription modal state
  const [prescriptionTarget, setPrescriptionTarget] = useState(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [medications, setMedications] = useState([{ name: "", dosage: "", frequency: "Once a day", duration: "", beforeAfterFood: "After Food", instructions: "" }]);
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // History modal state
  const [historyTarget, setHistoryTarget] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Doctor CRUD state
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ name: '', email: '', specialty: '', fee: 500 });
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);


  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, apptsData, patientsData, doctorsData, notifsData] = await Promise.all([
        apiJson(`${API_BASE_URL}/stats`).catch(() => null),
        apiJson(`${API_BASE_URL}/appointments`).catch(() => []),
        apiJson(`${API_BASE_URL}/patients`).catch(() => []),
        apiJson(`${API_BASE_URL}/doctors`).catch(() => []),
        apiJson(`${API_BASE_URL}/notifications/unread-count`).catch(() => null),
      ]);

      if (statsData) setStats(statsData);
      if (apptsData) setAppointments(apptsData);
      if (patientsData) setPatients(patientsData);
      if (doctorsData) setDoctors(doctorsData);
      if (notifsData) setUnreadCount(notifsData.count || 0);
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

  useEffect(() => {
    if (selectedDoctor) {
      apiJson(`${API_BASE_URL}/schedule/${selectedDoctor}`)
        .then(data => setDoctorSchedule(data))
        .catch(err => console.error(err));
    } else {
      setDoctorSchedule(null);
    }
  }, [selectedDoctor]);

  const handleBlockDate = async () => {
    if (!blockDate || !selectedDoctor) return;
    try {
      await apiJson(`${API_BASE_URL}/schedule/${selectedDoctor}/block-date`, {
        method: "POST",
        body: JSON.stringify({ date: blockDate, reason: blockReason })
      });
      alert("Date blocked successfully!");
      setBlockDate("");
      setBlockReason("");
      const data = await apiJson(`${API_BASE_URL}/schedule/${selectedDoctor}`);
      setDoctorSchedule(data);
      fetchData(); // refresh stats
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to block date.");
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === "appointments" && unreadCount > 0) {
      try {
        await apiFetch(`${API_BASE_URL}/notifications/mark-read`, { method: "PUT" });
        setUnreadCount(0);
      } catch (err) {
        console.error("Failed to mark notifications read", err);
      }
    }
  };

  const handleReportDelay = async (e) => {
    e.preventDefault();
    const delayMinutes = e.target.elements.delayMinutes.value;
    const date = e.target.elements.delayDate.value;
    const fromTime = e.target.elements.fromTime.value;

    if (!delayMinutes || !date || !fromTime || !selectedDoctor) return;
    try {
      await apiJson(`${API_BASE_URL}/schedule/${selectedDoctor}/delay`, {
        method: "PUT",
        body: JSON.stringify({ delayMinutes, date, fromTime })
      });
      alert("Delay reported successfully and affected patients notified!");
      e.target.reset();
      fetchData();
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to report delay.");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      let rejectionReason = '';
      if (status === 'cancelled') {
        rejectionReason = window.prompt('Reason for cancellation (optional):') || '';
      }
      await apiJson(`${API_BASE_URL}/appointments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status, rejectionReason })
      });
      fetchData();
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to update status.");
    }
  };



  const handleOpenDoctorModal = (doc = null) => {
    if (doc) {
      setEditingDoctorId(doc._id);
      setDoctorForm({
        name: doc.name,
        email: doc.email,
        specialty: doc.doctorProfile?.specialization || '',
        fee: doc.doctorProfile?.consultationFee || 500
      });
    } else {
      setEditingDoctorId(null);
      setDoctorForm({ name: '', email: '', specialty: '', fee: 500 });
    }
    setShowDoctorModal(true);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    setIsSavingDoctor(true);
    try {
      if (editingDoctorId) {
        await apiJson(`${API_BASE_URL}/doctors/${editingDoctorId}`, {
          method: 'PUT',
          body: JSON.stringify(doctorForm)
        });
        alert('Doctor updated successfully');
      } else {
        await apiJson(`${API_BASE_URL}/doctors`, {
          method: 'POST',
          body: JSON.stringify(doctorForm)
        });
        alert('Doctor created successfully');
      }
      setShowDoctorModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving doctor');
    } finally {
      setIsSavingDoctor(false);
    }
  };

  const handleToggleDoctorStatus = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === false ? 'reactivate' : 'deactivate'} this doctor?`)) return;
    try {
      const newStatus = currentStatus === false ? true : false;
      await apiJson(`${API_BASE_URL}/doctors/${id}/deactivate`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newStatus })
      });
      alert(`Doctor ${newStatus ? 'reactivated' : 'deactivated'} successfully`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error updating doctor status');
    }
  };


  const handleAddMedicine = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "Once a day", duration: "", beforeAfterFood: "After Food", instructions: "" }]);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleRemoveMedicine = (index) => {
    const updated = medications.filter((_, i) => i !== index);
    setMedications(updated);
  };

  const handleSavePrescription = async () => {
    if (!diagnosis.trim() || medications.some(m => !m.name.trim() || !m.dosage.trim())) {
      alert("Please fill in diagnosis and all medicine details.");
      return;
    }
    try {
      await apiJson(`${API_BASE_URL}/prescriptions`, {
        method: "POST",
        body: JSON.stringify({
          patientId: prescriptionTarget.patient?._id,
          appointmentId: prescriptionTarget._id,
          doctorId: prescriptionTarget.doctor?._id,
          diagnosis,
          medications,
          notes,
          followUpDate
        })
      });
      alert("Prescription saved successfully!");
      setPrescriptionTarget(null);
      setDiagnosis("");
      setMedications([{ name: "", dosage: "", frequency: "Once a day", duration: "", beforeAfterFood: "After Food", instructions: "" }]);
      setNotes("");
      setFollowUpDate("");
      fetchData();
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to save prescription.");
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

  const handleViewHistory = async (appointment) => {
    try {
      const logs = await apiJson(`${API_BASE_URL}/audit-logs/appointment/${appointment._id}`);
      setHistoryLogs(logs);
      setHistoryTarget(appointment);
    } catch (error) {
      console.error("Error fetching history:", error);
      alert("Failed to load audit history.");
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

  const countByStatus = (status) => appointments.filter((a) => a.status === status).length;

  if (!currentUser || currentUser.role !== "admin") return null;

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <span>🏥</span> Admin Panel
        </div>
        <nav className="admin-nav">
          <button className={activeTab === "overview" ? "active" : ""} onClick={() => handleTabChange("overview")}>📊 Overview</button>
          <button className={activeTab === "appointments" ? "active" : ""} onClick={() => handleTabChange("appointments")} style={{ position: 'relative' }}>
            📅 Appointments
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '5px', right: '10px', background: 'red', color: 'white', borderRadius: '50%', padding: '0.15rem 0.4rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button className={activeTab === "patients" ? "active" : ""} onClick={() => handleTabChange("patients")}>👥 Patients</button>
          <button className={activeTab === "doctors" ? "active" : ""} onClick={() => handleTabChange("doctors")}>👨‍⚕️ Doctors</button>
          <button className={activeTab === "analytics" ? "active" : ""} onClick={() => handleTabChange("analytics")}>📈 Analytics</button>
          <button className={activeTab === "schedule" ? "active" : ""} onClick={() => handleTabChange("schedule")}>🗓️ Schedule</button>
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
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            <StatCard title="Today's Appointments" value={stats.todayAppointments} icon="📋" color="blue" />
            <StatCard title="Pending Appointments" value={stats.pendingAppointments} icon="⏳" color="orange" />
            <StatCard title="Completed Appointments" value={stats.completedAppointments} icon="✅" color="green" />
            <StatCard title="Cancelled Appointments" value={stats.cancelledAppointments} icon="❌" color="red" />
            <StatCard title="Total Doctors" value={stats.totalDoctors} icon="👨‍⚕️" color="purple" />
            <StatCard title="Total Patients" value={stats.totalPatients} icon="👥" color="blue" />
            <StatCard title="Total Prescriptions" value={stats.totalPrescriptions} icon="💊" color="green" />
            <StatCard title="Blocked Dates" value={stats.totalBlockedDates} icon="🚫" color="orange" />
          </div>

          <div className="admin-sections">
            {activeTab === "analytics" && (
              <AdminAnalytics />
            )}
            
            {(activeTab === "overview" || activeTab === "appointments") && (
              <div className="admin-card">
                <div className="card-header">
                  <h2>Appointment Management</h2>
                  <div className="appt-count-badges">
                    <span className="count-badge scheduled" onClick={() => setStatusFilter("pending")}>
                      ⏳ Pending: {countByStatus("pending")}
                    </span>
                    <span className="count-badge confirmed" onClick={() => setStatusFilter("confirmed")}>
                      ✅ Confirmed: {countByStatus("confirmed")}
                    </span>
                    <span className="count-badge completed" onClick={() => setStatusFilter("completed")} style={{ background: '#ecfdf5', color: '#059669', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                      🏁 Completed: {countByStatus("completed")}
                    </span>
                    <span className="count-badge cancelled" onClick={() => setStatusFilter("cancelled")}>
                      ❌ Cancelled: {countByStatus("cancelled")}
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
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
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
                          <th>Date & Time</th>
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
                                {app.startTime && <span className="date-time">{app.startTime} {app.consultationType === 'online' ? '(Online)' : '(Offline)'}</span>}
                              </div>
                            </td>
                            <td className="reason-cell">{app.reason || '—'}</td>
                            <td>
                              <span className={`status-badge ${app.status}`}>
                                {app.status === 'pending' ? '⏳ Pending' :
                                 app.status === 'confirmed' ? '✅ Confirmed' :
                                 app.status === 'cancelled' ? '❌ Cancelled' :
                                 app.status === 'completed' ? '🏁 Completed' :
                                 app.status}
                              </span>
                            </td>
                            <td>
                              <div className="action-btns" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {app.status === 'pending' && (
                                  <>
                                    <button className="approve-btn" onClick={() => handleUpdateStatus(app._id, 'confirmed')}>✅ Confirm</button>
                                    <button className="reject-btn" onClick={() => handleUpdateStatus(app._id, 'cancelled')}>❌ Cancel</button>
                                  </>
                                )}
                                {app.status === 'confirmed' && (
                                  <>
                                    <button className="approve-btn" style={{ background: '#3b82f6' }} onClick={() => handleUpdateStatus(app._id, 'completed')}>🏁 Complete</button>
                                    <button className="reject-btn" onClick={() => handleUpdateStatus(app._id, 'cancelled')}>❌ Cancel</button>
                                  </>
                                )}
                                {app.status === 'completed' && !app.prescription && (
                                  <button className="approve-btn" style={{ background: '#10b981' }} onClick={() => setPrescriptionTarget(app)}>💊 Add Prescription</button>
                                )}
                                {app.videoRoomId && app.status !== 'completed' && app.status !== 'cancelled' && (() => {
                                  const now = new Date();
                                  const aptDate = new Date(app.date);
                                  const [startH, startM] = app.startTime.split(':').map(Number);
                                  const [endH, endM] = app.endTime.split(':').map(Number);
                                  const startObj = new Date(aptDate);
                                  startObj.setHours(startH, startM, 0, 0);
                                  const endObj = new Date(aptDate);
                                  endObj.setHours(endH, endM, 0, 0);
                                  const windowOpen = new Date(startObj.getTime() - 10 * 60000);
                                  
                                  if (now > endObj) return null;
                                  
                                  return now < windowOpen ? (
                                    <button className="outline-btn" style={{ background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed', border: '1px solid #cbd5e1', padding: '0.25rem 0.5rem', borderRadius: '4px' }} disabled title={`Opens at ${windowOpen.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}>🎥 Video Call</button>
                                  ) : (
                                    <a href={`https://meet.jit.si/${app.videoRoomId}`} target="_blank" rel="noreferrer" className="approve-btn" style={{ background: '#8b5cf6', color: '#fff', textDecoration: 'none', padding: '0.25rem 0.5rem' }}>🎥 Video Call</a>
                                  );
                                })()}

                                <button className="outline-btn" style={{ padding: '0.25rem 0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', background: 'white', cursor: 'pointer' }} onClick={() => handleViewHistory(app)}>🕒 History</button>
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

            {activeTab === "doctors" && (
              <div className="admin-card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>Doctor Management</h2>
                  <button className="approve-btn" style={{ background: '#3b82f6' }} onClick={() => handleOpenDoctorModal()}>+ Add Doctor</button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Specialty</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map(d => (
                      <tr key={d._id} style={{ opacity: d.isActive === false ? 0.6 : 1 }}>
                        <td>
                          <div className="patient-cell">
                            <div className="patient-avatar">{(d.name || "?")[0].toUpperCase()}</div>
                            {d.name}
                          </div>
                        </td>
                        <td>{d.email}</td>
                        <td>{d.doctorProfile?.specialization || 'General'}</td>
                        <td>
                           <span className={`status-badge ${d.isActive === false ? 'cancelled' : 'completed'}`}>
                             {d.isActive === false ? 'Inactive' : 'Active'}
                           </span>
                        </td>
                        <td>
                          <div className="action-btns">
                             <button className="approve-btn" onClick={() => handleOpenDoctorModal(d)}>Edit</button>
                             <button className={d.isActive === false ? "approve-btn" : "reject-btn"} onClick={() => handleToggleDoctorStatus(d._id, d.isActive)}>
                               {d.isActive === false ? 'Reactivate' : 'Deactivate'}
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="admin-card">
                <div className="card-header">
                  <h2>Doctor Schedule Management</h2>
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Doctor:</label>
                    <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} style={{ padding: '0.5rem', width: '300px' }}>
                      <option value="">-- Choose a Doctor --</option>
                      {doctors.map(d => (
                        <option key={d._id} value={d._id}>{d.name} ({d.email})</option>
                      ))}
                    </select>
                  </div>

                  {selectedDoctor && doctorSchedule && (
                    <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <h3>Block a Date</h3>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                        <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} style={{ padding: '0.5rem' }} />
                        <input type="text" placeholder="Reason (e.g. Vacation)" value={blockReason} onChange={e => setBlockReason(e.target.value)} style={{ padding: '0.5rem', flex: 1 }} />
                        <button className="btn" onClick={handleBlockDate} style={{ background: '#3b82f6', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Block Date</button>
                      </div>

                      <hr style={{ margin: '2rem 0', borderColor: '#e2e8f0' }} />

                      <h3>Report Delay</h3>
                      <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '1rem' }}>Shift schedule and notify affected patients for the given date.</p>
                      <form onSubmit={handleReportDelay} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input type="date" name="delayDate" required style={{ padding: '0.5rem' }} />
                        <input type="time" name="fromTime" required style={{ padding: '0.5rem' }} title="From what time does the delay start?" />
                        <input type="number" name="delayMinutes" placeholder="Minutes delayed" required min="1" max="180" style={{ padding: '0.5rem', width: '150px' }} />
                        <button type="submit" className="btn" style={{ background: '#f59e0b', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Report Delay</button>
                      </form>

                      <h3 style={{ marginTop: '2rem' }}>Currently Blocked Dates</h3>
                      {doctorSchedule.blockedDates && doctorSchedule.blockedDates.length > 0 ? (
                        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
                          {doctorSchedule.blockedDates.map(b => (
                            <li key={b._id || b.date} style={{ marginBottom: '0.5rem' }}>
                              <strong>{new Date(b.date).toLocaleDateString()}</strong> {b.reason ? `- ${b.reason}` : ''}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ marginTop: '1rem', color: '#718096' }}>No blocked dates.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prescription Writing Modal */}
      {prescriptionTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, overflowY: 'auto' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '800px', margin: '2rem auto', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>💊 Add Prescription</h2>
            
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
              <div><strong>Patient:</strong> {prescriptionTarget.patient?.name}</div>
              <div><strong>Doctor:</strong> {prescriptionTarget.doctor?.name}</div>
              <div><strong>Date:</strong> {new Date(prescriptionTarget.date).toLocaleDateString()}</div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Diagnosis <span style={{color: 'red'}}>*</span></label>
              <textarea 
                rows="2" 
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '4px' }} 
                placeholder="Patient diagnosis..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: 'bold' }}>Medicines <span style={{color: 'red'}}>*</span></label>
                <button onClick={handleAddMedicine} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}>+ Add Medicine</button>
              </div>
              
              {medications.map((med, index) => (
                <div key={index} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 2 }}>
                      <input type="text" placeholder="Medicine Name" value={med.name} onChange={(e) => handleMedicineChange(index, 'name', e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="text" placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <select value={med.frequency} onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}>
                        <option value="Once a day">Once a day</option>
                        <option value="Twice a day">Twice a day</option>
                        <option value="Three times a day">Three times a day</option>
                        <option value="As needed">As needed</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <input type="text" placeholder="Duration (e.g. 5 days)" value={med.duration} onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <select value={med.beforeAfterFood} onChange={(e) => handleMedicineChange(index, 'beforeAfterFood', e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}>
                        <option value="Before Food">Before Food</option>
                        <option value="After Food">After Food</option>
                        <option value="With Food">With Food</option>
                        <option value="Empty Stomach">Empty Stomach</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input type="text" placeholder="Instructions (Optional)" value={med.instructions} onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }} />
                    {medications.length > 1 && (
                      <button onClick={() => handleRemoveMedicine(index)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Additional Notes</label>
                <textarea 
                  rows="2" 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '4px' }} 
                  placeholder="Notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Follow-up Date</label>
                <input 
                  type="date" 
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e0', borderRadius: '4px' }} 
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <button className="btn outline-btn" onClick={() => setPrescriptionTarget(null)} style={{ padding: '0.75rem 1.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: 'pointer', background: 'white' }}>Cancel</button>
              <button className="btn" style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleSavePrescription}>Save Prescription</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, overflowY: 'auto' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '600px', margin: '2rem auto', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h2>🕒 Audit History</h2>
              <button onClick={() => setHistoryTarget(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div><strong>Patient:</strong> {historyTarget.patient?.name}</div>
              <div><strong>Doctor:</strong> {historyTarget.doctor?.name}</div>
              <div><strong>Current Status:</strong> <span style={{ textTransform: 'capitalize' }}>{historyTarget.status}</span></div>
            </div>

            <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '1.5rem', marginLeft: '0.5rem' }}>
              {historyLogs.length === 0 ? (
                <p style={{ color: '#718096' }}>No history found for this appointment.</p>
              ) : (
                historyLogs.map(log => (
                  <div key={log._id} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'absolute', left: '-1.9rem', top: '0.25rem', width: '0.75rem', height: '0.75rem', borderRadius: '50%', background: '#3b82f6' }}></div>
                    <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.25rem' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {log.action === 'STATUS_CHANGE' && (
                        <span>Status changed from <span style={{ color: '#eab308' }}>{log.oldValue || 'none'}</span> to <span style={{ color: '#10b981' }}>{log.newValue}</span></span>
                      )}
                      {log.action === 'PRESCRIPTION_CREATED' && (
                        <span>Created prescription (Diagnosis: {log.newValue?.diagnosis}, {log.newValue?.medicineCount} medicines)</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#4a5568' }}>
                      Performed by Admin: <strong>{log.performedByAdmin?.name || 'Unknown'}</strong>
                    </div>
                    {log.attributedDoctor && (
                      <div style={{ fontSize: '0.875rem', color: '#4a5568' }}>
                        Attributed to: <strong>Dr. {log.attributedDoctor.name}</strong>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn outline-btn" onClick={() => setHistoryTarget(null)} style={{ padding: '0.5rem 1.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: 'pointer', background: 'white' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor CRUD Modal */}
      {showDoctorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, overflowY: 'auto' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '600px', margin: '2rem auto', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h2>{editingDoctorId ? 'Edit Doctor' : 'Add New Doctor'}</h2>
              <button onClick={() => setShowDoctorModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSaveDoctor}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Name *</label>
                <input type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e0' }} value={doctorForm.name} onChange={e => setDoctorForm({...doctorForm, name: e.target.value})} placeholder="e.g. Dr. John Smith" />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email *</label>
                <input type="email" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e0' }} value={doctorForm.email} onChange={e => setDoctorForm({...doctorForm, email: e.target.value})} placeholder="e.g. john@medconnect.com" />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Specialty *</label>
                  <input type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e0' }} value={doctorForm.specialty} onChange={e => setDoctorForm({...doctorForm, specialty: e.target.value})} placeholder="e.g. Cardiologist" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Consultation Fee (₹) *</label>
                  <input type="number" required min="0" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e0' }} value={doctorForm.fee} onChange={e => setDoctorForm({...doctorForm, fee: Number(e.target.value)})} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn outline-btn" onClick={() => setShowDoctorModal(false)} style={{ padding: '0.5rem 1.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: 'pointer', background: 'white' }} disabled={isSavingDoctor}>Cancel</button>
                <button type="submit" className="btn" style={{ padding: '0.5rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} disabled={isSavingDoctor}>{isSavingDoctor ? 'Saving...' : 'Save Doctor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
