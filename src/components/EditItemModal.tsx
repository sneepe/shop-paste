import React, { useState, useEffect } from 'react';
import { ListItem } from './ShoppingListItem'; // Assuming ListItem interface is reusable or import path adjusted

interface EditItemModalProps {
    item: ListItem;
    onSave: (itemId: string, updatedData: Partial<ListItem>) => Promise<void>; // Pass only changed fields potentially
    onDelete: (itemId: string) => Promise<void>;
    onClose: () => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ item, onSave, onDelete, onClose }) => {
    const [name, setName] = useState(item.name);
    const [quantity, setQuantity] = useState<number | ''>(item.quantity);
    const [category, setCategory] = useState(item.category || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update state if the item prop changes (e.g., if modal stays open but item context changes)
    useEffect(() => {
        setName(item.name);
        setQuantity(item.quantity);
        setCategory(item.category || '');
    }, [item]);

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!name.trim()) {
            setError("Item name cannot be empty.");
            return;
        }
        if (quantity === '' || quantity <= 0) {
            setError("Quantity must be a positive number.");
            return;
        }

        setIsSaving(true);
        setError(null);
        const updatedData: Partial<ListItem> = {
            name: name.trim(),
            quantity: Number(quantity),
            category: category.trim(),
            // We don't update isDone or addedAt here
        };

        try {
            await onSave(item.id, updatedData);
            // onClose(); // Close modal on successful save - handled by parent usually
        } catch (err) {
            console.error("Error saving item:", err);
            setError("Failed to save changes. Please try again.");
            setIsSaving(false); // Keep modal open on error
        }
         // Do not set isSaving false here if onClose is handled by parent on success
    };

    const handleDelete = async () => {
         if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
             return;
         }
        setIsDeleting(true);
        setError(null);
        try {
            await onDelete(item.id);
             // onClose(); // Close modal on successful delete - handled by parent
        } catch (err) {
            console.error("Error deleting item:", err);
            setError("Failed to delete item. Please try again.");
            setIsDeleting(false); // Keep modal open on error
        }
    };

    // Basic modal styling
     const modalOverlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000, // Ensure it's above other content
    };

    const modalContentStyle: React.CSSProperties = {
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        minWidth: '300px',
        maxWidth: '500px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    };

    return (
        <div style={modalOverlayStyle} onClick={onClose}> {/* Close on overlay click */}
             <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside modal */}
                <h2>Edit Item</h2>
                <form onSubmit={handleSave}>
                     <div style={{ marginBottom: '15px' }}>
                         <label htmlFor="editName" style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
                         <input
                            type="text"
                            id="editName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                            disabled={isSaving || isDeleting}
                        />
                     </div>
                     <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                         <div style={{ flex: 1 }}>
                             <label htmlFor="editQuantity" style={{ display: 'block', marginBottom: '5px' }}>Quantity:</label>
                             <input
                                type="number"
                                id="editQuantity"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                min="1"
                                required
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                                disabled={isSaving || isDeleting}
                            />
                        </div>
                        <div style={{ flex: 2 }}>
                             <label htmlFor="editCategory" style={{ display: 'block', marginBottom: '5px' }}>Category:</label>
                             <input
                                type="text"
                                id="editCategory"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="E.g., Dairy, Produce"
                                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                                disabled={isSaving || isDeleting}
                            />
                        </div>
                     </div>

                     {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

                     <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                         <button
                            type="button" // Important: type="button" to prevent form submission
                            onClick={handleDelete}
                            disabled={isSaving || isDeleting}
                            style={{ padding: '10px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            {isDeleting ? 'Deleting...' : 'Delete Item'}
                         </button>
                        <div> {/* Group cancel and save buttons */}
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving || isDeleting}
                                style={{ marginRight: '10px', padding: '10px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || isDeleting}
                                style={{ padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                     </div>
                </form>
            </div>
        </div>
    );
};

export default EditItemModal;

// Helper to ensure ListItem interface is available
export type { ListItem }; 