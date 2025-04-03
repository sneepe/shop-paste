import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from 'firebase/auth';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
  if (!user) {
    // If user is not logged in, redirect to login page
    // 'replace' prevents adding the redirected route to history
    return <Navigate to="/login" replace />;
  }

  // If user is logged in, render the child components
  return <>{children}</>;
};

export default ProtectedRoute; 