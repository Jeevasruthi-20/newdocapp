import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { 
  FiEdit2, FiCamera, FiPhone, FiCalendar, FiUser, FiMapPin, 
  FiDroplet, FiAlertTriangle, FiActivity, FiPhoneCall, FiHeart 
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { calcProfileCompletion, formatAddress } from '../lib/utils';
import { getImageUrl } from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const FIELD_MAP = {
  name: 'name',
  phone: 'phone',
  dob: 'dob',
  gender: 'gender',
  bloodGroup: 'bloodGroup',
  address: 'address',
  height: 'heightCm',
  weight: 'weightKg',
  allergies: 'allergies',
  emergencyContactName: 'emergencyContactName',
  emergencyContactPhone: 'emergencyContactPhone',
  emergencyContactRelation: 'emergencyContactRelation',
};

const UserProfile = () => {
  const { t } = useTranslation();
  const { currentUser, updateUserProfile, getDisplayName } = useAuth();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const completion = calcProfileCompletion(currentUser);
  const photoUrl = getImageUrl(currentUser?.profileImage);

  const openEdit = (field, value) => {
    setEditing(field);
    if (field === 'address') {
      setForm({ [field]: formatAddress(currentUser?.address) });
    } else if (field === 'allergies') {
      setForm({ [field]: (currentUser?.allergies || []).map((a) => a.name).join(', ') });
    } else if (field === 'emergencyContactName') {
      setForm({
        emergencyContactName: currentUser?.emergencyContact?.name || '',
        emergencyContactPhone: currentUser?.emergencyContact?.phone || '',
        emergencyContactRelation: currentUser?.emergencyContact?.relationship || '',
      });
      setEditing('emergency');
    } else {
      setForm({ [field]: value ?? '' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing === 'emergency') {
        await updateUserProfile({
          emergencyContactName: form.emergencyContactName,
          emergencyContactPhone: form.emergencyContactPhone,
          emergencyContactRelation: form.emergencyContactRelation,
        });
      } else {
        const key = FIELD_MAP[editing] || editing;
        await updateUserProfile({ [key]: form[editing] ?? form[key] ?? '' });
      }
      toast.success(t('profile.updateSuccess'));
      setEditing(null);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await updateUserProfile({}, file);
      toast.success(t('profile.photoUpdated'));
    } catch {
      toast.error(t('profile.photoFailed'));
    }
  };

  const displayValue = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return formatAddress(value) || '—';
    return String(value);
  };

  const InfoRow = ({ icon: Icon, iconColor = "text-medical-400", label, value, field, className = "" }) => (
    <div className={`group flex justify-between items-start py-2.5 rounded-lg hover:bg-slate-50 transition-colors px-3 -mx-3 ${className}`}>
      <div className="flex gap-3">
        {Icon && (
          <div className={`mt-0.5 ${iconColor}`}>
            <Icon size={18} />
          </div>
        )}
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">{label}</p>
          <p className="font-semibold text-slate-800">{displayValue(value)}</p>
        </div>
      </div>
      {field && (
        <button 
          type="button" 
          onClick={() => openEdit(field, value)} 
          className="p-2 text-slate-300 hover:text-medical-600 hover:bg-medical-50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-medical-500"
          title="Edit"
        >
          <FiEdit2 size={15} />
        </button>
      )}
    </div>
  );

  const initials = getDisplayName().split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const getEditingTitle = () => {
    if (editing === 'emergency') return t('profile.editEmergency');
    return `${t('common.edit')} ${t(`profile.${editing}`)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column - Sidebar (35%) */}
        <div className="w-full lg:w-1/3">
          <Card className="overflow-hidden h-full !p-0">
            {/* Banner with pattern */}
            <div className="bg-medical-gradient h-28 relative">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
            </div>
            
            <div className="px-6 pb-8 flex flex-col items-center text-center relative">
              {/* Avatar with Circular Progress Ring */}
              <div className="relative inline-block -mt-14 mb-4">
                <div className="relative flex items-center justify-center w-28 h-28">
                  <svg className="absolute inset-0 transform -rotate-90 w-full h-full pointer-events-none">
                    <circle className="text-white" strokeWidth="6" stroke="currentColor" fill="transparent" r="50" cx="56" cy="56" />
                    <circle className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="transparent" r="50" cx="56" cy="56" />
                    <circle className="text-medical-500 transition-all duration-1000 ease-in-out" strokeWidth="4" strokeDasharray={314} strokeDashoffset={314 - (completion / 100) * 314} strokeLinecap="round" stroke="currentColor" fill="transparent" r="50" cx="56" cy="56" />
                  </svg>
                  
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-sm relative z-10 bg-white" />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-medical-50 flex items-center justify-center text-3xl font-bold text-medical-600 shadow-sm relative z-10">
                      {initials}
                    </div>
                  )}
                  
                  <label className="absolute bottom-1 right-1 w-8 h-8 bg-medical-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-md z-20 hover:bg-medical-700 transition hover:scale-105 border-2 border-white">
                    <FiCamera size={14} />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  </label>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-slate-800">{getDisplayName()}</h1>
              <p className="text-sm text-slate-500 mb-3">{currentUser?.email}</p>
              <span className="inline-block px-4 py-1 rounded-full bg-medical-50 text-medical-600 text-xs font-bold uppercase tracking-wider">{currentUser?.role || 'patient'}</span>
              
              <div className="mt-8 pt-6 border-t border-slate-100 w-full text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">{t('dashboard.profileCompletion')}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${completion}%` }} className="h-full bg-medical-gradient rounded-full" />
                  </div>
                  <span className="font-bold text-medical-600 text-sm">{completion}%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Main Content (65%) */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* Personal Info Card */}
          <Card className="!p-6 sm:!p-8">
            <h2 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
              <FiUser className="text-medical-500" /> {t('profile.personalInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <InfoRow icon={FiUser} label={t('profile.fullName')} value={currentUser?.name} field="name" />
              <InfoRow icon={FiPhone} label={t('profile.phone')} value={currentUser?.phone} field="phone" />
              <InfoRow icon={FiCalendar} label={t('profile.dob')} value={currentUser?.dob ? new Date(currentUser.dob).toLocaleDateString() : ''} field="dob" />
              <InfoRow icon={FiUser} label={t('profile.gender')} value={currentUser?.gender} field="gender" />
              <InfoRow icon={FiMapPin} label={t('profile.address')} value={formatAddress(currentUser?.address)} field="address" className="md:col-span-2" />
            </div>
          </Card>

          {/* Medical Info Card - Orange left border */}
          <Card className="!p-6 sm:!p-8 border-l-4 border-l-orange-500 bg-orange-50/30">
            <h2 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
              <FiHeart className="text-orange-500" /> {t('profile.medicalInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <InfoRow icon={FiDroplet} label={t('profile.bloodGroup')} value={currentUser?.bloodGroup} field="bloodGroup" iconColor="text-red-500" />
              <InfoRow icon={FiAlertTriangle} label={t('profile.allergies')} value={(currentUser?.allergies || []).map((a) => a.name).join(', ')} field="allergies" iconColor="text-orange-500" />
              <InfoRow icon={FiActivity} label={t('profile.height')} value={currentUser?.height ? `${currentUser.height} cm` : ''} field="height" iconColor="text-emerald-500" />
              <InfoRow icon={FiActivity} label={t('profile.weight')} value={currentUser?.weight ? `${currentUser.weight} kg` : ''} field="weight" iconColor="text-emerald-500" />
            </div>
          </Card>

          {/* Emergency Contact */}
          <Card className="!p-6 sm:!p-8 border-l-4 border-l-medical-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FiPhoneCall className="text-medical-500" /> {t('profile.emergencyContact')}
              </h2>
              <Button variant="secondary" size="sm" onClick={() => openEdit('emergencyContactName')} className="!text-sm hover:!bg-medical-50">
                <FiEdit2 className="mr-2" /> {t('profile.editEmergency')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
              <InfoRow icon={FiUser} label={t('profile.name')} value={currentUser?.emergencyContact?.name} />
              <InfoRow icon={FiPhone} label={t('profile.phone')} value={currentUser?.emergencyContact?.phone} />
              <InfoRow icon={FiUser} label={t('profile.relationship')} value={currentUser?.emergencyContact?.relationship} />
            </div>
          </Card>

        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-xl text-slate-800 mb-6 capitalize flex items-center gap-2">
              <FiEdit2 className="text-medical-500" /> {getEditingTitle()}
            </h3>
            
            {editing === 'bloodGroup' ? (
              <select className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-6 bg-slate-50 focus:bg-white focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 outline-none transition-all" value={form.bloodGroup || ''} onChange={(e) => setForm({ bloodGroup: e.target.value })}>
                <option value="">{t('common.filter') === 'வடிகட்டு' ? 'தேர்ந்தெடுக்கவும்' : 'Select Blood Group'}</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            ) : editing === 'gender' ? (
              <select className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-6 bg-slate-50 focus:bg-white focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 outline-none transition-all" value={form.gender || ''} onChange={(e) => setForm({ gender: e.target.value })}>
                <option value="">Select Gender</option>
                {['male', 'female', 'other', 'prefer-not-to-say'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : editing === 'emergency' ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('profile.name')}</label>
                  <input className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 outline-none transition-all" placeholder="E.g. John Doe" value={form.emergencyContactName || ''} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('profile.phone')}</label>
                  <input className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 outline-none transition-all" placeholder="E.g. +1 234 567 8900" value={form.emergencyContactPhone || ''} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t('profile.relationship')}</label>
                  <input className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 outline-none transition-all" placeholder="E.g. Spouse, Parent" value={form.emergencyContactRelation || ''} onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })} />
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 outline-none transition-all"
                  type={editing === 'dob' ? 'date' : editing === 'height' || editing === 'weight' ? 'number' : 'text'}
                  value={form[editing] ?? form[FIELD_MAP[editing]] ?? ''}
                  onChange={(e) => setForm({ [editing]: e.target.value })}
                  placeholder={`Enter ${editing}`}
                />
              </div>
            )}
            
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 !rounded-xl !py-2.5 hover:!bg-slate-100 border border-slate-200" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
              <Button className="flex-1 !rounded-xl !py-2.5 shadow-md hover:shadow-lg" onClick={handleSave} disabled={saving}>{saving ? t('common.loading') : t('common.save')}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
