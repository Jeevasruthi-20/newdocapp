import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { apiJson } from "../lib/api";
import "./RescheduleModal.css";

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
];

const to24Hour = (time12) => {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const p = match[3].toUpperCase();
  if (p === "PM" && h !== 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
};

const to12Hour = (time24) => {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
};

const addMins = (time24, mins) => {
  const [h, m] = time24.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

const formatDate = (isoDate) => {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
};

export default function RescheduleModal({ appointment, onClose, onRescheduled }) {
  const today = new Date().toISOString().split("T")[0];

  const [newDate, setNewDate]       = useState("");
  const [newTime, setNewTime]       = useState("");
  const [takenSlots, setTakenSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ── Fetch already-booked slots whenever date changes ── */
  useEffect(() => {
    if (!newDate || !appointment?.doctor?._id) return;
    setTakenSlots([]);
    setNewTime("");
    setLoadingSlots(true);

    const doctorId = appointment.doctor?._id || appointment.doctorId;

    apiJson(`/api/appointments/available-slots?doctorId=${doctorId}&date=${newDate}&excludeId=${appointment._id}`)
      .then((data) => {
        // data is an array of taken startTimes in 24h format
        setTakenSlots(Array.isArray(data) ? data : []);
      })
      .catch(() => setTakenSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [newDate, appointment]);

  const isSlotTaken = (slot12) => {
    const slot24 = to24Hour(slot12);
    return takenSlots.includes(slot24);
  };

  const isSameSlot = (slot12) => {
    const slot24 = to24Hour(slot12);
    const existingDate = appointment.date
      ? new Date(appointment.date).toISOString().split("T")[0]
      : "";
    return slot24 === appointment.startTime && newDate === existingDate;
  };

  const handleSubmit = async () => {
    if (!newDate) return toast.error("Please select a new date.");
    if (newDate < today) return toast.error("Cannot reschedule to a past date.");
    if (!newTime) return toast.error("Please select a time slot.");
    if (isSlotTaken(newTime)) return toast.error("That time slot is already booked. Please choose another.");
    if (isSameSlot(newTime)) return toast.error("You selected the same date and time as the current appointment.");

    setSubmitting(true);
    const startTime = to24Hour(newTime);
    const endTime   = addMins(startTime, 30);

    try {
      await onRescheduled({ date: newDate, startTime, endTime });
      toast.success("✅ Appointment rescheduled successfully!");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to reschedule. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── If already confirmed, show locked notice only ── */
  if (appointment.status === "confirmed") {
    return (
      <div className="reschedule-overlay" onClick={onClose}>
        <div className="reschedule-modal" onClick={(e) => e.stopPropagation()}>
          <div className="rs-header">
            <div className="rs-header-left">
              <div className="rs-header-icon">🔒</div>
              <div>
                <h2>Reschedule Unavailable</h2>
                <p>This appointment has been confirmed</p>
              </div>
            </div>
            <button className="rs-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="rs-body">
            <div className="rs-locked-notice">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Rescheduling is not allowed after the doctor has confirmed your appointment.
              Please contact the clinic to make changes.
            </div>
            <button className="rs-cancel-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reschedule-overlay" onClick={onClose}>
      <div className="reschedule-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="rs-header">
          <div className="rs-header-left">
            <div className="rs-header-icon">📅</div>
            <div>
              <h2>Reschedule Appointment</h2>
              <p>with {appointment.doctorName || "your doctor"}</p>
            </div>
          </div>
          <button className="rs-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Current appointment info */}
        <div className="rs-current-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Current: <strong>{formatDate(appointment.date)}</strong> at <strong>{to12Hour(appointment.startTime) || appointment.time}</strong>
        </div>

        {/* Body */}
        <div className="rs-body">

          {/* New date picker */}
          <div className="rs-field">
            <label className="rs-label">Select New Date</label>
            <input
              type="date"
              className="rs-date-input"
              min={today}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>

          {/* Time slots */}
          {newDate && (
            <div className="rs-field">
              <label className="rs-label">Select New Time Slot</label>
              <div className="rs-slots-grid">
                {loadingSlots ? (
                  <div className="rs-loading-slots">
                    <div className="rs-slot-spinner" />
                    Checking availability…
                  </div>
                ) : (
                  TIME_SLOTS.map((slot) => {
                    const taken = isSlotTaken(slot);
                    const selected = newTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`rs-slot ${selected ? "rs-slot-selected" : ""} ${taken ? "rs-slot-taken" : ""}`}
                        onClick={() => !taken && setNewTime(slot)}
                        disabled={taken}
                        title={taken ? "Already booked" : ""}
                      >
                        {slot}
                        {taken && <span className="rs-slot-taken-label">Booked</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="rs-footer">
          <button className="rs-cancel-btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="rs-submit-btn"
            onClick={handleSubmit}
            disabled={submitting || !newDate || !newTime}
          >
            {submitting ? (
              <><div className="rs-btn-spinner" /> Rescheduling…</>
            ) : (
              "✅ Confirm Reschedule"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
