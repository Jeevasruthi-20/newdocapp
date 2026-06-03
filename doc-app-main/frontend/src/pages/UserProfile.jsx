import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FiEdit2, FiCamera } from 'react-icons/fi';
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

  const InfoRow = ({ label, value, field }) => (
    <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="font-medium text-slate-800 mt-0.5">{displayValue(value)}</p>
      </div>
      {field && (
        <button type="button" onClick={() => openEdit(field, value)} className="p-2 text-medical-600 hover:bg-medical-50 rounded-lg">
          <FiEdit2 size={16} />
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
    <div className="min-h-screen bg-gradient-to-b from-medical-50 to-white py-10">
      <div className="max-w-3xl mx-auto px-4">
        <Card className="mb-6 overflow-hidden">
          <div className="bg-medical-gradient h-24" />
          <div className="px-6 pb-6 -mt-12 relative">
            <div className="relative inline-block">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-medical" />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-medical-100 flex items-center justify-center text-2xl font-bold text-medical-600 shadow-medical">
                  {initials}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-medical-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow">
                <FiCamera size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>
            <h1 className="text-xl font-bold text-slate-800 mt-3">{getDisplayName()}</h1>
            <p className="text-sm text-slate-500">{currentUser?.email}</p>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-medical-50 text-medical-600 text-xs font-semibold capitalize">{currentUser?.role || 'patient'}</span>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">{t('dashboard.profileCompletion')}</span>
                <span className="font-bold text-medical-600">{completion}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${completion}%` }} className="h-full bg-medical-gradient rounded-full" />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <h2 className="font-bold text-slate-800 mb-2">{t('profile.personalInfo')}</h2>
            <InfoRow label={t('profile.fullName')} value={currentUser?.name} field="name" />
            <InfoRow label={t('profile.phone')} value={currentUser?.phone} field="phone" />
            <InfoRow label={t('profile.dob')} value={currentUser?.dob ? new Date(currentUser.dob).toLocaleDateString() : ''} field="dob" />
            <InfoRow label={t('profile.gender')} value={currentUser?.gender} field="gender" />
            <InfoRow label={t('profile.address')} value={formatAddress(currentUser?.address)} field="address" />
          </Card>

          <Card>
            <h2 className="font-bold text-slate-800 mb-2">{t('profile.medicalInfo')}</h2>
            <InfoRow label={t('profile.bloodGroup')} value={currentUser?.bloodGroup} field="bloodGroup" />
            <InfoRow label={t('profile.allergies')} value={(currentUser?.allergies || []).map((a) => a.name).join(', ')} field="allergies" />
            <InfoRow label={t('profile.height')} value={currentUser?.height ? `${currentUser.height} cm` : ''} field="height" />
            <InfoRow label={t('profile.weight')} value={currentUser?.weight ? `${currentUser.weight} kg` : ''} field="weight" />
          </Card>

          <Card>
            <h2 className="font-bold text-slate-800 mb-2">{t('profile.emergencyContact')}</h2>
            <InfoRow label={t('profile.name')} value={currentUser?.emergencyContact?.name} />
            <InfoRow label={t('profile.phone')} value={currentUser?.emergencyContact?.phone} />
            <InfoRow label={t('profile.relationship')} value={currentUser?.emergencyContact?.relationship} />
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => openEdit('emergencyContactName')}>
              <FiEdit2 /> {t('profile.editEmergency')}
            </Button>
          </Card>
        </div>

        {/* Edit modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setEditing(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-medical-lg shadow-medical-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-slate-800 mb-4 capitalize">{getEditingTitle()}</h3>
              {editing === 'bloodGroup' ? (
                <select className="w-full border border-slate-200 rounded-medical px-3 py-2 mb-4" value={form.bloodGroup || ''} onChange={(e) => setForm({ bloodGroup: e.target.value })}>
                  <option value="">{t('common.filter') === 'வடிகட்டு' ? 'தேர்ந்தெடுக்கவும்' : 'Select'}</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              ) : editing === 'gender' ? (
                <select className="w-full border border-slate-200 rounded-medical px-3 py-2 mb-4" value={form.gender || ''} onChange={(e) => setForm({ gender: e.target.value })}>
                  {['male', 'female', 'other', 'prefer-not-to-say'].map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              ) : editing === 'emergency' ? (
                <>
                  <input className="w-full border rounded-medical px-3 py-2 mb-2" placeholder={t('profile.name')} value={form.emergencyContactName || ''} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
                  <input className="w-full border rounded-medical px-3 py-2 mb-2" placeholder={t('profile.phone')} value={form.emergencyContactPhone || ''} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
                  <input className="w-full border rounded-medical px-3 py-2 mb-4" placeholder={t('profile.relationship')} value={form.emergencyContactRelation || ''} onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })} />
                </>
              ) : (
                <input
                  className="w-full border border-slate-200 rounded-medical px-3 py-2 mb-4"
                  type={editing === 'dob' ? 'date' : editing === 'height' || editing === 'weight' ? 'number' : 'text'}
                  value={form[editing] ?? form[FIELD_MAP[editing]] ?? ''}
                  onChange={(e) => setForm({ [editing]: e.target.value })}
                />
              )}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? t('common.loading') : t('common.save')}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
