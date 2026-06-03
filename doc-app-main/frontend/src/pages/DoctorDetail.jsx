import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiJson } from '../lib/api';
import { normalizeAppointment } from '../utils/appointmentHelpers';
import { useTranslation } from 'react-i18next';
import './DoctorDetail.css';

const DoctorDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const data = await apiJson(`/api/doctors/${id}`);
        setDoctor(data);
      } catch (err) {
        console.error('Failed to fetch doctor', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (!currentUser) return <Navigate to="/login" replace />;
  if (loading) return <div className="loader">{t('common.loading')}</div>;
  if (!doctor) return <div className="error">{t('common.notFound')}</div>;

  return (
    <div className="doctor-detail-page glass-container">
      <div className="doctor-header">
        <img src={doctor.img} alt={doctor.name} className="doctor-avatar" />
        <h1 className="doctor-name">{doctor.name}</h1>
        <p className="doctor-specialty">{doctor.specialty}</p>
      </div>
      <div className="doctor-info">
        <h2>{t('doctors.experience')}</h2>
        <p>{doctor.experience}</p>
        <h2>{t('doctors.location')}</h2>
        <p>{doctor.location}</p>
        <h2>{t('doctors.languages')}</h2>
        <p>{doctor.languages?.join(', ')}</p>
        <h2>{t('doctors.consultationFee')}</h2>
        <p>{doctor.consultationFee}</p>
      </div>
    </div>
  );
};

export default DoctorDetail;
