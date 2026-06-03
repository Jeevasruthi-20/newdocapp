import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppointmentsProvider } from './context/AppointmentsContext';
import Doctors from './pages/Doctors';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Appointments from './pages/Appointments';
import Footer from './components/Footer';
import About from './pages/About';
import HealthyBlog from './pages/HealthyBlog';
import BlogDetail from './pages/BlogDetail';
import UserProfile from './pages/UserProfile';
import PatientDashboard from './pages/PatientDashboard';
import Prescriptions from './pages/Prescriptions';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import BillingCalculator from './pages/BillingCalculator';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import './App.css';

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <AppointmentsProvider>
        <div className="app-wrapper">
          <Toaster position="top-center" />
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/blog" element={<HealthyBlog />} />
              <Route path="/blog/:slug" element={<BlogDetail />} />
              {/* Public Doctors route - accessible without login */}
              <Route path="/doctors" element={<Doctors />} />
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<PatientDashboard />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/prescriptions" element={<Prescriptions />} />
                <Route path="/billing" element={<BillingCalculator />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AppointmentsProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default App;
