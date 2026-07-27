const formatDoctorName = (name) => {
  if (!name) return 'Doctor';
  // Check if name already starts with "Dr." or "Dr " (case-insensitive)
  if (/^dr\.?\s/i.test(name)) {
    // Standardize to "Dr. "
    return name.replace(/^dr\.?\s*/i, 'Dr. ');
  }
  return `Dr. ${name}`;
};

module.exports = { formatDoctorName };
