import React, { useState, useEffect } from 'react';
import './DarkThemeDemo.css';

const DarkThemeDemo = () => {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from localStorage or default to false
    const stored = localStorage.getItem('demoTheme');
    return stored === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('demoTheme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <div className="demo-container">
      <h2>Dark Theme Demo</h2>
      <p>This page demonstrates the dark / light theme toggle used throughout the app.</p>
      <button className="theme-toggle" onClick={toggleTheme}>
        Switch to {isDark ? 'Light' : 'Dark'} Mode
      </button>
    </div>
  );
};

export default DarkThemeDemo;
