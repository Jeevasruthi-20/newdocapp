import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiJson } from '../lib/api';
import './DoctorDashboard.css';

const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const DoctorDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [delayInput, setDelayInput] = useState({}); // { aptId: minutes }
  const [showDelayFor, setShowDelayFor] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role !== 'doctor') {
      toast.error('Access denied. Doctor account required.');
      navigate('/dashboard');
      return;
    }
  }, [currentUser, navigate]);

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await apiJson('/api/appointments/my');
      // Doctor sees appointments where they are the doctor
      const doctorApts = data.filter(a => a.doctor?._id === currentUser?._id || a.doctor === currentUser?._id);
      setAppointments(doctorApts);
    } catch (err) {
      // Fallback: just show all appointments (admin-like view for the doctor)
      try {
        const data = await apiJson('/api/appointments/my');
        setAppointments(data);
      } catch {
        console.error('Failed to fetch appointments');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === 'doctor') fetchAppointments();
  }, [currentUser, fetchAppointments]);

  const handleConfirm = async (id) => {
    try {
      await apiJson(`/api/appointments/${id}/confirm`, { method: 'PUT' });
      toast.success('Appointment confirmed!');
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm');
    }
  };

  const handleComplete = async (id) => {
    try {
      await apiJson(`/api/appointments/${id}/complete`, { method: 'PUT' });
      toast.success('Appointment marked as completed!');
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || 'Failed to complete');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await apiJson(`/api/appointments/${id}/cancel`, { method: 'PUT' });
      toast.success('Appointment cancelled.');
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel');
    }
  };

  const handleReportDelay = async () => {
    const minutes = delayInput[showDelayFor];
    if (!minutes || isNaN(minutes) || minutes <= 0) {
      toast.error('Enter a valid delay in minutes');
      return;
    }
    try {
      const apt = appointments.find(a => a._id === showDelayFor);
      await apiJson('/api/appointments/doctor-delay', {
        method: 'PUT',
        body: JSON.stringify({
          delayMinutes: Number(minutes),
          date: apt.date,
          fromTime: apt.startTime,
        }),
      });
      toast.success(`Delay of ${minutes} minutes reported successfully!`);
      setShowDelayFor(null);
      setDelayInput({});
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || 'Failed to report delay');
    }
  };

  // Filter appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayApts = appointments.filter(a => {
    const d = new Date(a.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const pendingApts = appointments.filter(a => a.status === 'pending');
  const confirmedApts = appointments.filter(a => ['confirmed', 'delayed', 'in-progress'].includes(a.status));
  const completedApts = appointments.filter(a => a.status === 'completed');

  const displayApts = activeTab === 'today' ? todayApts 
                    : activeTab === 'pending' ? pendingApts 
                    : activeTab === 'confirmed' ? confirmedApts 
                    : completedApts;

  // Stats
  const totalToday = todayApts.length;
  const totalPending = pendingApts.length;
  const totalConfirmed = confirmedApts.length;
  const totalCompleted = completedApts.length;
  const totalPatients = new Set(appointments.map(a => a.patient?._id || a.patient).filter(Boolean)).size;

  if (loading) {
    return (
      <div className="doctor-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>👨‍⚕️ Doctor Dashboard</h1>
        <p>Welcome back, Dr. {currentUser?.name || 'Doctor'}! Here's your schedule overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="doctor-stats-grid">
        <motion.div className="doctor-stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <div className="stat-icon blue">📋</div>
          <div>
            <div className="stat-value">{totalToday}</div>
            <div className="stat-label">Today's Appointments</div>
          </div>
        </motion.div>
        <motion.div className="doctor-stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="stat-icon amber">⏳</div>
          <div>
            <div className="stat-value">{totalPending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </motion.div>
        <motion.div className="doctor-stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="stat-icon green">📅</div>
          <div>
            <div className="stat-value">{totalConfirmed}</div>
            <div className="stat-label">Confirmed</div>
          </div>
        </motion.div>
        <motion.div className="doctor-stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="stat-icon purple">✅</div>
          <div>
            <div className="stat-value">{totalCompleted}</div>
            <div className="stat-label">Completed</div>
          </div>
        </motion.div>
        <motion.div className="doctor-stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="stat-icon green">👥</div>
          <div>
            <div className="stat-value">{totalPatients}</div>
            <div className="stat-label">Total Patients</div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="doctor-tabs">
        {[
          { key: 'today', label: `Today (${totalToday})` },
          { key: 'pending', label: `Pending (${totalPending})` },
          { key: 'confirmed', label: `Confirmed (${totalConfirmed})` },
          { key: 'completed', label: `Completed (${totalCompleted})` },
        ].map(tab => (
          <button
            key={tab.key}
            className={`doctor-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="doctor-content">
        {displayApts.length === 0 ? (
          <div className="doctor-empty">
            <div className="empty-icon">{activeTab === 'past' ? '📂' : '🗓️'}</div>
            <p>No {activeTab} appointments found.</p>
          </div>
        ) : (
          <div className="doctor-apt-list">
            <AnimatePresence>
              {displayApts.map((apt, i) => {
                const patientName = apt.patient?.name || 'Patient';
                const isActive = ['pending', 'scheduled', 'confirmed', 'in-progress', 'delayed'].includes(apt.status);
                return (
                  <motion.div
                    key={apt._id}
                    className="doctor-apt-card"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className="apt-info">
                      <div className="apt-avatar">{patientName[0]}</div>
                      <div className="apt-details">
                        <h4>{patientName}</h4>
                        <p>
                          {formatDate(apt.date)} · {apt.reason || 'Consultation'}
                          {apt.type === 'video' && ' · 📹 Video'}
                        </p>
                      </div>
                    </div>
                    <div className="apt-actions">
                      <span className="apt-time">
                        {apt.expectedStartTime || apt.startTime} – {apt.endTime}
                      </span>
                      <span className={`apt-status ${apt.status}`}>{apt.status}</span>

                      {/* Action buttons for active appointments */}
                      
                      {['pending', 'scheduled'].includes(apt.status) && (
                        <button className="doctor-btn confirm" onClick={() => handleConfirm(apt._id)}>
                          ✅ Confirm
                        </button>
                      )}

                      {apt.type === 'video' && apt.meetLink && ['confirmed', 'delayed', 'in-progress'].includes(apt.status) && (
                        <a href={apt.meetLink} target="_blank" rel="noreferrer" className="doctor-btn complete" style={{ textDecoration: 'none' }}>
                          📹 Join Call
                        </a>
                      )}

                      {['confirmed', 'delayed', 'in-progress'].includes(apt.status) && (
                        <button className="doctor-btn complete" onClick={() => handleComplete(apt._id)}>
                          ✅ Complete
                        </button>
                      )}

                      {['confirmed', 'completed', 'in-progress', 'delayed'].includes(apt.status) && (
                        <button className="doctor-btn confirm" onClick={() => navigate(`/admin/prescription/${apt._id}`)}>
                          💊 Write Prescription
                        </button>
                      )}

                      {isActive && (
                        <>
                          <button
                            className="doctor-btn delay"
                            onClick={() => setShowDelayFor(showDelayFor === apt._id ? null : apt._id)}
                          >
                            ⏰ Delay
                          </button>
                          <button className="doctor-btn cancel" onClick={() => handleCancel(apt._id)}>
                            ❌ Cancel
                          </button>
                        </>
                      )}
                    </div>

                    {/* Delay Input Row */}
                    {showDelayFor === apt._id && (
                      <div className="delay-input-row" style={{ width: '100%' }}>
                        <label>Delay by:</label>
                        <input
                          type="number"
                          min="5"
                          step="5"
                          placeholder="30"
                          value={delayInput[apt._id] || ''}
                          onChange={e => setDelayInput(prev => ({ ...prev, [apt._id]: e.target.value }))}
                        />
                        <label>minutes</label>
                        <button className="doctor-btn confirm" onClick={handleReportDelay}>
                          Apply
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
