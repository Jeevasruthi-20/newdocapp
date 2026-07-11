import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
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

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <h2>🔔 Your Notifications</h2>
        
        {notifications.length === 0 ? (
          <div className="empty-state">No new notifications</div>
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
                <div className="notification-content">
                  <p>{n.message}</p>
                  <span className="timestamp">{new Date(n.createdAt).toLocaleString()}</span>
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
