import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiFileText, FiBell, FiActivity, FiDownload,
  FiHeart, FiUser, FiChevronRight, FiClock, FiAlertCircle, FiCheckCircle, FiRefreshCw,
} from 'react-icons/fi';
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

  const fetchData = useCallback(() => {
    apiJson('/api/dashboard/patient')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
                          <p className="font-bold text-slate-800">Dr. {rx.doctorName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">ID: {rx.verificationId} · {formatDate(rx.consultationDate)}</p>
                        </div>
                      </div>
                      <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/prescriptions/${rx._id}/pdf`} target="_blank" rel="noreferrer">
                        <Button variant="secondary" size="sm" className="!rounded-lg hover:!bg-medical-50 border border-slate-200">
                          <FiDownload className="mr-1.5" /> PDF
                        </Button>
                      </a>
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
                    <div key={apt._id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100">
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">{apt.doctor?.name || 'Consultation'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(apt.date)}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 bg-medical-100 text-medical-700 rounded-lg">Done</span>
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
