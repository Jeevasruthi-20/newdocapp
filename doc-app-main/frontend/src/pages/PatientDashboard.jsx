import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiFileText, FiBell, FiActivity, FiDownload,
  FiHeart, FiUser, FiChevronRight, FiClock, FiAlertCircle, FiCheckCircle, FiRefreshCw, FiStar,
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { apiJson } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatDate } from '../lib/utils';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card hover className="flex items-center gap-4">
    <div className={`w-12 h-12 rounded-medical flex items-center justify-center ${color}`}>
      <Icon className="text-xl text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </Card>
);

const PatientDashboard = () => {
  const { t } = useTranslation();
  const { getDisplayName } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delayActions, setDelayActions] = useState({});
  const [reviewingAptId, setReviewingAptId] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  const fetchData = useCallback(() => {
    apiJson('/api/dashboard/patient')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownloadPdf = (e, rx) => {
    e.preventDefault();
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.setTextColor(59, 130, 246);
      doc.text('MedConnect Hospital', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text('Your Trusted Healthcare Partner', 105, 28, { align: 'center' });
      
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 35, 190, 35);
      
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      
      doc.setFont(undefined, 'bold');
      doc.text('Doctor Details:', 20, 45);
      doc.setFont(undefined, 'normal');
      doc.text(`Dr. ${rx.doctor?.name || rx.doctorName || 'Unknown'}`, 20, 52);
      doc.text(`${rx.doctor?.doctorProfile?.specialization || 'General Physician'}`, 20, 59);
      
      doc.setFont(undefined, 'bold');
      doc.text('Patient Details:', 120, 45);
      doc.setFont(undefined, 'normal');
      doc.text(`Name: ${getDisplayName() || rx.patient?.name || 'Unknown'}`, 120, 52);
      doc.text(`Date: ${new Date(rx.date || rx.consultationDate).toLocaleDateString()}`, 120, 59);
      
      doc.line(20, 65, 190, 65);
      
      doc.setFont(undefined, 'bold');
      doc.text('Diagnosis:', 20, 75);
      doc.setFont(undefined, 'normal');
      const splitDiagnosis = doc.splitTextToSize(rx.diagnosis || 'Not specified', 170);
      doc.text(splitDiagnosis, 20, 82);
      
      const diagnosisHeight = splitDiagnosis.length * 7;
      let startY = 82 + diagnosisHeight + 5;
      
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
      
      doc.line(20, 270, 190, 270);
      doc.text(`Doctor Signature: _______________________`, 130, 280);
      
      doc.save(`prescription-${rx._id.substring(0,8)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF. Please try again later.");
    }
  };

  const handleAcceptDelay = async (aptId) => {
    setDelayActions(prev => ({ ...prev, [aptId]: 'loading' }));
    try {
      await apiJson(`/api/appointments/${aptId}/accept-delay`, { method: 'PUT' });
      toast.success('You have accepted the new appointment time!');
      setDelayActions(prev => ({ ...prev, [aptId]: 'accepted' }));
      fetchData();
    } catch (err) {
      toast.error('Failed to accept delay. Please try again.');
      setDelayActions(prev => ({ ...prev, [aptId]: null }));
    }
  };

  const handleReschedule = async (aptId) => {
    setDelayActions(prev => ({ ...prev, [aptId]: 'loading' }));
    try {
      await apiJson(`/api/appointments/${aptId}/reschedule-from-delay`, { method: 'PUT' });
      toast.success('Reschedule request submitted! Our team will contact you.');
      setDelayActions(prev => ({ ...prev, [aptId]: 'rescheduled' }));
      fetchData();
    } catch (err) {
      toast.error('Failed to submit request. Please try again.');
      setDelayActions(prev => ({ ...prev, [aptId]: null }));
    }
  };

  const handleReviewSubmit = async (aptId) => {
    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    try {
      await apiJson('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ appointmentId: aptId, rating: reviewRating, comment: reviewComment })
      });
      toast.success('Thank you for your review!');
      setReviewingAptId(null);
      setReviewRating(0);
      setReviewComment('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        Unable to load dashboard. Please try again.
      </div>
    );
  }

  const { stats, profileCompletion, upcomingAppointments, pastAppointments, prescriptions, notifications, healthSummary } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 rounded-2xl bg-medical-gradient p-6 sm:p-8 text-white shadow-medical-lg relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          
          <div className="relative z-10 block">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 block leading-tight">
              {t('dashboard.welcome')}, {getDisplayName()} 👋
            </h1>
            <p className="text-medical-100 opacity-90 block text-sm sm:text-base">
              {t('dashboard.subtitle')}
            </p>
            
            <div className="mt-5 flex flex-wrap gap-3 items-center">
              <div className="bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium border border-white/10">
                {t('dashboard.profileCompletion')}: {profileCompletion}%
              </div>
              <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompletion}%` }}
                  className="h-full bg-white rounded-full"
                />
              </div>
              {profileCompletion < 100 && (
                <Link to="/profile">
                  <Button variant="secondary" size="sm" className="!bg-white !text-medical-600 hover:!bg-slate-50">
                    {t('dashboard.completeProfile')}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="relative z-10 shrink-0 self-start sm:self-center">
            <Link to="/doctors">
              <Button className="!bg-white !text-medical-600 hover:!bg-slate-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all !rounded-xl !py-3 !px-6 font-semibold border-0">
                {t('dashboard.bookNow') || "Book Appointment"}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={FiCalendar} label={t('dashboard.upcoming')} value={stats.upcomingCount} color="bg-medical-500" />
          <StatCard icon={FiActivity} label={t('dashboard.completed')} value={stats.completedCount} color="bg-emerald-500" />
          <StatCard icon={FiFileText} label={t('dashboard.prescriptions')} value={stats.prescriptionsCount} color="bg-violet-500" />
          <StatCard icon={FiBell} label={t('dashboard.totalVisits')} value={stats.totalAppointments} color="bg-amber-500" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">{t('dashboard.upcomingAppointments')}</h2>
                <Link to="/appointments" className="text-medical-600 text-sm font-medium flex items-center gap-1 hover:underline">
                  {t('common.viewAll')} <FiChevronRight />
                </Link>
              </div>
              {upcomingAppointments.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12 border border-slate-100 bg-slate-50/50">
                  <FiCalendar className="text-slate-300 text-5xl mb-4" />
                  <p className="text-slate-500 font-medium">{t('dashboard.noAppointments')}</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt, i) => {
                    const isDelayed = apt.delayMinutes > 0;
                    const actionState = delayActions[apt._id];
                    const isLoading = actionState === 'loading';
                    return (
                      <motion.div key={apt._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="!p-0 overflow-hidden shadow-sm border border-slate-100">
                          {/* Delay Banner */}
                          <AnimatePresence>
                            {isDelayed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-amber-50 border-b border-amber-200 px-5 py-3"
                              >
                                <div className="flex items-start gap-3">
                                  <FiAlertCircle className="text-amber-500 mt-0.5 shrink-0 text-lg" />
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-amber-800 mb-0.5">
                                      ⏰ Running {apt.delayMinutes >= 60
                                        ? `${Math.floor(apt.delayMinutes / 60)}h ${apt.delayMinutes % 60 > 0 ? `${apt.delayMinutes % 60}m` : ''}`.trim()
                                        : `${apt.delayMinutes} mins`} late
                                    </p>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                      Dr. {apt.doctor?.name || 'Your doctor'} is running behind schedule.
                                      {apt.expectedStartTime && (
                                        <> Estimated consultation: <strong>{apt.expectedStartTime}</strong></>
                                      )}
                                    </p>
                                    {/* Action buttons */}
                                    {!apt.delayAccepted && actionState !== 'accepted' && actionState !== 'rescheduled' && (
                                      <div className="flex gap-2 mt-3">
                                        <button
                                          onClick={() => handleAcceptDelay(apt._id)}
                                          disabled={isLoading}
                                          className="text-xs px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm"
                                        >
                                          <FiCheckCircle size={12} /> Accept New Time
                                        </button>
                                        <button
                                          onClick={() => handleReschedule(apt._id)}
                                          disabled={isLoading}
                                          className="text-xs px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full font-medium disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm"
                                        >
                                          <FiRefreshCw size={12} /> Reschedule
                                        </button>
                                      </div>
                                    )}
                                    {(apt.delayAccepted || actionState === 'accepted') && (
                                      <p className="text-xs text-green-700 mt-2 font-medium flex items-center gap-1"><FiCheckCircle /> You accepted the new time</p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Appointment Info */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-medical-50 border border-medical-100 flex items-center justify-center text-medical-600 font-bold text-lg shrink-0">
                                {(apt.doctor?.name || 'D')[0]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-base">{apt.doctor?.name || 'Doctor'}</p>
                                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                                  <FiCalendar size={13} className="text-medical-400" /> {formatDate(apt.date)}
                                  <span className="mx-1 text-slate-300">|</span>
                                  <FiClock size={13} className="text-medical-400" />
                                  {isDelayed && apt.expectedStartTime
                                    ? <><s className="text-slate-400">{apt.startTime}</s> <span className="text-slate-300">→</span> <strong className="text-amber-600">{apt.expectedStartTime}</strong></>
                                    : apt.startTime
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center sm:items-end justify-start">
                              <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize flex items-center gap-1.5 ${
                                isDelayed
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-medical-50 text-medical-600 border border-medical-100'
                              }`}>
                                {isDelayed ? '🕐 Delayed' : <><span className="w-1.5 h-1.5 rounded-full bg-medical-500 inline-block"></span>{apt.status}</>}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-800">{t('prescription.history')}</h2>
                <Link to="/prescriptions" className="text-medical-600 text-sm font-medium hover:underline flex items-center gap-1">
                  {t('common.viewAll')} <FiChevronRight />
                </Link>
              </div>
              {prescriptions.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-10 border border-slate-100 bg-slate-50/50">
                  <FiFileText className="text-slate-300 text-4xl mb-3" />
                  <p className="text-slate-500 font-medium">{t('prescription.noPrescriptions')}</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((rx) => (
                    <Card key={rx._id} className="!p-5 flex justify-between items-center shadow-sm border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center shrink-0">
                          <FiFileText size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Dr. {rx.doctor?.name || rx.doctorName || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">ID: {rx._id.substring(0,8)} · {formatDate(rx.date || rx.consultationDate)}</p>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" className="!rounded-lg hover:!bg-medical-50 border border-slate-200" onClick={(e) => handleDownloadPdf(e, rx)}>
                        <FiDownload className="mr-1.5" /> PDF
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                <FiHeart className="text-medical-500" /> {t('dashboard.healthSummary')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-50"><span className="text-slate-500 text-sm font-medium">{t('profile.bloodGroup')}</span><span className="font-bold text-medical-600 bg-medical-50 px-2 py-0.5 rounded-md text-sm">{healthSummary.bloodGroup}</span></div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50"><span className="text-slate-500 text-sm font-medium">{t('profile.allergies')}</span><span className="font-bold text-slate-700 text-sm text-right max-w-[60%]">{healthSummary.allergies}</span></div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50"><span className="text-slate-500 text-sm font-medium">{t('profile.height')}</span><span className="font-bold text-slate-700 text-sm">{healthSummary.height}</span></div>
                <div className="flex justify-between items-center py-2"><span className="text-slate-500 text-sm font-medium">{t('profile.weight')}</span><span className="font-bold text-slate-700 text-sm">{healthSummary.weight}</span></div>
              </div>
              <Link to="/profile" className="mt-6 block">
                <Button variant="secondary" size="sm" className="w-full !rounded-xl border border-slate-200 hover:!bg-slate-50">
                  <FiUser className="mr-1.5" /> {t('dashboard.viewProfile')}
                </Button>
              </Link>
            </Card>

            <Card className="border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                <FiCalendar className="text-medical-500" /> {t('dashboard.pastAppointments')}
              </h3>
              <div className="space-y-3">
                {pastAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <FiCalendar className="text-slate-300 text-3xl mb-2" />
                    <p className="text-slate-400 text-sm font-medium">{t('dashboard.noPastAppointments')}</p>
                  </div>
                ) : (
                  pastAppointments.slice(0, 4).map((apt) => (
                    <div key={apt._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-700 text-sm">{apt.doctor?.name || 'Consultation'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{formatDate(apt.date)}</p>
                        </div>
                        {apt.isReviewed ? (
                          <div className="flex items-center text-yellow-500 bg-yellow-50 px-2 py-1 rounded-md text-xs font-bold border border-yellow-100">
                            <FiStar className="fill-current mr-1" /> Reviewed
                          </div>
                        ) : apt.status === 'completed' ? (
                          <button 
                            onClick={() => {
                              setReviewingAptId(reviewingAptId === apt._id ? null : apt._id);
                              setReviewRating(0);
                              setReviewComment('');
                            }}
                            className="text-xs font-bold px-2 py-1 bg-medical-50 text-medical-600 rounded-md hover:bg-medical-100 transition-colors border border-medical-200"
                          >
                            Rate Visit
                          </button>
                        ) : (
                          <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md capitalize">{apt.status}</span>
                        )}
                      </div>
                      
                      {/* Review Inline Form */}
                      <AnimatePresence>
                        {reviewingAptId === apt._id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} 
                            animate={{ height: 'auto', opacity: 1 }} 
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-1 pt-2 border-t border-slate-200"
                          >
                            <div className="flex justify-center gap-1 mb-2">
                              {[1,2,3,4,5].map(star => (
                                <FiStar 
                                  key={star} 
                                  className={`text-xl cursor-pointer transition-colors ${reviewRating >= star ? 'text-yellow-400 fill-current' : 'text-slate-300'}`}
                                  onClick={() => setReviewRating(star)}
                                />
                              ))}
                            </div>
                            <textarea 
                              className="w-full text-xs p-2 rounded-md border border-slate-200 mb-2 focus:ring-1 focus:ring-medical-500 focus:border-medical-500 outline-none"
                              placeholder="Add an optional comment..."
                              rows="2"
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              maxLength={500}
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setReviewingAptId(null)} className="text-xs px-3 py-1.5 text-slate-500 hover:text-slate-700 font-medium">Cancel</button>
                              <button onClick={() => handleReviewSubmit(apt._id)} className="text-xs px-3 py-1.5 bg-medical-600 text-white rounded-md hover:bg-medical-700 font-medium shadow-sm">Submit</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FiBell className="text-medical-500" /> {t('dashboard.notifications')}
              </h3>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <FiBell className="text-slate-300 text-3xl mb-2" />
                  <p className="text-slate-400 text-sm font-medium">{t('dashboard.noNotifications')}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-3 border-b border-slate-50 last:border-0">
                      <p className="text-sm font-bold text-slate-700">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
