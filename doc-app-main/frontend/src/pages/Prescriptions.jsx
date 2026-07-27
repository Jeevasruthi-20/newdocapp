import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDownload, FiShield, FiEye } from 'react-icons/fi';
import { apiJson } from '../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Prescriptions.css';

const Prescriptions = () => {
  const { t } = useTranslation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    apiJson('/api/prescriptions/my', { headers: { 'Cache-Control': 'no-cache' } })
      .then(setPrescriptions)
      .catch(err => {
        console.error("Prescriptions fetch error:", err);
        alert("Failed to load prescriptions: " + err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const downloadPdf = (rx) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(59, 130, 246);
      doc.text('MedConnect Hospital', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text('Your Trusted Healthcare Partner', 105, 28, { align: 'center' });
      
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 35, 190, 35);
      
      // Info Section
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      
      doc.setFont(undefined, 'bold');
      doc.text('Doctor Details:', 20, 45);
      doc.setFont(undefined, 'normal');
      doc.text(`Dr. ${rx.doctor?.name}`, 20, 52);
      doc.text(`${rx.doctor?.doctorProfile?.specialization || 'General Physician'}`, 20, 59);
      
      doc.setFont(undefined, 'bold');
      doc.text('Patient Details:', 120, 45);
      doc.setFont(undefined, 'normal');
      doc.text(`Name: ${rx.patient?.name}`, 120, 52);
      doc.text(`Date: ${new Date(rx.date).toLocaleDateString()}`, 120, 59);
      
      doc.line(20, 65, 190, 65);
      
      // Diagnosis
      doc.setFont(undefined, 'bold');
      doc.text('Diagnosis:', 20, 75);
      doc.setFont(undefined, 'normal');
      const splitDiagnosis = doc.splitTextToSize(rx.diagnosis || 'Not specified', 170);
      doc.text(splitDiagnosis, 20, 82);
      
      const diagnosisHeight = splitDiagnosis.length * 7;
      let startY = 82 + diagnosisHeight + 5;
      
      // Table
      const tableData = rx.medications?.map((m, i) => [
        i + 1,
        m.name,
        m.dosage,
        m.frequency,
        m.duration,
        m.beforeAfterFood,
        m.instructions || '-'
      ]) || [];

      autoTable(doc, {
        startY: startY,
        head: [['#', 'Medicine', 'Dosage', 'Frequency', 'Duration', 'Timing', 'Instructions']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
        margin: { top: 10 }
      });
      
      let finalY = doc.lastAutoTable.finalY + 10;
      
      // Notes & Follow up
      if (rx.notes) {
        doc.setFont(undefined, 'bold');
        doc.text('Additional Notes:', 20, finalY);
        doc.setFont(undefined, 'normal');
        const splitNotes = doc.splitTextToSize(rx.notes, 170);
        doc.text(splitNotes, 20, finalY + 7);
        finalY += (splitNotes.length * 7) + 5;
      }
      
      if (rx.followUpDate) {
        doc.setFont(undefined, 'bold');
        doc.text(`Follow-up Date: ${new Date(rx.followUpDate).toLocaleDateString()}`, 20, finalY);
        finalY += 10;
      }
      
      // Footer
      doc.line(20, 270, 190, 270);
      doc.text(`Doctor Signature: _______________________`, 130, 280);
      
      doc.save(`prescription-${rx._id.substring(0,8)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF. Please try again later.");
    }
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    const searchMatch = (rx.doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (rx.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase());
    const dateMatch = dateFilter ? new Date(rx.date).toISOString().split('T')[0] === dateFilter : true;
    return searchMatch && dateMatch;
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="prescriptions-page">
      <div className="prescriptions-container">
        <div className="page-header">
          <h1>{t('prescription.title')}</h1>
          <p>View and download your verified digital prescriptions</p>
        </div>

        <div className="prescription-filters">
          <input 
            type="text" 
            placeholder="Search by doctor or diagnosis..." 
            className="filter-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <input 
            type="date" 
            className="filter-input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {filteredPrescriptions.length === 0 ? (
          <div className="no-results">
            <span className="no-results-icon">📋</span>
            <p>No prescriptions found.</p>
          </div>
        ) : (
          <div className="prescriptions-list">
            {filteredPrescriptions.map(rx => (
              <div key={rx._id} className="prescription-card">
                <div className="rx-header">
                  <div>
                    <h3>Dr. {rx.doctor?.name || 'Unknown'}</h3>
                    <p>{rx.doctor?.doctorProfile?.specialization || 'MedConnect Hospital'}</p>
                  </div>
                  <FiShield size={24} opacity={0.8} />
                </div>
                
                <div className="rx-body">
                  <div className="rx-meta">
                    <span><strong>ID:</strong> {rx._id.substring(0, 8).toUpperCase()}</span>
                    <span><strong>Date:</strong> {new Date(rx.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="rx-diagnosis">
                    <h4>Diagnosis</h4>
                    <p>{rx.diagnosis || 'General Consultation'}</p>
                  </div>
                  
                  {expandedId !== rx._id && (
                    <div className="rx-medicines-preview">
                      <strong>Medicines:</strong>
                      <ul>
                        {rx.medications?.slice(0, 2).map((m, i) => (
                          <li key={i}>{m.name} - {m.dosage}</li>
                        ))}
                        {rx.medications?.length > 2 && (
                          <li><em>+ {rx.medications.length - 2} more</em></li>
                        )}
                      </ul>
                    </div>
                  )}

                  {expandedId === rx._id && (
                    <div className="rx-expanded-details">
                      <table className="rx-medicines-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                            <th>Timing</th>
                            <th>Instructions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rx.medications?.map((m, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td><strong>{m.name}</strong></td>
                              <td>{m.dosage}</td>
                              <td>{m.frequency}</td>
                              <td>{m.duration}</td>
                              <td>{m.beforeAfterFood}</td>
                              <td>{m.instructions || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {rx.notes && (
                        <div className="rx-notes">
                          <h4>Doctor's Notes</h4>
                          <p>{rx.notes}</p>
                        </div>
                      )}
                      
                      {rx.followUpDate && (
                        <div className="rx-followup">
                          <h4>Follow-up Recommended</h4>
                          <p>{new Date(rx.followUpDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rx-actions">
                    <button 
                      className="btn-view"
                      onClick={() => setExpandedId(expandedId === rx._id ? null : rx._id)}
                    >
                      <FiEye /> {expandedId === rx._id ? 'Hide Details' : 'View Full Prescription'}
                    </button>
                    <button 
                      className="btn-download"
                      onClick={() => downloadPdf(rx)}
                    >
                      <FiDownload /> Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;
