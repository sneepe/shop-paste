import React from 'react';
import { Timestamp } from 'firebase/firestore'; // Firestore types might be needed if passed directly
import { useLongPress } from 'use-long-press'; // Import long press hook
import { useCategories } from '../context/CategoryContext'; // Import category hook

// Re-use or import the ListItem interface
export interface ListItem {
    id: string;
    name: string;
    quantity: number;
    category?: string;
    addedAt: Timestamp;
    isDone: boolean;
}

interface ShoppingListItemProps {
    item: ListItem;
    // listId is no longer needed directly here if handlers handle context
    onToggleDone: (itemId: string, currentStatus: boolean) => Promise<void>;
    // onDeleteItem removed, handled by onEdit now
    onEdit: (item: ListItem) => void; // Pass the whole item to edit handler
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({ item, onToggleDone, onEdit }) => {
    const { getCategoryColor } = useCategories(); // Get the color function from context

    // --- Long Press Hook Setup ---
    // Callback for long press action
    const handleLongPress = React.useCallback(() => {
        // Prevent toggling 'done' status on long press release if needed
        // (Depends on library, useLongPress usually handles this well)
        console.log('Long press detected for:', item.name);
        onEdit(item);
    }, [item, onEdit]);

    // Hook configuration
    const bind = useLongPress(handleLongPress, {
        threshold: 500, 
        captureEvent: true, 
        cancelOnMovement: true,
    });
    // --- End Long Press Setup ---

    // Determine background color based on category and done status
    const backgroundColor = item.isDone 
        ? '#f0f0f0' // Grey out if done
        : getCategoryColor(item.category); // Get color from context

    const cardStyle: React.CSSProperties = {
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '15px',
        margin: '1%',
        width: '31%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        // Removed justifyContent, not needed without explicit button
        minHeight: '100px', // Can maybe reduce minHeight now
        opacity: item.isDone ? 0.6 : 1,
        backgroundColor: backgroundColor, // Use dynamic background color
        cursor: 'pointer', // Indicate the whole card is interactive
        userSelect: 'none', // Prevent text selection during press/drag
        WebkitUserSelect: 'none', // Safari
        MozUserSelect: 'none', // Firefox
        msUserSelect: 'none', // IE
    };

    const itemTextStyle: React.CSSProperties = {
         textDecoration: item.isDone ? 'line-through' : 'none',
         // No flexGrow needed, card itself is flex container
    };

    // Simple click handler for toggling done status
    const handleClick = () => {
        // This might not fire after a successful long press if captureEvent is true
        console.log('Short click detected for:', item.name);
        onToggleDone(item.id, item.isDone);
    };

    return (
        // Apply long press bindings and onClick to the main card div
        <div style={cardStyle} {...bind()} onClick={handleClick} >
            <div style={itemTextStyle}>
                {/* Removed checkbox div */}
                 <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{item.name}</span>
                 <div style={{ marginTop: '5px', fontSize: '0.9em', color: '#555' }}>
                     {item.quantity > 0 &&
                        <span>({item.quantity})</span>
                    }
                     {item.category &&
                        <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>
                            [{item.category}]
                        </span>
                    }
                </div>
             </div>
             {/* Removed delete button */}
        </div>
    );
};

export default ShoppingListItem; 