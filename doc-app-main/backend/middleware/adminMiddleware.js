const { protect } = require('./authMiddleware');

const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin rights required.' });
};

const adminAuth = [protect, isAdmin];

module.exports = { isAdmin, adminAuth };
