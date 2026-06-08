import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppointments } from "../context/AppointmentsContext";
import { toast } from "react-hot-toast";
import {
  UPCOMING_STATUSES,
  getAppointmentDate,
  formatTime12,
} from "../utils/appointmentHelpers";
import "./Appointments.css";

const mockDoctors = [
  { id: "d1", name: "Dr. Sarah Smith", specialty: "Cardiologist", avatar: "https://ui-avatars.com/api/?name=Sarah+Smith&background=0D8ABC&color=fff" },
  { id: "d2", name: "Dr. Michael Chen", specialty: "Neurologist", avatar: "https://ui-avatars.com/api/?name=Michael+Chen&background=22C55E&color=fff" },
  { id: "d3", name: "Dr. Emily Davis", specialty: "Pediatrician", avatar: "https://ui-avatars.com/api/?name=Emily+Davis&background=F59E0B&color=fff" },
  { id: "d4", name: "Dr. James Wilson", specialty: "General Physician", avatar: "https://ui-avatars.com/api/?name=James+Wilson&background=EC4899&color=fff" },
];

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"
];

const to24Hour = (time12) => {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const addMinutes = (time24, mins) => {
  const [h, m] = time24.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const Appointments = () => {
  const { t } = useTranslation();
  const { appointments, cancelAppointment, addAppointment, fetchAppointments, loading } = useAppointments();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("waiting");
  const [showModal, setShowModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [visitType, setVisitType] = useState("in-person");
  const [visitReason, setVisitReason] = useState("");

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (location.state?.booked) {
      fetchAppointments();
      toast.success('Appointment added to your schedule');
    }
  }, [location.state, fetchAppointments]);

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "success";
      case "scheduled": return "warning";
      case "pending": return "warning";
      case "cancelled": return "danger";
      default: return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed": return t('appointments.confirmed');
      case "scheduled": return t('appointments.scheduled');
      case "pending": return t('appointments.scheduled');
      case "cancelled": return t('appointments.cancelled');
      case "completed": return t('dashboard.completed');
      default: return status ? String(status) : "Unknown";
    }
  };

  const handleCancelAppointment = async (id) => {
    if (window.confirm(t('appointments.confirmCancelPrompt'))) {
      try {
        await cancelAppointment(id);
        toast.success(t('appointments.cancelSuccess'));
      } catch (err) {
        toast.error(err.message || 'Failed to cancel');
      }
    }
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === "waiting") {
      return ["scheduled", "pending"].includes(apt.status);
    }
    if (activeTab === "confirmed") {
      return apt.status === "confirmed";
    }
    if (activeTab === "rejected") {
      return apt.status === "cancelled";
    }
    return true;
  });

  const waitingCount   = appointments.filter((a) => ['scheduled', 'pending'].includes(a.status)).length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const rejectedCount  = appointments.filter((a) => a.status === 'cancelled').length;

  const resetBooking = () => {
    setShowModal(false);
    setTimeout(() => {
      setBookingStep(1);
      setSelectedDoc(null);
      setSelectedDate("");
      setSelectedTime("");
      setVisitType("in-person");
      setVisitReason("");
    }, 300);
  };

  const handleNextStep = () => {
    if (bookingStep === 1 && !selectedDoc) return toast.error("Please select a doctor.");
    if (bookingStep === 2) {
      if (!selectedDate) return toast.error("Please select a date.");
      if (selectedDate < today) return toast.error("Past dates are not allowed.");
      if (!selectedTime) return toast.error("Please select a time slot.");
    }
    setBookingStep((prev) => prev + 1);
  };

  const handleConfirmBooking = async () => {
    if (!visitReason.trim() || visitReason.trim().length < 5) {
      return toast.error("Please provide a reason for the visit (at least 5 characters).");
    }

    setIsSubmitting(true);
    const startTime = to24Hour(selectedTime);

    try {
      await addAppointment({
          doctorId: selectedDoc?.id,
          doctorName: selectedDoc?.name,
          date: selectedDate,
          startTime,
          endTime: addMinutes(startTime, 30),
          reason: visitReason.trim(),
          appointmentType: 'consultation',
        });
      toast.success("Appointment booked successfully!");
      resetBooking();
      setActiveTab('waiting');
    } catch (err) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="appointments-page premium-ui">
      <div className="container">
        <div className="apt-header-section">
          <div className="apt-header-text">
            <h1 className="title-gradient">{t('appointments.myAppointments')}</h1>
            <p className="subtitle">{t('appointments.manageSchedule')}</p>
          </div>
          <button className="btn primary-btn btn-lg pulse-shadow" onClick={() => setShowModal(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            {t('appointments.bookBtn')}
          </button>
        </div>

        <div className="apt-stats-grid">
          <div className="stat-card clickable-stat" onClick={() => setActiveTab('waiting')}>
            <div className="stat-icon bg-yellow-100 text-yellow-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
            <div className="stat-info">
              <h3>{waitingCount}</h3>
              <p>Waiting</p>
            </div>
          </div>
          <div className="stat-card clickable-stat" onClick={() => setActiveTab('confirmed')}>
            <div className="stat-icon bg-blue-100 text-blue-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
            <div className="stat-info">
              <h3>{confirmedCount}</h3>
              <p>{t('appointments.confirmed')}</p>
            </div>
          </div>
          <div className="stat-card clickable-stat" onClick={() => setActiveTab('rejected')}>
            <div className="stat-icon bg-red-100 text-red-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></div>
            <div className="stat-info">
              <h3>{rejectedCount}</h3>
              <p>Rejected</p>
            </div>
          </div>
        </div>

        <div className="apt-main-content">
          <div className="modern-tabs">
            <button className={`tab ${activeTab === 'waiting' ? 'active' : ''}`} onClick={() => setActiveTab('waiting')}>
              ⏳ Waiting
              {waitingCount > 0 && <span className="tab-count">{waitingCount}</span>}
            </button>
            <button className={`tab ${activeTab === 'confirmed' ? 'active' : ''}`} onClick={() => setActiveTab('confirmed')}>
              ✅ Confirmed
              {confirmedCount > 0 && <span className="tab-count confirmed-count">{confirmedCount}</span>}
            </button>
            <button className={`tab ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>
              ❌ Rejected
              {rejectedCount > 0 && <span className="tab-count rejected-count">{rejectedCount}</span>}
            </button>
          </div>

          <div className="apt-list-wrapper">
            {loading ? (
              <div className="loader-container"><div className="spinner"></div></div>
            ) : filteredAppointments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  {activeTab === 'waiting' ? '⏳' : activeTab === 'confirmed' ? '✅' : '📋'}
                </div>
                <h3>{t('appointments.noAppointments')}</h3>
                <p>
                  {activeTab === 'waiting'
                    ? 'You have no appointments waiting for approval.'
                    : activeTab === 'confirmed'
                    ? 'You have no confirmed appointments yet.'
                    : 'You have no rejected appointments.'}
                </p>
              </div>
            ) : (
              <div className="apt-list">
                {filteredAppointments.map((apt) => (
                  <div key={apt._id} className="apt-card fade-in-up">
                    <div className="apt-card-header">
                      <div className="doctor-meta">
                        <div className="doc-avatar">
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctorName || 'Doc')}&background=0D8ABC&color=fff`} alt="Doctor" />
                        </div>
                        <div>
                          <h4>{apt.doctorName}</h4>
                          <span className="doc-specialty">{apt.specialty}</span>
                        </div>
                      </div>
                      <span className={`status-badge ${getStatusColor(apt.status)}`}>{getStatusText(apt.status)}</span>
                    </div>
                    <div className="apt-card-body">
                      <div className="detail-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {getAppointmentDate(apt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="detail-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {apt.time || formatTime12(apt.startTime)}
                      </div>
                      <div className="detail-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                        {apt.type === 'in-person' ? t('doctors.inPerson') : t('appointments.videoCall')}
                      </div>
                      {apt.reason && (
                        <div className="detail-item apt-reason">
                          <span>{apt.reason}</span>
                        </div>
                      )}
                    </div>
                    <div className="apt-card-footer">
                      {UPCOMING_STATUSES.includes(apt.status) && (
                        <button className="btn outline-btn btn-sm" onClick={() => handleCancelAppointment(apt._id)}>{t('appointments.cancelBtn')}</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="glass-modal-overlay fade-in" onClick={resetBooking}>
          <div className="glass-modal scale-in" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={resetBooking}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <div className="modal-sidebar">
              <h2>{t('appointments.bookVisitTitle')}</h2>
              <div className="steps-indicator">
                <div className={`step ${bookingStep >= 1 ? 'active' : ''}`}>
                  <div className="step-icon">1</div>
                  <div><span className="step-title">{t('appointments.step1')}</span><span className="step-subtitle">{t('appointments.step1Sub')}</span></div>
                </div>
                <div className={`step ${bookingStep >= 2 ? 'active' : ''}`}>
                  <div className="step-icon">2</div>
                  <div><span className="step-title">{t('appointments.step2')}</span><span className="step-subtitle">{t('appointments.step2Sub')}</span></div>
                </div>
                <div className={`step ${bookingStep >= 3 ? 'active' : ''}`}>
                  <div className="step-icon">3</div>
                  <div><span className="step-title">{t('appointments.step3')}</span><span className="step-subtitle">{t('appointments.step3Sub')}</span></div>
                </div>
                <div className="step-progress-line"><div className={`progress-bar progress-${bookingStep}`} /></div>
              </div>
              {bookingStep > 1 && selectedDoc && (
                <div className="booking-summary-mini fade-in">
                  <h4>{t('appointments.summary')}</h4>
                  <p><strong>{t('billing.doctor')}:</strong> {selectedDoc?.name}</p>
                  {selectedDate && <p><strong>{t('doctors.appointmentDate')}:</strong> {selectedDate}</p>}
                  {selectedTime && <p><strong>{t('doctors.selectTimeSlot')}:</strong> {selectedTime}</p>}
                </div>
              )}
            </div>

            <div className="modal-content-area">
              {bookingStep === 1 && (
                <div className="step-content slide-in-right">
                  <h3>{t('appointments.chooseSpecialist')}</h3>
                  <div className="doctor-selection-grid">
                    {mockDoctors.map((doc) => (
                      <div key={doc.id} className={`doc-chip ${selectedDoc?.id === doc.id ? 'selected' : ''}`} onClick={() => setSelectedDoc(doc)}>
                        <img src={doc.avatar} alt={doc.name} />
                        <div><h5>{doc.name}</h5><span>{doc.specialty}</span></div>
                        {selectedDoc?.id === doc.id && <div className="check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="step-content slide-in-right">
                  <h3>{t('appointments.selectDateTime')}</h3>
                  <div className="form-group mt-4">
                    <label>{t('doctors.appointmentDate')}</label>
                    <input type="date" className="premium-input" min={today} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                  </div>
                  <div className="form-group mt-6">
                    <label>{t('appointments.availableSlots')}</label>
                    <div className="time-slots-grid">
                      {timeSlots.map((time) => (
                        <button key={time} type="button" className={`time-chip ${selectedTime === time ? 'selected' : ''}`} onClick={() => setSelectedTime(time)}>{time}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="step-content slide-in-right">
                  <h3>{t('appointments.finalizeBooking')}</h3>
                  <div className="form-group mt-4">
                    <label>{t('doctors.visitType')}</label>
                    <div className="radio-group">
                      <label className={`radio-card ${visitType === 'in-person' ? 'selected' : ''}`}>
                        <input type="radio" name="visitType" value="in-person" checked={visitType === 'in-person'} onChange={() => setVisitType("in-person")} />
                        {t('doctors.inPerson')}
                      </label>
                      <label className={`radio-card ${visitType === 'video' ? 'selected' : ''}`}>
                        <input type="radio" name="visitType" value="video" checked={visitType === 'video'} onChange={() => setVisitType("video")} />
                        {t('appointments.videoCall')}
                      </label>
                    </div>
                  </div>
                  <div className="form-group mt-6">
                    <label>{t('appointments.reasonRequired')}</label>
                    <textarea className="premium-input" rows="3" placeholder={t('appointments.reasonPlaceholder')} value={visitReason} onChange={(e) => setVisitReason(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="modal-actions">
                {bookingStep > 1 && <button type="button" className="btn outline-btn" onClick={() => setBookingStep((prev) => prev - 1)}>{t('common.back')}</button>}
                {bookingStep < 3 ? (
                  <button type="button" className="btn primary-btn ml-auto" onClick={handleNextStep}>{t('common.readMore') === 'மேலும் படிக்க' ? 'தொடரவும்' : 'Continue'}</button>
                ) : (
                  <button type="button" className="btn primary-btn ml-auto" onClick={handleConfirmBooking} disabled={isSubmitting}>
                    {isSubmitting ? <span className="spinner-small"></span> : t('appointments.confirmBookingBtn')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
