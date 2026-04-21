'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const SESSION_TIMEOUT = 40 * 60 * 1000; // 40 minutes in milliseconds
const WARNING_TIME = 3 * 60 * 1000; // 3 minutes before logout
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
];

export function useSessionManagement() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(() => {
    // Clear all timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Clear session storage
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_email');

    // Reset state
    setShowWarning(false);
    setTimeLeft(0);

    // Redirect to login
    window.location.href = '/admin';
  }, []);

  const extendSession = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Reset warning state
    setShowWarning(false);
    setTimeLeft(0);

    // Update last activity
    lastActivityRef.current = Date.now();

    // Set new warning timeout (37 minutes from now)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeLeft(WARNING_TIME / 1000); // Convert to seconds

      // Start countdown interval
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set final logout timeout (40 minutes from now)
    timeoutRef.current = setTimeout(logout, SESSION_TIMEOUT);
  }, [logout]);

  const resetActivity = useCallback(() => {
    // Only reset if not currently showing warning
    if (!showWarning) {
      extendSession();
    }
  }, [showWarning, extendSession]);

  useEffect(() => {
    // Check if user is already logged in
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      extendSession();
    }

    // Set up activity listeners
    const handleActivity = () => resetActivity();

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetActivity, extendSession]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    showWarning,
    timeLeft,
    formatTime,
    extendSession,
    logout,
  };
}