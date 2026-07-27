import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiBell, FiCheckCircle, FiCalendar, FiFileText, FiClock, FiInfo, FiBellOff } from 'react-icons/fi';
import { apiJson } from '../lib/api';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await apiJson('/api/notifications');
      setNotifications(data);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await apiJson(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const getNotificationIcon = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('approved') || msg.includes('confirmed')) return <FiCheckCircle className="notif-icon approved" />;
    if (msg.includes('booked') || msg.includes('scheduled')) return <FiCalendar className="notif-icon booked" />;
    if (msg.includes('prescription')) return <FiFileText className="notif-icon prescription" />;
    if (msg.includes('delay') || msg.includes('adjusted')) return <FiClock className="notif-icon delayed" />;
    return <FiInfo className="notif-icon info" />;
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <div className="header-title-row">
            <FiBell className="header-icon" />
            <h2>Notifications</h2>
          </div>
          <p className="header-subtitle">Stay updated on your appointments and prescriptions</p>
        </div>
        
        {notifications.length === 0 ? (
          <div className="empty-state">
            <FiBellOff className="empty-icon" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((n, i) => (
              <motion.div 
                key={n._id} 
                className={`notification-card ${n.isRead ? 'read' : 'unread'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !n.isRead && markAsRead(n._id)}
              >
                <div className="notification-icon-wrapper">
                  {getNotificationIcon(n.message)}
                </div>
                <div className="notification-content">
                  <p>{n.message}</p>
                  <span className="timestamp">
                    {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(n.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {!n.isRead && <span className="unread-dot"></span>}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
