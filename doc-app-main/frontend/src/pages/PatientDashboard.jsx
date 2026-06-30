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
  const [delayActions, setDelayActions] = useState({}); // { [aptId]: 'loading' | 'accepted' | 'rescheduled' }

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

  const { stats, profileCompletion, upcomingAppointments, pastAppointments, prescriptions, notifications, recentActivity, healthSummary } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-medical-lg bg-medical-gradient p-8 text-white shadow-medical-lg relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            {t('dashboard.welcome')}, {getDisplayName()} 👋
          </h1>
          <p className="text-medical-100 opacity-90">{t('dashboard.subtitle')}</p>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <div className="bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium">
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
                <Button variant="secondary" size="sm" className="!bg-white !text-medical-600">
                  {t('dashboard.completeProfile')}
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FiCalendar} label={t('dashboard.upcoming')} value={stats.upcomingCount} color="bg-medical-500" />
          <StatCard icon={FiActivity} label={t('dashboard.completed')} value={stats.completedCount} color="bg-emerald-500" />
          <StatCard icon={FiFileText} label={t('dashboard.prescriptions')} value={stats.prescriptionsCount} color="bg-violet-500" />
          <StatCard icon={FiBell} label={t('dashboard.totalVisits')} value={stats.totalAppointments} color="bg-amber-500" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">{t('dashboard.upcomingAppointments')}</h2>
                <Link to="/appointments" className="text-medical-600 text-sm font-medium flex items-center gap-1 hover:underline">
                  {t('common.viewAll')} <FiChevronRight />
                </Link>
              </div>
              {upcomingAppointments.length === 0 ? (
                <Card>
                  <p className="text-slate-500 text-center py-4">{t('dashboard.noAppointments')}</p>
                  <Link to="/doctors" className="block text-center mt-2">
                    <Button size="sm">{t('dashboard.bookNow')}</Button>
                  </Link>
                </Card>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt, i) => {
                    const isDelayed = apt.delayMinutes > 0;
                    const actionState = delayActions[apt._id];
                    const isLoading = actionState === 'loading';
                    return (
                      <motion.div key={apt._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="!p-0 overflow-hidden">
                          {/* Delay Banner */}
                          <AnimatePresence>
                            {isDelayed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-amber-50 border-b border-amber-200 px-4 py-2"
                              >
                                <div className="flex items-start gap-2">
                                  <FiAlertCircle className="text-amber-500 mt-0.5 shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-800">
                                      ⏰ Running {apt.delayMinutes >= 60
                                        ? `${Math.floor(apt.delayMinutes / 60)}h ${apt.delayMinutes % 60 > 0 ? `${apt.delayMinutes % 60}m` : ''}`.trim()
                                        : `${apt.delayMinutes} mins`} late
                                    </p>
                                    <p className="text-xs text-amber-700">
                                      Dr. {apt.doctor?.name || 'Your doctor'} is running behind schedule.
                                      {apt.expectedStartTime && (
                                        <> Estimated consultation: <strong>{apt.expectedStartTime}</strong></>
                                      )}
                                    </p>
                                    {/* Action buttons */}
                                    {!apt.delayAccepted && actionState !== 'accepted' && actionState !== 'rescheduled' && (
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          onClick={() => handleAcceptDelay(apt._id)}
                                          disabled={isLoading}
                                          className="text-xs px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium disabled:opacity-50 flex items-center gap-1 transition-colors"
                                        >
                                          <FiCheckCircle size={11} /> Accept New Time
                                        </button>
                                        <button
                                          onClick={() => handleReschedule(apt._id)}
                                          disabled={isLoading}
                                          className="text-xs px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-full font-medium disabled:opacity-50 flex items-center gap-1 transition-colors"
                                        >
                                          <FiRefreshCw size={11} /> Reschedule
                                        </button>
                                      </div>
                                    )}
                                    {(apt.delayAccepted || actionState === 'accepted') && (
                                      <p className="text-xs text-green-700 mt-1 font-medium">✅ You accepted the new time</p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Appointment Info */}
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-medical-100 flex items-center justify-center text-medical-600 font-bold">
                                {(apt.doctor?.name || 'D')[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">{apt.doctor?.name || 'Doctor'}</p>
                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                  <FiCalendar size={12} /> {formatDate(apt.date)}
                                  <span className="mx-1">·</span>
                                  <FiClock size={12} />
                                  {isDelayed && apt.expectedStartTime
                                    ? <><s className="text-slate-400">{apt.startTime}</s> → <strong className="text-amber-600">{apt.expectedStartTime}</strong></>
                                    : apt.startTime
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                                isDelayed
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-medical-50 text-medical-600'
                              }`}>
                                {isDelayed ? `🕐 ${apt.delayMinutes}m delay` : apt.status}
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">{t('dashboard.pastAppointments')}</h2>
              </div>
              <div className="space-y-2">
                {pastAppointments.slice(0, 3).map((apt) => (
                  <Card key={apt._id} hover={false} className="!p-4 flex justify-between items-center">
                    <span className="font-medium text-slate-700">{apt.doctor?.name || 'Consultation'}</span>
                    <span className="text-sm text-slate-400">{formatDate(apt.date)}</span>
                  </Card>
                ))}
                {pastAppointments.length === 0 && <p className="text-slate-400 text-sm">{t('dashboard.noPastAppointments')}</p>}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">{t('prescription.history')}</h2>
                <Link to="/prescriptions" className="text-medical-600 text-sm font-medium hover:underline">{t('common.viewAll')}</Link>
              </div>
              {prescriptions.length === 0 ? (
                <Card><p className="text-slate-500 text-center py-2">{t('prescription.noPrescriptions')}</p></Card>
              ) : (
                prescriptions.map((rx) => (
                  <Card key={rx._id} className="!p-4 flex justify-between items-center mb-2">
                    <div>
                      <p className="font-semibold text-slate-800">Dr. {rx.doctorName}</p>
                      <p className="text-xs text-slate-500">{rx.verificationId} · {formatDate(rx.consultationDate)}</p>
                    </div>
                    <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/prescriptions/${rx._id}/pdf`} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm"><FiDownload /> PDF</Button>
                    </a>
                  </Card>
                ))
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FiHeart className="text-medical-500" /> {t('dashboard.healthSummary')}
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">{t('profile.bloodGroup')}</dt><dd className="font-semibold">{healthSummary.bloodGroup}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">{t('profile.allergies')}</dt><dd className="font-semibold text-right max-w-[60%]">{healthSummary.allergies}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">{t('profile.height')}</dt><dd className="font-semibold">{healthSummary.height}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">{t('profile.weight')}</dt><dd className="font-semibold">{healthSummary.weight}</dd></div>
              </dl>
              <Link to="/profile" className="mt-4 block">
                <Button variant="secondary" size="sm" className="w-full"><FiUser /> {t('dashboard.viewProfile')}</Button>
              </Link>
            </Card>

            <Card>
              <h3 className="font-bold text-slate-800 mb-3">{t('dashboard.notifications')}</h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400">{t('dashboard.noNotifications')}</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="py-2 border-b border-slate-50 last:border-0">
                    <p className="text-sm font-medium text-slate-700">{n.title}</p>
                    <p className="text-xs text-slate-400">{n.message}</p>
                  </div>
                ))
              )}
            </Card>

            <Card>
              <h3 className="font-bold text-slate-800 mb-3">{t('dashboard.recentActivity')}</h3>
              {recentActivity.map((act, i) => (
                <div key={i} className="flex gap-2 py-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-medical-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-700">{act.title}</p>
                    <p className="text-xs text-slate-400">{act.meta} · {formatDate(act.date)}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
