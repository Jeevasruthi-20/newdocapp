import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiJson } from '../lib/api';
import './WritePrescription.css';

const WritePrescription = () => {
  const { id: appointmentId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (currentUser?.role !== 'doctor') {
      toast.error('Unauthorized access');
      navigate('/dashboard');
      return;
    }

    const fetchAppointment = async () => {
      try {
        // Fetch all doctor appointments to find the matching one
        const data = await apiJson('/api/appointments/my');
        const match = data.find(a => a._id === appointmentId);
        if (!match) {
          toast.error('Appointment not found or not assigned to you');
          navigate('/doctor-dashboard');
          return;
        }
        setAppointment(match);
      } catch (err) {
        toast.error('Failed to load appointment details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId, currentUser, navigate]);

  const handleMedChange = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedication = (index) => {
    const updated = medications.filter((_, i) => i !== index);
    setMedications(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty rows
    const validMeds = medications.filter(m => m.name.trim() && m.dosage.trim());
    if (validMeds.length === 0) {
      toast.error('Please add at least one medication with a name and dosage');
      return;
    }

    setSubmitting(true);
    try {
      await apiJson('/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patientId: appointment.patient._id,
          appointmentId: appointment._id,
          medications: validMeds,
          notes
        })
      });

      toast.success('Prescription saved successfully!');
      
      // Optionally complete the appointment here if it wasn't already
      if (appointment.status !== 'completed') {
        await apiJson(`/api/appointments/${appointment._id}/complete`, { method: 'PUT' });
      }

      navigate('/doctor-dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to save prescription');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="write-prescription-page">
      <div className="prescription-container">
        <div className="prescription-header">
          <h2>Write Prescription</h2>
          <button className="btn outline-btn" onClick={() => navigate(-1)}>Back</button>
        </div>

        {appointment && (
          <div className="patient-info-card">
            <div className="info-row">
              <span className="label">Patient:</span>
              <span className="value">{appointment.patient.name}</span>
            </div>
            <div className="info-row">
              <span className="label">Date:</span>
              <span className="value">{new Date(appointment.date).toLocaleDateString()}</span>
            </div>
            <div className="info-row">
              <span className="label">Reason:</span>
              <span className="value">{appointment.reason}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="prescription-form">
          <div className="medications-section">
            <h3>Medications</h3>
            {medications.map((med, idx) => (
              <div key={idx} className="medication-row">
                <div className="med-header">
                  <h4>Medication #{idx + 1}</h4>
                  {medications.length > 1 && (
                    <button type="button" className="btn-remove" onClick={() => removeMedication(idx)}>✕ Remove</button>
                  )}
                </div>
                <div className="med-inputs">
                  <div className="form-group">
                    <label>Medicine Name *</label>
                    <input type="text" placeholder="e.g., Paracetamol" value={med.name} onChange={(e) => handleMedChange(idx, 'name', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Dosage *</label>
                    <input type="text" placeholder="e.g., 500mg" value={med.dosage} onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Frequency *</label>
                    <input type="text" placeholder="e.g., 1-0-1 or Twice daily" value={med.frequency} onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Duration *</label>
                    <input type="text" placeholder="e.g., 5 days" value={med.duration} onChange={(e) => handleMedChange(idx, 'duration', e.target.value)} required />
                  </div>
                  <div className="form-group full-width">
                    <label>Instructions (Optional)</label>
                    <input type="text" placeholder="e.g., Take after food" value={med.instructions} onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" className="btn add-med-btn" onClick={addMedication}>+ Add Another Medication</button>
          </div>

          <div className="notes-section">
            <h3>Doctor's Notes (Optional)</h3>
            <textarea 
              rows="4" 
              placeholder="Add any advice, diet restrictions, or next visit suggestions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn primary-btn submit-btn" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save & Issue Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WritePrescription;
