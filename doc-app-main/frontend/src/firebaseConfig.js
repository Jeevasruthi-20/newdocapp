// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBdnM0qq97wUCbh0Rs_11X98SihX_-e6UQ",
  authDomain: "doctor-appointment-app-ba87e.firebaseapp.com",
  projectId: "doctor-appointment-app-ba87e",
  storageBucket: "doctor-appointment-app-ba87e.appspot.com",
  messagingSenderId: "718938056522",
  appId: "1:718938056522:web:06165786995a17b924c3b3",
  measurementId: "G-ZGPVZWY99D",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth and Provider exports
const auth = getAuth(app);

// Google Provider with custom parameters
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Facebook Provider
const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

// Apple Provider
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export { auth, googleProvider, facebookProvider, appleProvider };
