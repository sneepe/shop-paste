import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ShoppingListFormProps {
  userId: string; // Pass user ID as prop
}

const ShoppingListForm: React.FC<ShoppingListFormProps> = ({ userId }) => {
  const [newListName, setNewListName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false); // Optional: Loading state for the button

  const handleAddList = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !newListName.trim()) return;

    setIsAdding(true);
    setError(null);

    try {
      const listsCollection = collection(db, 'shoppingLists');
      await addDoc(listsCollection, {
        name: newListName.trim(),
        ownerId: userId,
        createdAt: Timestamp.now()
      });
      setNewListName(''); // Clear input field on success
    } catch (err) {
      console.error("Error adding list:", err);
      setError("Could not add the new list. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <form onSubmit={handleAddList} style={{ marginTop: '20px', marginBottom: '20px' }}>
      <input 
        type="text"
        value={newListName}
        onChange={(e) => setNewListName(e.target.value)}
        placeholder="New list name"
        required
        disabled={isAdding} // Disable input while adding
      />
      <button type="submit" disabled={isAdding}> {/* Disable button while adding */}
        {isAdding ? 'Adding...' : 'Add List'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '5px' }}>{error}</p>} {/* Display add error */}
    </form>
  );
};

export default ShoppingListForm; 