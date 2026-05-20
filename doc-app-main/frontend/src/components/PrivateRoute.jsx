import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { currentUser } = useAuth();
  
  // If authorized, render the child routes
  // If not, redirect to login page with the return URL
  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
