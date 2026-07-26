import React, { useState, useEffect } from "react";
import { useAppointments } from "../context/AppointmentsContext";
import { getAppointmentDate, formatTime12 } from "../utils/appointmentHelpers";
import { useNavigate } from "react-router-dom";
import "./HealthTimeline.css";

const STATUS_CONFIG = {
  confirmed:  { color: "green",  icon: "✅", label: "Confirmed" },
  scheduled:  { color: "yellow", icon: "⏳", label: "Waiting" },
  pending:    { color: "yellow", icon: "⏳", label: "Pending" },
  cancelled:  { color: "red",    icon: "❌", label: "Rejected" },
  completed:  { color: "blue",   icon: "🏁", label: "Completed" },
};

function groupByMonth(appointments) {
  const groups = {};
  appointments.forEach((apt) => {
    const date = getAppointmentDate(apt);
    const key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(apt);
  });
  return groups;
}

function TimelineCard({ apt, index }) {
  const [expanded, setExpanded] = useState(false);
  const date = getAppointmentDate(apt);
  const cfg = STATUS_CONFIG[apt.status] || { color: "gray", icon: "📋", label: apt.status };

  return (
    <div
      className={`timeline-card status-${cfg.color} fade-slide`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      {/* Dot on the line */}
      <div className={`timeline-dot dot-${cfg.color}`}>{cfg.icon}</div>

      <div className="tl-card-inner" onClick={() => setExpanded(!expanded)}>
        <div className="tl-card-top">
          <div className="tl-date-block">
            <span className="tl-day">{date.getDate()}</span>
            <span className="tl-month">{date.toLocaleDateString("en-US", { month: "short" })}</span>
            <span className="tl-year">{date.getFullYear()}</span>
          </div>

          <div className="tl-info">
            <div className="tl-doctor">{apt.doctorName || "Unknown Doctor"}</div>
            <div className="tl-specialty">{apt.specialty || "General"}</div>
            <div className="tl-time">
              🕐 {apt.time || formatTime12(apt.startTime) || "—"}
            </div>
          </div>

          <div className="tl-right">
            <span className={`tl-badge badge-${cfg.color}`}>{cfg.label}</span>
            <button className="tl-expand-btn">{expanded ? "▲" : "▼"}</button>
          </div>
        </div>

        {expanded && (
          <div className="tl-expanded">
            <div className="tl-divider" />
            <div className="tl-detail-grid">
              {apt.reason && (
                <div className="tl-detail-item">
                  <span className="tl-detail-label">Reason</span>
                  <span className="tl-detail-value">{apt.reason}</span>
                </div>
              )}
              <div className="tl-detail-item">
                <span className="tl-detail-label">Type</span>
                <span className="tl-detail-value">
                  {apt.type === "video" ? "📹 Video Call" : "🏥 In-Person"}
                </span>
              </div>
              {apt.startTime && (
                <div className="tl-detail-item">
                  <span className="tl-detail-label">Time Slot</span>
                  <span className="tl-detail-value">
                    {formatTime12(apt.startTime)}{apt.endTime ? ` – ${formatTime12(apt.endTime)}` : ""}
                  </span>
                </div>
              )}
              <div className="tl-detail-item">
                <span className="tl-detail-label">Status</span>
                <span className={`tl-badge badge-${cfg.color}`}>{cfg.icon} {cfg.label}</span>
              </div>
              {apt.status === 'completed' && (
                <div className="tl-detail-item" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                  <button onClick={() => window.location.href = '/prescriptions'} className="tl-book-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    📥 Download Prescription
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HealthTimeline() {
  const { appointments, fetchAppointments, loading } = useAppointments();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const sorted = [...appointments]
    .filter((a) => filter === "all" || a.status === filter)
    .sort((a, b) => getAppointmentDate(b) - getAppointmentDate(a));

  const grouped = groupByMonth(sorted);

  const counts = {
    all: appointments.length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    scheduled: appointments.filter((a) => ["scheduled","pending"].includes(a.status)).length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  return (
    <div className="timeline-page">
      {/* Hero */}
      <div className="timeline-hero">
        <div className="tl-hero-content">
          <div className="tl-hero-badge">📊 Medical History</div>
          <h1>Your Health Timeline</h1>
          <p>A complete visual record of your medical journey — every appointment, every visit, all in one place.</p>
        </div>
        <div className="tl-hero-orb tl-orb1" />
        <div className="tl-hero-orb tl-orb2" />
      </div>

      <div className="timeline-container">
        {/* Stats row */}
        <div className="tl-stats-row">
          <div className="tl-stat">
            <span className="tl-stat-num">{counts.all}</span>
            <span className="tl-stat-label">Total Visits</span>
          </div>
          <div className="tl-stat">
            <span className="tl-stat-num tl-green">{counts.confirmed}</span>
            <span className="tl-stat-label">Confirmed</span>
          </div>
          <div className="tl-stat">
            <span className="tl-stat-num tl-blue">{counts.completed}</span>
            <span className="tl-stat-label">Completed</span>
          </div>
          <div className="tl-stat">
            <span className="tl-stat-num tl-yellow">{counts.scheduled}</span>
            <span className="tl-stat-label">Upcoming</span>
          </div>
          <div className="tl-stat">
            <span className="tl-stat-num tl-red">{counts.cancelled}</span>
            <span className="tl-stat-label">Cancelled</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="tl-filter-bar">
          {[
            { key: "all", label: "All" },
            { key: "confirmed", label: "✅ Confirmed" },
            { key: "scheduled", label: "⏳ Waiting" },
            { key: "completed", label: "🏁 Completed" },
            { key: "cancelled", label: "❌ Rejected" },
          ].map((f) => (
            <button
              key={f.key}
              className={`tl-filter-btn ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="tl-filter-count">
                {f.key === "all" ? counts.all : f.key === "scheduled" ? counts.scheduled : counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="tl-loading">
            <div className="tl-spinner" />
            <p>Loading your health history...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="tl-empty">
            <div className="tl-empty-icon">🗓️</div>
            <h3>No appointments found</h3>
            <p>Your medical history will appear here after you book appointments.</p>
            <button className="tl-book-btn" onClick={() => navigate("/appointments")}>
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="timeline-body">
            {Object.entries(grouped).map(([month, apts]) => (
              <div key={month} className="timeline-month-group">
                <div className="month-label">
                  <span>{month}</span>
                  <span className="month-count">{apts.length} visit{apts.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="timeline-line-wrap">
                  <div className="vertical-line" />
                  <div className="tl-cards">
                    {apts.map((apt, i) => (
                      <TimelineCard key={apt._id} apt={apt} index={i} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
