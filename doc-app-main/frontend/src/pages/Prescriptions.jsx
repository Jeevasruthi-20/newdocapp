import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiDownload, FiFileText, FiShield } from 'react-icons/fi';
import { apiJson, API_BASE, getAccessToken } from '../lib/api';
import Card from '../components/ui/Card';
import { formatDate } from '../lib/utils';

const Prescriptions = () => {
  const { t } = useTranslation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiJson('/api/prescriptions')
      .then(setPrescriptions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const downloadPdf = async (id, verificationId) => {
    const token = getAccessToken();
    const res = await fetch(`${API_BASE}/api/prescriptions/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${verificationId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white py-10">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{t('prescription.title')}</h1>
          <p className="text-slate-500 mb-8">View and download your verified digital prescriptions</p>
        </motion.div>

        {prescriptions.length === 0 ? (
          <Card className="text-center py-12">
            <FiFileText className="text-4xl text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{t('prescription.noPrescriptions')}</p>
            <p className="text-sm text-slate-400 mt-2">Prescriptions appear here after doctor consultations</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx, i) => (
              <motion.div key={rx._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="!p-0 overflow-hidden">
                  <div className="bg-medical-gradient px-6 py-4 text-white flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">Dr. {rx.doctorName}</p>
                      <p className="text-sm text-medical-100">{rx.hospitalName}</p>
                    </div>
                    <FiShield className="text-2xl opacity-80" />
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                      <span>ID: <strong className="text-medical-600">{rx.verificationId}</strong></span>
                      <span>{formatDate(rx.consultationDate)}</span>
                      <span>{rx.medicines?.length || 0} medicines</span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {rx.medicines?.map((m, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex gap-2">
                          <span className="font-semibold text-medical-600">{idx + 1}.</span>
                          <span><strong>{m.name}</strong> — {m.dosage} {m.frequency && `· ${m.frequency}`}</span>
                        </li>
                      ))}
                    </ul>
                    {rx.diagnosis && <p className="text-sm text-slate-500 mb-4"><strong>Diagnosis:</strong> {rx.diagnosis}</p>}
                    <button
                      type="button"
                      onClick={() => downloadPdf(rx._id, rx.verificationId)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-medical bg-medical-600 text-white text-sm font-semibold hover:bg-medical-700 transition-colors"
                    >
                      <FiDownload /> {t('prescription.downloadPdf')}
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;
