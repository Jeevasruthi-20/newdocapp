import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppointments } from "../context/AppointmentsContext";
import { toast } from "react-hot-toast";
import "./Doctors.css";
import doctor1 from "../assets/doctors/doctor1.jpeg";
import doctor2 from "../assets/doctors/doctor2.jpeg";
import doctor3 from "../assets/doctors/doctor3.jpeg";
import doctor4 from "../assets/doctors/doctor4.jpeg";
import doctor5 from "../assets/doctors/doctor5.jpeg";
import doctor6 from "../assets/doctors/doctor6.jpeg";
import doctor8 from "../assets/doctors/doctor8.jpeg";

const doctors = [
  { id: 1, name: "Dr. Richard James", specialty: "General Physician", experience: "7+ years", rating: 4.8, reviews: 127, available: true, img: doctor1, location: "Downtown Medical Center", languages: ["English", "Spanish"], consultationFee: "$120" },
  { id: 2, name: "Dr. Emily Larson", specialty: "Gynecologist", experience: "4+ years", rating: 4.9, reviews: 89, available: true, img: doctor2, location: "Women's Health Clinic", languages: ["English", "French"], consultationFee: "$150" },
  { id: 3, name: "Dr. Sourav Patel", specialty: "Dermatologist", experience: "10+ years", rating: 4.7, reviews: 203, available: false, img: doctor3, location: "Skin Care Institute", languages: ["English", "Hindi"], consultationFee: "$130" },
  { id: 4, name: "Dr. Jeesie", specialty: "Cardiologist", experience: "5+ years", rating: 4.9, reviews: 156, available: true, img: doctor4, location: "Heart & Vascular Center", languages: ["English", "Mandarin"], consultationFee: "$180" },
  { id: 5, name: "Dr. Lisa Rodriguez", specialty: "Pediatrician", experience: "8+ years", rating: 4.8, reviews: 234, available: true, img: doctor5, location: "Children's Medical Group", languages: ["English", "Spanish"], consultationFee: "$100" },
  { id: 6, name: "Dr. David Thompson", specialty: "Orthopedic Surgeon", experience: "18+ years", rating: 4.6, reviews: 98, available: false, img: doctor6, location: "Orthopedic Institute", languages: ["English"], consultationFee: "$200" },
  { id: 7, name: "Dr. John Williams", specialty: "Neurologist", experience: "23+ years", rating: 4.9, reviews: 142, available: true, img: doctor8, location: "Neuro Health Center", languages: ["English", "German"], consultationFee: "$210" },
  { id: 8, name: "Dr. Ahmed Khan", specialty: "ENT Specialist", experience: "11+ years", rating: 4.7, reviews: 98, available: true, img: doctor8, location: "ENT Care Clinic", languages: ["English", "Urdu"], consultationFee: "$140" },
  { id: 9, name: "Dr. Clara Watson", specialty: "General Physician", experience: "12+ years", rating: 4.9, reviews: 310, available: true, img: doctor1, location: "City Hospital", languages: ["English"], consultationFee: "$110" },
  { id: 10, name: "Dr. Hannah Kapoor", specialty: "Gynecologist", experience: "15+ years", rating: 4.8, reviews: 220, available: false, img: doctor2, location: "Mother & Child Care Center", languages: ["English", "Hindi"], consultationFee: "$160" },
  { id: 11, name: "Dr. Kevin Lee", specialty: "Dermatologist", experience: "9+ years", rating: 4.6, reviews: 180, available: true, img: doctor3, location: "Clear Skin Clinic", languages: ["English", "Korean"], consultationFee: "$125" },
  { id: 12, name: "Dr. Sophia Brown", specialty: "Cardiologist", experience: "20+ years", rating: 4.9, reviews: 300, available: true, img: doctor4, location: "Metro Heart Hospital", languages: ["English", "French"], consultationFee: "$200" },
  { id: 13, name: "Dr. George Martinez", specialty: "Pediatrician", experience: "14+ years", rating: 4.7, reviews: 190, available: true, img: doctor5, location: "Happy Kids Clinic", languages: ["English", "Spanish"], consultationFee: "$95" },
  { id: 14, name: "Dr. William Anderson", specialty: "Orthopedic Surgeon", experience: "22+ years", rating: 4.8, reviews: 250, available: true, img: doctor6, location: "Bone & Joint Center", languages: ["English"], consultationFee: "$220" },
  { id: 15, name: "Dr. Priya Mehra", specialty: "ENT Specialist", experience: "9+ years", rating: 4.5, reviews: 112, available: true, img: doctor8, location: "Ear, Nose & Throat Clinic", languages: ["English", "Hindi"], consultationFee: "$130" },
];

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"
];

