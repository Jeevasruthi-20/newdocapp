import React, { useState, useEffect } from "react";
import { useAppointments } from "../context/AppointmentsContext";
import { toast } from "react-hot-toast";
import "./Appointments.css";

// Mock Doctors Data for selection (since we don't have a specific DoctorsContext yet)
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

const Appointments = () => {
  const { appointments, cancelAppointment, loading } = useAppointments();

  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [visitType, setVisitType] = useState("in-person");
  const [visitReason, setVisitReason] = useState("");

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed": return "success";
      case "pending": return "warning";
      case "cancelled": return "danger";
      default: return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed": return "Confirmed";
      case "pending": return "Pending";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const handleCancelAppointment = async (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      await cancelAppointment(id);
      toast.success("Appointment cancelled");
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = apt.date; // assuming YYYY-MM-DD
    const aptTime = apt.time; // assuming HH:MM AM/PM or HH:MM
    // Since mock data times might vary, simple date check for now
    const aptDateTime = new Date(`${aptDate}T00:00:00`); 
    const now = new Date();
    now.setHours(0,0,0,0);

    if (activeTab === "upcoming") {
      return (apt.status === "confirmed" || apt.status === "pending") && aptDateTime >= now;
    } else if (activeTab === "past") {
      return aptDateTime < now || apt.status === "cancelled";
    }
    return true;
  });

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
    setBookingStep(prev => prev + 1);
  };

  const handleConfirmBooking = async () => {
    if (!visitReason.trim()) return toast.error("Please provide a reason for the visit.");
    
    setIsSubmitting(true);
    // Simulate API Call
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Appointment booked successfully!");
      resetBooking();
      // Here you would trigger context refetch
    }, 1500);
  };

  return (
    <div className="appointments-page premium-ui">
      <div className="container">
        
        {/* Header & Main Stats */}
        <div className="apt-header-section">
          <div className="apt-header-text">
            <h1 className="title-gradient">My Appointments</h1>
            <p className="subtitle">Manage your medical schedule and bookings</p>
          </div>
          <button className="btn primary-btn btn-lg pulse-shadow" onClick={() => setShowModal(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Book Appointment
          </button>
        </div>

        <div className="apt-stats-grid">
          <div className="stat-card">
            <div className="stat-icon bg-blue-100 text-blue-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
            <div className="stat-info">
              <h3>{appointments.filter(a => a.status === 'confirmed').length}</h3>
              <p>Confirmed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-yellow-100 text-yellow-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
            <div className="stat-info">
              <h3>{appointments.filter(a => a.status === 'pending').length}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-red-100 text-red-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></div>
            <div className="stat-info">
              <h3>{appointments.filter(a => a.status === 'cancelled').length}</h3>
              <p>Cancelled</p>
            </div>
          </div>
        </div>

        {/* Tabs & List */}
        <div className="apt-main-content">
          <div className="modern-tabs">
            <button className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
              Upcoming
            </button>
            <button className={`tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
              Past & Cancelled
            </button>
          </div>

          <div className="apt-list-wrapper">
            {loading ? (
              <div className="loader-container"><div className="spinner"></div></div>
            ) : filteredAppointments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No appointments found</h3>
                <p>{activeTab === 'upcoming' ? "Your schedule is clear. Book a new appointment to see a doctor." : "No past history available."}</p>
              </div>
            ) : (
              <div className="apt-list">
                {filteredAppointments.map(apt => (
                  <div key={apt._id} className="apt-card fade-in-up">
                    <div className="apt-card-header">
                      <div className="doctor-meta">
                        <div className="doc-avatar"><img src={`https://ui-avatars.com/api/?name=${apt.doctorName || 'Doc'}&background=random`} alt="Doctor" /></div>
                        <div>
                          <h4>{apt.doctorName || "Doctor Name"}</h4>
                          <span className="doc-specialty">{apt.specialty || "Specialist"}</span>
                        </div>
                      </div>
                      <span className={`status-badge ${getStatusColor(apt.status)}`}>{getStatusText(apt.status)}</span>
                    </div>
                    <div className="apt-card-body">
                      <div className="detail-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> {new Date(apt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                      <div className="detail-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> {apt.time}</div>
                      <div className="detail-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg> {apt.type}</div>
                    </div>
                    <div className="apt-card-footer">
                      {(apt.status === "confirmed" || apt.status === "pending") && (
                        <button className="btn outline-btn btn-sm" onClick={() => handleCancelAppointment(apt._id)}>Cancel Booking</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Booking Modal */}
      {showModal && (
        <div className="glass-modal-overlay fade-in" onClick={resetBooking}>
          <div className="glass-modal scale-in" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={resetBooking}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            
            <div className="modal-sidebar">
              <h2>Book Visit</h2>
              <div className="steps-indicator">
                <div className={`step ${bookingStep >= 1 ? 'active' : ''}`}>
                  <div className="step-icon">1</div>
                  <div>
                    <span className="step-title">Select Doctor</span>
                    <span className="step-subtitle">Choose the right specialist</span>
                  </div>
                </div>
                <div className={`step ${bookingStep >= 2 ? 'active' : ''}`}>
                  <div className="step-icon">2</div>
                  <div>
                    <span className="step-title">Date & Time</span>
                    <span className="step-subtitle">Pick a convenient slot</span>
                  </div>
                </div>
                <div className={`step ${bookingStep >= 3 ? 'active' : ''}`}>
                  <div className="step-icon">3</div>
                  <div>
                    <span className="step-title">Details</span>
                    <span className="step-subtitle">Confirm your visit</span>
                  </div>
                </div>
                <div className="step-progress-line">
                  <div className={`progress-bar progress-${bookingStep}`} />
                </div>
              </div>
              {bookingStep > 1 && selectedDoc && (
                <div className="booking-summary-mini fade-in">
                  <h4>Summary</h4>
                  <p><strong>Dr:</strong> {selectedDoc?.name}</p>
                  {selectedDate && <p><strong>Date:</strong> {selectedDate}</p>}
                  {selectedTime && <p><strong>Time:</strong> {selectedTime}</p>}
                </div>
              )}
            </div>

            <div className="modal-content-area">
              {/* STEP 1: DOCTOR */}
              {bookingStep === 1 && (
                <div className="step-content slide-in-right">
                  <h3>Choose a Specialist</h3>
                  <div className="doctor-selection-grid">
                    {mockDoctors.map(doc => (
                      <div 
                        key={doc.id} 
                        className={`doc-chip ${selectedDoc?.id === doc.id ? 'selected' : ''}`}
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <img src={doc.avatar} alt={doc.name} />
                        <div>
                          <h5>{doc.name}</h5>
                          <span>{doc.specialty}</span>
                        </div>
                        {selectedDoc?.id === doc.id && <div className="check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: DATE & TIME */}
              {bookingStep === 2 && (
                <div className="step-content slide-in-right">
                  <h3>Select Date & Time</h3>
                  
                  <div className="form-group mt-4">
                    <label>Appointment Date (Future dates only)</label>
                    <input 
                      type="date" 
                      className="premium-input" 
                      min={today}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group mt-6">
                    <label>Available Slots</label>
                    <div className="time-slots-grid">
                      {timeSlots.map(time => (
                        <button 
                          key={time}
                          className={`time-chip ${selectedTime === time ? 'selected' : ''}`}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: DETAILS */}
              {bookingStep === 3 && (
                <div className="step-content slide-in-right">
                  <h3>Finalize Booking</h3>
                  
                  <div className="form-group mt-4">
                    <label>Visit Type</label>
                    <div className="radio-group">
                      <label className={`radio-card ${visitType === 'in-person' ? 'selected' : ''}`}>
                        <input type="radio" name="visitType" value="in-person" checked={visitType === 'in-person'} onChange={() => setVisitType("in-person")} />
                        🏥 In-Person
                      </label>
                      <label className={`radio-card ${visitType === 'video' ? 'selected' : ''}`}>
                        <input type="radio" name="visitType" value="video" checked={visitType === 'video'} onChange={() => setVisitType("video")} />
                        💻 Video Call
                      </label>
                    </div>
                  </div>

                  <div className="form-group mt-6">
                    <label>Reason for Visit *</label>
                    <textarea 
                      className="premium-input"
                      rows="3"
                      placeholder="Please briefly describe your symptoms or reason for visit..."
                      value={visitReason}
                      onChange={(e) => setVisitReason(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                {bookingStep > 1 && (
                  <button className="btn outline-btn" onClick={() => setBookingStep(prev => prev - 1)}>Back</button>
                )}
                {bookingStep < 3 ? (
                  <button className="btn primary-btn ml-auto" onClick={handleNextStep}>Continue</button>
                ) : (
                  <button className="btn primary-btn ml-auto" onClick={handleConfirmBooking} disabled={isSubmitting}>
                    {isSubmitting ? <span className="spinner-small"></span> : "Confirm Booking"}
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
