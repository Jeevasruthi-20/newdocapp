/** Normalize API appointment for UI */
export const formatTime12 = (time24) => {
  if (!time24) return '';
  const match = String(time24).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time24;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
};

export const normalizeAppointment = (apt) => {
  if (!apt) return apt;
  const dateRaw = apt.date;
  const dateStr = dateRaw
    ? typeof dateRaw === 'string'
      ? dateRaw.split('T')[0]
      : new Date(dateRaw).toISOString().split('T')[0]
    : '';

  return {
    ...apt,
    doctorName: apt.doctor?.name || apt.doctorName || 'Doctor',
    specialty:
      apt.doctor?.doctorProfile?.specialization ||
      apt.specialty ||
      'General',
    time: apt.time || formatTime12(apt.startTime),
    type: apt.type || apt.appointmentType || 'consultation',
    date: dateStr || dateRaw,
  };
};

export const UPCOMING_STATUSES = ['scheduled', 'confirmed', 'pending', 'in-progress'];

export const getAppointmentDate = (apt) => {
  const d = apt.date;
  if (!d) return new Date(0);
  if (typeof d === 'string' && d.includes('T')) return new Date(d);
  return new Date(`${typeof d === 'string' ? d : new Date(d).toISOString().split('T')[0]}T12:00:00`);
};