const Doctors = () => {
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  
  // Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    type: "in-person",
    reason: ""
  });
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  const { addAppointment } = useAppointments();
  const navigate = useNavigate();

  const specialties = [
    "all", "General Physician", "Gynecologist", "Dermatologist", 
    "Cardiologist", "Pediatrician", "Orthopedic Surgeon", "Others"
  ];

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setIsLoadingDoctors(true);
    const timer = setTimeout(() => setIsLoadingDoctors(false), 280);
    return () => clearTimeout(timer);
  }, [selectedSpecialty, searchTerm, sortBy]);

  const filteredDoctors = doctors
    .filter(doctor => {
      if (selectedSpecialty === "all") return true;
      if (selectedSpecialty === "Others") {
        return !["General Physician", "Gynecologist", "Dermatologist", "Cardiologist", "Pediatrician", "Orthopedic Surgeon"].includes(doctor.specialty);
      }
      return doctor.specialty === selectedSpecialty;
    })
    .filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "rating": return b.rating - a.rating;
        case "experience": return parseInt(b.experience) - parseInt(a.experience);
        case "name": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  const handleOpenBookingModal = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingData({
      date: "",
      time: "",
      type: "in-person",
      reason: ""
    });
    setShowBookingModal(true);
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setTimeout(() => {
      setSelectedDoctor(null);
    }, 300); // Wait for animation
  };

  const handleBookAppointment = (e) => {
    e.preventDefault();
    
    if (!bookingData.date || !bookingData.time) {
      return toast.error("Please select both date and time.");
    }
    
    const now = new Date();
    const selectedDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
    
    // Fallback validation (min attribute on input handles most)
    if (bookingData.date < today) {
      return toast.error("You cannot book an appointment in the past.");
    }
    
    if (!bookingData.reason || bookingData.reason.trim().length < 5) {
      return toast.error("Please provide a brief reason for the visit.");
    }

    setIsSubmitting(true);

    // Simulate API delay
    setTimeout(() => {
      const newAppointment = {
        id: Date.now(),
        doctorName: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        date: bookingData.date,
        time: bookingData.time,
        type: bookingData.type,
        reason: bookingData.reason,
        status: "pending"
      };
      
      addAppointment(newAppointment);
      setIsSubmitting(false);
      setShowBookingModal(false);
      toast.success("Appointment booked successfully!");
      navigate("/appointments");
    }, 1500);
  };

  return (
    <div className="doctors-page">
      <div className="container">
        <div className="doctors-header">
          <h1 className="section-title">Find Your Doctor</h1>
          <p className="doctors-subtitle">
            Connect with trusted healthcare professionals and book appointments with ease
          </p>
        </div>

        {/* Filters */}
        <div className="doctors-filters">
          <div className="search-section">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search doctors by name or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-controls">
            <div className="filter-group">
              <label className="filter-label">Specialty:</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="filter-select"
              >
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty === "all" ? "All Specialties" : specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="rating">Highest Rating</option>
                <option value="experience">Most Experience</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="doctors-stats">
          <div className="stat-item">
            <span className="stat-number">{filteredDoctors.length}</span>
            <span className="stat-label">Doctors Found</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{doctors.filter(d => d.available).length}</span>
            <span className="stat-label">Available Now</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{specialties.length - 1}</span>
            <span className="stat-label">Specialties</span>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="doctors-grid">
          {isLoadingDoctors ? (
            [...Array(6)].map((_, idx) => (
              <div className="doctor-card card skeleton-card" key={idx}>
                <div className="doctor-image skeleton-image" />
                <div className="doctor-info">
                  <div className="skeleton-line title"></div>
                  <div className="skeleton-line subtitle"></div>
                  <div className="skeleton-line rating"></div>
                  <div className="skeleton-grid">
                    <div className="skeleton-line small"></div>
                    <div className="skeleton-line small"></div>
                    <div className="skeleton-line small"></div>
                  </div>
                  <div className="skeleton-button"></div>
                </div>
              </div>
            ))
          ) : (
            filteredDoctors.map((doctor) => (
              <div className="doctor-card card" key={doctor.id}>
                <div className="doctor-image">
                  <img src={doctor.img} alt={doctor.name} />
                  <div className={`availability-badge ${doctor.available ? 'available' : 'unavailable'}`}>
                    {doctor.available ? 'Available' : 'Unavailable'}
                  </div>
                </div>
                
                <div className="doctor-info">
                  <h3 className="doctor-name">{doctor.name}</h3>
                  <p className="doctor-specialty">{doctor.specialty}</p>
                  
                  <div className="doctor-rating">
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`star ${i < Math.floor(doctor.rating) ? 'filled' : ''}`}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="rating-text">{doctor.rating} ({doctor.reviews} reviews)</span>
                  </div>
                  
                  <div className="doctor-details">
                    <div className="detail-item"><span className="detail-icon">⏱️</span><span>{doctor.experience}</span></div>
                    <div className="detail-item"><span className="detail-icon">📍</span><span>{doctor.location}</span></div>
                    <div className="detail-item"><span className="detail-icon">💬</span><span>{doctor.languages.join(', ')}</span></div>
                    <div className="detail-item"><span className="detail-icon">💰</span><span>{doctor.consultationFee}</span></div>
                  </div>
                  
                  <button 
                    className={`btn ${doctor.available ? 'primary-btn' : 'secondary-btn'}`}
                    onClick={() => handleOpenBookingModal(doctor)}
                    disabled={!doctor.available}
                  >
                    {doctor.available ? 'Book Appointment' : 'Unavailable'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* No Results */}
        {!isLoadingDoctors && filteredDoctors.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No doctors found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        )}

      </div>

      {/* 🌟 Premium Booking Modal overlay directly here without react-modal wrapper to control animations perfectly */}
      {showBookingModal && selectedDoctor && (
        <div className="glass-modal-overlay fade-in" onClick={handleCloseBookingModal}>
          <div className="glass-modal scale-in premium-booking-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseBookingModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            {/* Left Side: Doctor Profile */}
            <div className="modal-sidebar doctor-profile-sidebar">
              <div className="sidebar-avatar">
                <img src={selectedDoctor.img} alt={selectedDoctor.name} />
              </div>
              <h2>{selectedDoctor.name}</h2>
              <div className="sidebar-specialty">{selectedDoctor.specialty}</div>
              
              <div className="sidebar-stats">
                <div className="sidebar-stat-row">
                  <span>Experience</span>
                  <strong>{selectedDoctor.experience}</strong>
                </div>
                <div className="sidebar-stat-row">
                  <span>Rating</span>
                  <strong>⭐ {selectedDoctor.rating}</strong>
                </div>
                <div className="sidebar-stat-row">
                  <span>Consultation Fee</span>
                  <strong>{selectedDoctor.consultationFee}</strong>
                </div>
              </div>
            </div>

            {/* Right Side: Booking Form */}
            <div className="modal-content-area">
              <h3 className="form-title">Schedule Visit</h3>
              
              <form onSubmit={handleBookAppointment} className="premium-form slide-in-right">
                
                <div className="form-group">
                  <label>Appointment Date</label>
                  <input 
                    type="date" 
                    className="premium-input"
                    min={today}
                    value={bookingData.date}
                    onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group mt-4">
                  <label>Select Time Slot</label>
                  <div className="time-slots-grid">
                    {timeSlots.map(time => (
                      <div 
                        key={time}
                        className={`time-chip ${bookingData.time === time ? 'selected' : ''}`}
                        onClick={() => setBookingData({...bookingData, time})}
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group mt-4">
                  <label>Visit Type</label>
                  <div className="radio-group">
                    <label className={`radio-card ${bookingData.type === 'in-person' ? 'selected' : ''}`}>
                      <input type="radio" name="type" value="in-person" checked={bookingData.type === 'in-person'} onChange={(e) => setBookingData({...bookingData, type: e.target.value})} />
                      🏥 In-Person
                    </label>
                    <label className={`radio-card ${bookingData.type === 'video-call' ? 'selected' : ''}`}>
                      <input type="radio" name="type" value="video-call" checked={bookingData.type === 'video-call'} onChange={(e) => setBookingData({...bookingData, type: e.target.value})} />
                      💻 Video Call
                    </label>
                  </div>
                </div>

                <div className="form-group mt-4">
                  <label>Reason for Visit</label>
                  <textarea 
                    className="premium-input"
                    rows="2"
                    placeholder="Briefly describe your symptoms..."
                    value={bookingData.reason}
                    onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}
                    required
                  ></textarea>
                </div>

                <div className="modal-actions mt-6">
                  <button type="button" className="btn outline-btn" onClick={handleCloseBookingModal}>Cancel</button>
                  <button type="submit" className="btn primary-btn ml-auto" disabled={isSubmitting}>
                    {isSubmitting ? <span className="spinner-small"></span> : "Confirm Appointment"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Doctors;
