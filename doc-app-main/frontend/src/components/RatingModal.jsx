import React, { useState } from "react";
import "./RatingModal.css";

export function saveRating(appointmentId, rating, review, doctorName) {
  const key = "docapp_ratings";
  const existing = JSON.parse(localStorage.getItem(key) || "{}");
  existing[appointmentId] = {
    rating,
    review,
    doctorName,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(existing));
}

export function getRating(appointmentId) {
  const key = "docapp_ratings";
  const existing = JSON.parse(localStorage.getItem(key) || "{}");
  return existing[appointmentId] || null;
}

export function getAllRatings() {
  return JSON.parse(localStorage.getItem("docapp_ratings") || "{}");
}

export function getAverageRating(doctorName) {
  const all = getAllRatings();
  const forDoctor = Object.values(all).filter(
    (r) => r.doctorName === doctorName
  );
  if (!forDoctor.length) return null;
  const avg = forDoctor.reduce((sum, r) => sum + r.rating, 0) / forDoctor.length;
  return { avg: Math.round(avg * 10) / 10, count: forDoctor.length };
}

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function RatingModal({ appointment, onClose, onSubmit }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    saveRating(appointment._id, selected, review, appointment.doctorName);
    setSubmitted(true);
    setTimeout(() => {
      onSubmit && onSubmit();
      onClose();
    }, 1800);
  };

  return (
    <div className="rating-overlay" onClick={onClose}>
      <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="rating-success">
            <div className="success-animation">🎉</div>
            <h3>Thank you for your feedback!</h3>
            <p>Your review helps other patients choose the right doctor.</p>
          </div>
        ) : (
          <>
            <button className="rating-close" onClick={onClose}>✕</button>

            <div className="rating-doctor-header">
              <div className="rating-doc-avatar">
                {(appointment.doctorName || "D")[0].toUpperCase()}
              </div>
              <div>
                <h3>Rate Your Visit</h3>
                <p>with {appointment.doctorName}</p>
              </div>
            </div>

            <div className="stars-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${star <= (hovered || selected) ? "active" : ""}`}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setSelected(star)}
                >
                  ★
                </button>
              ))}
            </div>

            {(hovered || selected) > 0 && (
              <div className="star-label">{LABELS[hovered || selected]}</div>
            )}

            <textarea
              className="rating-textarea"
              placeholder="Share your experience (optional)..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
            />

            <div className="rating-actions">
              <button className="rating-skip" onClick={onClose}>
                Skip for now
              </button>
              <button
                className="rating-submit"
                onClick={handleSubmit}
                disabled={!selected}
              >
                Submit Review
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
