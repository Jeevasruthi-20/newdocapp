// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBc9LghupbtHaEVMZwhimKAAGYQmoEt4lI",
  authDomain: "medtech-f8614.firebaseapp.com",
  projectId: "medtech-f8614",
  storageBucket: "medtech-f8614.appspot.com",
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
