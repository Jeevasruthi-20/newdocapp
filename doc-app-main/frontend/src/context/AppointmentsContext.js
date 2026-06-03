import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiJson, getAccessToken } from '../lib/api';
import { useAuth } from './AuthContext';
import { normalizeAppointment } from '../utils/appointmentHelpers';

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
      setAppointments(Array.isArray(data) ? data.map(normalizeAppointment) : []);
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
    const normalized = normalizeAppointment(data);
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
