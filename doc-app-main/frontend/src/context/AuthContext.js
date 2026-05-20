import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signOut, 
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from '../firebaseConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Sign out function
  const logout = async () => {
    try {
      await signOut(auth); // Sign out from Firebase
      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'GET',
        credentials: 'include',
      });
      setCurrentUser(null);
      setUserProfile(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      await updateProfile(currentUser, updates);
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        ...updates
      }));
      
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setCurrentUser(prev => ({
        ...prev,
        ...updatedUser
      }));

      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Delete user account
  const deleteAccount = async (password) => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      // Re-authenticate user before deletion
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Delete the user
      await deleteUser(currentUser);
      setCurrentUser(null);
      setUserProfile(null);
      
      return { success: true };
    } catch (error) {
      console.error('Account deletion error:', error);
      throw error;
    }
  };

  // Check if user is verified
  const isEmailVerified = () => {
    return currentUser?.emailVerified || false;
  };

  // Get user's display name
  const getDisplayName = () => {
    return currentUser?.name || currentUser?.displayName || userProfile?.displayName || 'User';
  };

  // Get user's email
  const getEmail = () => {
    return currentUser?.email || '';
  };

  // Get user's phone number
  const getPhoneNumber = () => {
    return currentUser?.phoneNumber || userProfile?.phoneNumber || '';
  };

  // Get user's photo URL
  const getPhotoURL = () => {
    return currentUser?.photoURL || userProfile?.photoURL || '';
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!currentUser;
  };

  // Get user's UID
  const getUID = () => {
    return currentUser?.uid || '';
  };

  // Get user's creation time
  const getCreationTime = () => {
    return currentUser?.metadata?.creationTime || '';
  };

  // Get user's last sign in time
  const getLastSignInTime = () => {
    return currentUser?.metadata?.lastSignInTime || '';
  };

  // Check if user is anonymous
  const isAnonymous = () => {
    return currentUser?.isAnonymous || false;
  };

  // Check if user is from a provider (Google, Facebook, etc.)
  const isProviderUser = () => {
    return currentUser?.providerData?.length > 0;
  };

  // Get user's provider info
  const getProviderInfo = () => {
    return currentUser?.providerData || [];
  };

  // Get primary provider
  const getPrimaryProvider = () => {
    const providers = getProviderInfo();
    return providers.length > 0 ? providers[0].providerId : null;
  };

  // Check if user signed up with a specific provider
  const signedUpWithProvider = (providerId) => {
    const providers = getProviderInfo();
    return providers.some(provider => provider.providerId === providerId);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Set user profile data
        setUserProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          phoneNumber: user.phoneNumber,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          isAnonymous: user.isAnonymous,
          providerData: user.providerData,
          metadata: user.metadata
        });
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    setCurrentUser,
    logout,
    updateUserProfile,
    resetPassword,
    deleteAccount,
    isEmailVerified,
    getDisplayName,
    getEmail,
    getPhoneNumber,
    getPhotoURL,
    isAuthenticated,
    getUID,
    getCreationTime,
    getLastSignInTime,
    isAnonymous,
    isProviderUser,
    getProviderInfo,
    getPrimaryProvider,
    signedUpWithProvider
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
