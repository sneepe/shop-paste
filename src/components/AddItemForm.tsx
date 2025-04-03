import React, { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AddItemFormProps {
  listId: string; // Needs listId to know where to add the item
}

const AddItemForm: React.FC<AddItemFormProps> = ({ listId }) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1); // Default quantity 1
  const [category, setCategory] = useState(''); // Replaced unit with category
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!listId || !itemName.trim()) {
      setError("Item name cannot be empty.");
      return;
    }
     if (quantity === '' || quantity <= 0) {
         setError("Quantity must be a positive number.");
         return;
     }


    setIsAdding(true);
    setError(null);

    try {
      // Reference to the 'items' subcollection of the specific list
      const itemsCollectionRef = collection(db, 'shoppingLists', listId, 'items');

      await addDoc(itemsCollectionRef, {
        name: itemName.trim(),
        quantity: Number(quantity), // Ensure it's stored as a number
        category: category.trim(), // Added category
        addedAt: Timestamp.now(),
        isDone: false // New items are not done by default
      });

      // Clear form on success
      setItemName('');
      setQuantity(1);
      setCategory(''); // Reset category state

    } catch (err) {
      console.error("Error adding item:", err);
      setError("Could not add the item. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <form onSubmit={handleAddItem} style={{ margin: '20px 0' }}>
      <h3>Add New Item</h3>
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="itemName" style={{ marginRight: '5px' }}>Name:</label>
        <input
          type="text"
          id="itemName"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="E.g., Milk"
          required
          disabled={isAdding}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
         <label htmlFor="quantity" style={{ marginRight: '5px' }}>Quantity:</label>
         <input
             type="number"
             id="quantity"
             value={quantity}
             onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
             min="1" // Basic HTML5 validation
             style={{ width: '60px', marginRight: '10px' }}
             required
             disabled={isAdding}
         />
         <label htmlFor="category" style={{ marginRight: '5px' }}>Category:</label>
         <input
             type="text"
             id="category"
             value={category}
             onChange={(e) => setCategory(e.target.value)}
             placeholder="E.g., Dairy, Produce"
             style={{ width: '120px' }}
             disabled={isAdding}
         />
      </div>

      <button type="submit" disabled={isAdding}>
        {isAdding ? 'Adding...' : 'Add Item'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '5px' }}>{error}</p>}
    </form>
  );
};

export default AddItemForm; 