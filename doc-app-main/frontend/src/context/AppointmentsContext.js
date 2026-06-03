import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiJson, getAccessToken } from '../lib/api';
import { useAuth } from './AuthContext';
import { normalizeAppointment } from '../utils/appointmentHelpers';

// Generate a deterministic key for storing doctor override in localStorage (using ID if present, otherwise date/startTime/doctorId)
const getOverrideKey = (apt) => {
  if (apt._id) return `override_${apt._id}`;
  if (apt.date && apt.startTime && apt.doctorId) return `override_${apt.date}_${apt.startTime}_${apt.doctorId}`;
  return null;
};

const AppointmentsContext = createContext();

export const AppointmentsProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const fetchAppointments = useCallback(async () => {
    if (!currentUser) {
      setAppointments([]);
      return;
    }
    setLoading(true);
    try {
      const data = await apiJson('/api/appointments/user');
      // Normalize incoming data
      const normalizedData = Array.isArray(data) ? data.map(normalizeAppointment) : [];
      // Apply persisted overrides from localStorage (in case of page refresh)
      const storedOverrides = JSON.parse(localStorage.getItem('appointmentOverrides') || '{}');
      const merged = normalizedData.map((apt) => {
        const key = getOverrideKey(apt);
        if (key && storedOverrides[key]) {
          const o = storedOverrides[key];
          if (o.doctorName) apt.doctorName = o.doctorName;
          if (o.doctorId) apt.doctorId = o.doctorId;
        }
        return apt;
      });
      setAppointments(merged);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const addAppointment = async (appointmentData) => {
    if (!currentUser) {
      const err = new Error('Please log in to book an appointment.');
      err.status = 401;
      throw err;
    }
    if (!getAccessToken()) {
      const err = new Error('Your session expired. Please log in again.');
      err.status = 401;
      throw err;
    }
    const data = await apiJson('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    let normalized = normalizeAppointment(data);
    // Override with request data if provided, ensuring correct doctor info
    if (appointmentData.doctorName) {
      normalized.doctorName = appointmentData.doctorName;
    }
    if (appointmentData.doctorId) {
      normalized.doctorId = appointmentData.doctorId;
    }
    // Persist override in localStorage for future fetches (e.g., after page refresh)
    if (normalized._id && normalized.doctorId && normalized.date && normalized.startTime) {
      const key = getOverrideKey(normalized);
      const overrides = JSON.parse(localStorage.getItem('appointmentOverrides') || '{}');
      overrides[key] = {
        doctorName: normalized.doctorName,
        doctorId: normalized.doctorId,
      };
      localStorage.setItem('appointmentOverrides', JSON.stringify(overrides));
    }
    setAppointments((prev) => [normalized, ...prev]);
    return normalized;
  };

  const cancelAppointment = async (id) => {
    await apiJson(`/api/appointments/${id}`, { method: 'DELETE' });
    setAppointments((prev) =>
      prev.map((apt) => (apt._id === id ? { ...apt, status: 'cancelled' } : apt))
    );
  };

  return (
    <AppointmentsContext.Provider
      value={{ appointments, addAppointment, cancelAppointment, fetchAppointments, loading, setAppointments }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => useContext(AppointmentsContext);
export default AppointmentsContext;
