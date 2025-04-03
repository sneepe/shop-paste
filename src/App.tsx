import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './config/firebase';
import './App.css'
import LoginPage from './pages/LoginPage.tsx' // Added .tsx
import RegisterPage from './pages/RegisterPage.tsx' // Added .tsx
import HomePage from './pages/HomePage.tsx' // Added .tsx
import ShoppingListDetailPage from './pages/ShoppingListDetailPage.tsx'; // Added import
import ProtectedRoute from './components/ProtectedRoute'; // Added import
import SettingsPage from './pages/SettingsPage.tsx'; // Added import

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={ // Wrapped HomePage with ProtectedRoute
          <ProtectedRoute user={user}>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/list/:listId"
        element={
          <ProtectedRoute user={user}>
            <ShoppingListDetailPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/settings"
        element={
          <ProtectedRoute user={user}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
