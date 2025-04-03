import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

// Re-using the interface definition (or could import from a shared types file)
interface ShoppingList {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
}

interface ShoppingListsDisplayProps {
  userId: string; // Pass user ID as prop
}

const ShoppingListsDisplay: React.FC<ShoppingListsDisplayProps> = ({ userId }) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to fetch user's lists in real-time
  useEffect(() => {
    if (!userId) {
      // If userId is not yet available (e.g., during initial auth loading),
      // clear lists and potentially set loading state, or handle as appropriate.
      setLists([]);
      setLoadingLists(false); // Or true depending on desired UX
      return;
    }

    setLoadingLists(true);
    setError(null);

    const listsCollection = collection(db, 'shoppingLists');
    const q = query(listsCollection, where('ownerId', '==', userId), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedLists: ShoppingList[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLists.push({ 
          id: doc.id, 
          ...doc.data() 
        } as ShoppingList);
      });
      setLists(fetchedLists);
      setLoadingLists(false);
    }, (err) => {
      console.error("Error fetching lists:", err);
      setError("Could not fetch shopping lists.");
      setLoadingLists(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [userId]); // Re-run effect if userId changes

  // Render logic
  if (loadingLists) {
    return <p>Loading lists...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (lists.length === 0) {
    return <p>You have no shopping lists yet. Add one using the form above!</p>;
  }

  return (
    <ul>
      {lists.map((list) => (
        <li key={list.id}>
          <Link to={`/list/${list.id}`}>{list.name}</Link>
        </li>
      ))}
    </ul>
  );
};

export default ShoppingListsDisplay; 