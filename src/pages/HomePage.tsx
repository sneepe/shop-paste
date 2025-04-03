import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import ShoppingListForm from '../components/ShoppingListForm';
import ShoppingListsDisplay from '../components/ShoppingListsDisplay';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Render the page structure, delegating form and display to components
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>My Shopping Lists</h1>
        <div>
          <Link to="/settings" style={{ marginRight: '15px' }}>
            Settings
          </Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Render form only if user exists */} 
      {user && <ShoppingListForm userId={user.uid} />}
      
      {/* Render display only if user exists */} 
      {user && <ShoppingListsDisplay userId={user.uid} />}

      {/* Handle case where user is somehow null despite protected route (edge case) */}  
      {!user && <p>Please log in to manage your lists.</p>}
    </div>
  );
};

export default HomePage; 