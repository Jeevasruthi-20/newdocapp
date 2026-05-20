// server/middleware/adminMiddleware.js

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin rights required.' });
};

module.exports = { isAdmin };
