import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    doc, getDoc, collection, query, onSnapshot, orderBy, Timestamp, 
    updateDoc,
    deleteDoc,
    writeBatch,
    where,
    getDocs
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useCategories } from '../context/CategoryContext';
import AddItemForm from '../components/AddItemForm';
import ShoppingListItem, { ListItem } from '../components/ShoppingListItem';
import EditItemModal from '../components/EditItemModal';

// Interface for ShoppingListDoc can remain local if not needed elsewhere
interface ShoppingListDoc { 
    name: string;
    ownerId: string;
}

const UNCATEGORIZED_KEY = '__uncategorized__'; // Special key for uncategorized items

const ShoppingListDetailPage: React.FC = () => {
    const { listId } = useParams<{ listId: string }>();
    const [listName, setListName] = useState<string | null>(null);
    const [items, setItems] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const user = auth.currentUser;
    const [isRemovingCompleted, setIsRemovingCompleted] = useState(false);
    const [editingItem, setEditingItem] = useState<ListItem | null>(null);

    // Get categories from context
    const { categories: availableCategories, getCategoryColor, loadingCategories } = useCategories();

    // Effect to fetch list details (name) and items
    useEffect(() => {
        if (!listId || !user) {
            setError("List ID or user is missing.");
            setLoading(false);
            return;
        }

        let isMounted = true; // Flag to prevent state update on unmounted component
        setLoading(true);
        setError(null);

        // --- 1. Fetch List Name (Optional but nice) ---
        const listDocRef = doc(db, 'shoppingLists', listId);
        getDoc(listDocRef).then(docSnap => {
            if (!isMounted) return;
            if (docSnap.exists()) {
                const listData = docSnap.data() as ShoppingListDoc;
                // Security check: Ensure the current user owns this list
                if (listData.ownerId === user.uid) {
                    setListName(listData.name);
                } else {
                     setError("You don't have permission to view this list.");
                     setListName(null); // Clear name if not owner
                }
            } else {
                setError("Shopping list not found.");
            }
        }).catch(err => {
             if (!isMounted) return;
            console.error("Error fetching list document:", err);
            setError("Could not fetch list details.");
        });


        // --- 2. Fetch List Items (Real-time) ---
        // Ensure listDocRef is valid before querying subcollection
        if (!listDocRef) return;

        const itemsCollectionRef = collection(listDocRef, 'items');
        // Add ordering if needed, e.g., orderBy('addedAt', 'asc')
        const q = query(itemsCollectionRef, orderBy('addedAt', 'asc'));

        const unsubscribeItems = onSnapshot(q, (querySnapshot) => {
            if (!isMounted) return;
            const fetchedItems: ListItem[] = [];
            querySnapshot.forEach((doc) => {
                 fetchedItems.push({
                    id: doc.id,
                    ...doc.data()
                } as ListItem);
            });
            setItems(fetchedItems);
            setLoading(false); // Set loading false after items are fetched
        }, (err) => {
             if (!isMounted) return;
            console.error("Error fetching items:", err);
            // Don't overwrite list fetch error if item fetch fails later
            if (!error) {
                 setError("Could not fetch list items.");
            }
            setLoading(false);
        });

        // Cleanup function for item listener
        return () => {
            isMounted = false;
            unsubscribeItems();
        };

    }, [listId, user]); // Re-run only if listId or user changes

    // --- Action Handlers ---
    const handleToggleDone = async (itemId: string, currentStatus: boolean) => {
        if (editingItem) return;
        if (!listId) return;
        const itemDocRef = doc(db, 'shoppingLists', listId, 'items', itemId);
        try {
            await updateDoc(itemDocRef, { isDone: !currentStatus });
        } catch (err) {
            console.error("Error updating item status:", err);
            setError("Could not update item status. Please try again.");
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleEditItem = (item: ListItem) => {
        setEditingItem(item);
    };

    const handleCloseEditModal = () => {
        setEditingItem(null);
    };

    const handleSaveItem = async (itemId: string, updatedData: Partial<ListItem>) => {
        if (!listId) return;
        const itemDocRef = doc(db, 'shoppingLists', listId, 'items', itemId);
        try {
            await updateDoc(itemDocRef, updatedData);
            handleCloseEditModal();
        } catch (err) {
            console.error("Error saving item:", err);
            throw err;
        }
    };

    const handleDeleteItemFromModal = async (itemId: string) => {
        if (!listId) return;
        const itemDocRef = doc(db, 'shoppingLists', listId, 'items', itemId);
        try {
            await deleteDoc(itemDocRef);
            handleCloseEditModal();
        } catch (err) {
            console.error("Error deleting item:", err);
            throw err;
        }
    };

    const handleRemoveCompleted = async () => {
        if (!listId || !items.some(item => item.isDone)) return;

        if (!window.confirm("Are you sure you want to remove all completed items?")) {
            return;
        }

        setIsRemovingCompleted(true);
        setError(null);

        const itemsCollectionRef = collection(db, 'shoppingLists', listId, 'items');
        const completedItemsQuery = query(itemsCollectionRef, where("isDone", "==", true));

        try {
            const querySnapshot = await getDocs(completedItemsQuery);
            if (querySnapshot.empty) {
                console.log("No completed items found to remove.");
                setIsRemovingCompleted(false);
                return;
            }

            const batch = writeBatch(db);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log("Successfully removed completed items.");

        } catch (err) {
            console.error("Error removing completed items:", err);
            setError("Could not remove completed items. Please try again.");
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsRemovingCompleted(false);
        }
    };

    // --- Grouping Logic --- 
    const groupedItems = useMemo(() => {
        const groups = new Map<string, ListItem[]>();
        // Ensure uncategorized group always exists
        groups.set(UNCATEGORIZED_KEY, []);

        // Initialize groups based on available categories to maintain order
        availableCategories.forEach(cat => {
            groups.set(cat.id, []);
        });

        // Distribute items into groups
        items.forEach(item => {
            const categoryId = item.category?.toLowerCase() || UNCATEGORIZED_KEY;
            const group = groups.get(categoryId);
            if (group) {
                group.push(item);
            } else {
                // If item category doesn't match any known category (e.g., old data),
                // put it in uncategorized
                groups.get(UNCATEGORIZED_KEY)?.push(item);
            }
        });

        // Filter out empty category groups (but keep uncategorized even if empty initially)
        const filledGroups = new Map<string, ListItem[]>();
        groups.forEach((itemsInGroup, categoryId) => {
            if (itemsInGroup.length > 0 || categoryId === UNCATEGORIZED_KEY) {
                 // Optional: Sort items within each group (e.g., alphabetically)
                 // itemsInGroup.sort((a, b) => a.name.localeCompare(b.name));
                filledGroups.set(categoryId, itemsInGroup);
            }
        });

        return filledGroups;
    }, [items, availableCategories]); // Recalculate when items or available categories change
    // -----------------------

    const hasCompletedItems = items.some(item => item.isDone);

    // --- Render Logic ---
    if ((loading || loadingCategories) && !editingItem) {
        return <div>Loading list details...</div>;
    }

    if (editingItem) {
        return (
            <EditItemModal 
                item={editingItem}
                onSave={handleSaveItem}
                onDelete={handleDeleteItemFromModal}
                onClose={handleCloseEditModal}
            />
        );
    }

    if (!loading && !listName && !error) {
        return <div>List not found or you don't have access. <Link to="/">Go back</Link></div>;
    }
    if (!loading && error) {
        return <div>Error: {error} <Link to="/">Go back</Link></div>;
    }

    return (
        <div>
            <Link to="/">&larr; Back to My Lists</Link>
            <h1>{listName || 'List'}</h1>
            {listId && <AddItemForm listId={listId} />}
            <h2>Items:</h2>
            {items.length === 0 ? (
                <p>This list is empty. Add some items!</p>
            ) : (
                <>
                    {Array.from(groupedItems.entries()).map(([categoryId, itemsInCategory]) => {
                        // Skip rendering the 'uncategorized' header if it's empty
                        if (categoryId === UNCATEGORIZED_KEY && itemsInCategory.length === 0) {
                            return null;
                        }

                        // Find category details for the header
                        const categoryInfo = availableCategories.find(cat => cat.id === categoryId);
                        const categoryName = categoryInfo ? categoryInfo.name : "Uncategorized";
                        // Use getCategoryColor from context which includes default handling
                        const categoryColor = getCategoryColor(categoryId); 

                        return (
                            <div key={categoryId} style={{ marginBottom: '25px' }}>
                                {/* Category Header */} 
                                <h3 style={{ 
                                    borderBottom: `2px solid ${categoryColor}`, 
                                    paddingBottom: '5px', 
                                    marginBottom: '15px',
                                    color: categoryColor // Optional: color the text too
                                }}>
                                    {categoryName}
                                </h3>
                                {/* Grid for items in this category */} 
                                <div style={{
                                    display: 'flex', 
                                    flexWrap: 'wrap',
                                    margin: '-1%'
                                }}>
                                    {itemsInCategory.map(item => (
                                        <ShoppingListItem 
                                            key={item.id} 
                                            item={item} 
                                            onToggleDone={handleToggleDone}
                                            onEdit={handleEditItem} 
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {hasCompletedItems && (
                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button 
                                onClick={handleRemoveCompleted}
                                disabled={isRemovingCompleted} 
                                style={{ padding: '8px 15px', background: '#f0ad4e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                {isRemovingCompleted ? 'Removing...' : 'Remove Completed Items'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ShoppingListDetailPage; 