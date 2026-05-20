// AppointmentsContext.js
import React, { createContext, useState, useContext, useEffect } from "react";

const AppointmentsContext = createContext();

export const AppointmentsProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch appointments from API
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/appointments/user");
      const data = await res.json();
      if (res.ok) setAppointments(data);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const addAppointment = (appointment) => {
    setAppointments((prev) => [appointment, ...prev]);
  };

  const cancelAppointment = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAppointments(prev => prev.map(apt => 
          apt._id === id ? { ...apt, status: 'cancelled' } : apt
        ));
      }
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
    }
  };

  return (
    <AppointmentsContext.Provider
      value={{ appointments, addAppointment, cancelAppointment, fetchAppointments, loading, setAppointments }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
};

// Custom hook
export const useAppointments = () => useContext(AppointmentsContext);

export default AppointmentsContext;
