import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../context/CategoryContext';
import { Category, standardCategories, defaultCategoryColor } from '../config/standardCategories';
import { SketchPicker, ColorResult } from 'react-color';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// Define a limit for custom categories
const MAX_CUSTOM_CATEGORIES = 15; 

const SettingsPage: React.FC = () => {
    const { categories, loadingCategories, categoryError } = useCategories();
    const user = auth.currentUser;

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#cccccc');
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [showAddColorPicker, setShowAddColorPicker] = useState(false);

    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingColor, setEditingColor] = useState<string>('#ffffff');
    const [editingStandardColor, setEditingStandardColor] = useState<string>(defaultCategoryColor);
    const [showEditColorPicker, setShowEditColorPicker] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [isDeletingCategory, setIsDeletingCategory] = useState<string | null>(null);

    const handleAddColorChange = (color: ColorResult) => {
        setNewCategoryColor(color.hex);
    };

    const handleAddCategory = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user || !newCategoryName.trim()) {
            setAddError('Category name cannot be empty.');
            return;
        }

        const newCategoryId = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
        if (!newCategoryId) {
             setAddError('Invalid category name for ID generation.');
             return;
        }

        if (categories.some(cat => cat.id === newCategoryId)) {
            setAddError(`Category ID "${newCategoryId}" already exists. Please choose a different name.`);
            return;
        }

        // Check custom category limit
        const customCategoryCount = categories.filter(cat => !standardCategories.some(sc => sc.id === cat.id)).length;
        if (customCategoryCount >= MAX_CUSTOM_CATEGORIES) {
            setAddError(`You have reached the limit of ${MAX_CUSTOM_CATEGORIES} custom categories.`);
            return;
        }

        setIsAdding(true);
        setAddError(null);

        const newCategory: Category = {
            id: newCategoryId,
            name: newCategoryName.trim(),
            color: newCategoryColor,
        };

        const userCategoriesDocRef = doc(db, 'userCategories', user.uid);

        try {
            await updateDoc(userCategoriesDocRef, {
                categories: arrayUnion(newCategory)
            });
            setNewCategoryName('');
            setNewCategoryColor('#cccccc');
            setShowAddColorPicker(false);
        } catch (err) {
            console.error("Error adding category:", err);
            setAddError('Failed to add category. Please try again.');
        } finally {
            setIsAdding(false);
        }
    };

    const handleEditClick = (category: Category) => {
        setEditingCategoryId(category.id);
        setEditingColor(category.color);
        const standardCat = standardCategories.find(sc => sc.id === category.id);
        setEditingStandardColor(standardCat ? standardCat.color : defaultCategoryColor);
        setShowEditColorPicker(true);
        setUpdateError(null);
        setShowAddColorPicker(false);
    };

    const handleEditColorChange = (color: ColorResult) => {
        setEditingColor(color.hex);
    };

    const handleResetColorToStandard = () => {
        setEditingColor(editingStandardColor);
    };

    const handleUpdateCategoryColor = async () => {
        if (!user || !editingCategoryId || !categories) {
            return;
        }
        
        const categoryIndex = categories.findIndex(cat => cat.id === editingCategoryId);
        if (categoryIndex === -1) {
            setUpdateError("Could not find the category to update.");
            return;
        }

        const updatedCategories = categories.map((cat, index) => {
            if (index === categoryIndex) {
                return { ...cat, color: editingColor }; 
            }
            return cat;
        });

        setIsUpdating(true);
        setUpdateError(null);
        const userCategoriesDocRef = doc(db, 'userCategories', user.uid);

        try {
            await updateDoc(userCategoriesDocRef, {
                categories: updatedCategories 
            });
            
            setShowEditColorPicker(false);
            setEditingCategoryId(null);

        } catch (err) {
            console.error("!!! Error during updateDoc:", err);
            setUpdateError("Failed to save color change. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelEditColor = () => {
        setShowEditColorPicker(false);
        setEditingCategoryId(null);
        setUpdateError(null);
    };

    const handleDeleteCategory = async (categoryToDelete: Category) => {
        if (!user) return;
        if (standardCategories.some(sc => sc.id === categoryToDelete.id)) {
             console.warn("Attempted to delete a standard category. This shouldn't happen.");
             return; 
        }

        if (!window.confirm(`Are you sure you want to delete the category "${categoryToDelete.name}"? This cannot be undone.`)) {
            return;
        }

        setIsDeletingCategory(categoryToDelete.id);
        setUpdateError(null);

        const userCategoriesDocRef = doc(db, 'userCategories', user.uid);
        try {
            await updateDoc(userCategoriesDocRef, {
                categories: arrayRemove(categoryToDelete)
            });
        } catch (err) {
            console.error("Error deleting category:", err);
            setUpdateError("Failed to delete category. Please try again.");
        } finally {
             setIsDeletingCategory(null);
        }
    };

    return (
        <div>
            <Link to="/">&larr; Back to Lists</Link>
            <h1>Settings</h1>

            <h2>Manage Categories</h2>

            {loadingCategories && <p>Loading categories...</p>}
            {categoryError && <p style={{ color: 'red' }}>Error loading categories: {categoryError}</p>}
            {updateError && <p style={{ color: 'red' }}>{updateError}</p>}

            {!loadingCategories && !categoryError && (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {categories.map((cat: Category) => {
                        const isStandard = standardCategories.some(sc => sc.id === cat.id);
                        const isBeingDeleted = isDeletingCategory === cat.id;

                        return (
                            <li key={cat.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee', opacity: isBeingDeleted ? 0.5 : 1 }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: cat.color,
                                    marginRight: '15px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc'
                                }}></div>
                                <span style={{ flexGrow: 1 }}>{cat.name} ({cat.id}){isStandard ? ' (Standard)' : ''}</span>
                                <div style={{ position: 'relative' }}>
                                    <button 
                                        onClick={() => handleEditClick(cat)} 
                                        disabled={isAdding || isUpdating || isBeingDeleted} 
                                        style={{ marginRight: '10px' }}>
                                        Edit Color
                                    </button>
                                    {editingCategoryId === cat.id && showEditColorPicker && (
                                        <div style={{ position: 'absolute', right: 0, top: '30px', zIndex: '2' }}>
                                            <SketchPicker color={editingColor} onChangeComplete={handleEditColorChange} />
                                            <div style={{ background: 'white', padding: '5px', textAlign: 'right', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                                <button onClick={handleResetColorToStandard} title={`Reset to standard (${editingStandardColor})`}>
                                                    Reset
                                                </button>
                                                <div>
                                                    <button onClick={handleCancelEditColor} style={{ marginRight: '5px' }}>Cancel</button>
                                                    <button 
                                                        onClick={handleUpdateCategoryColor}
                                                        disabled={isUpdating}
                                                    >
                                                        {isUpdating ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {!isStandard && (
                                    <button 
                                        onClick={() => handleDeleteCategory(cat)} 
                                        disabled={isAdding || isUpdating || isBeingDeleted} 
                                        style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', padding: '5px 8px' }}>
                                        {isBeingDeleted ? 'Deleting...' : 'Delete'}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            <div style={{marginTop: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px'}}>
                <h3>Add New Category</h3>
                <form onSubmit={handleAddCategory}>
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="newCatName" style={{ display: 'block', marginBottom: '5px' }}>Category Name:</label>
                        <input
                            type="text"
                            id="newCatName"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="E.g., Snacks"
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                            disabled={isAdding}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                         <label style={{ display: 'block', marginBottom: '5px' }}>Category Color:</label>
                         <div 
                             style={{
                                 display: 'inline-block',
                                 padding: '5px',
                                 background: '#fff',
                                 borderRadius: '4px',
                                 border: '1px solid #ccc',
                                 cursor: 'pointer'
                             }} onClick={() => setShowAddColorPicker(!showAddColorPicker)}>
                            <div style={{ 
                                width: '36px', 
                                height: '14px', 
                                borderRadius: '2px', 
                                background: newCategoryColor 
                            }} />
                         </div>
                         {showAddColorPicker ? (
                            <div style={{ position: 'absolute', zIndex: '2' }}>
                                <div style={{ position: 'fixed', top: '0px', right: '0px', bottom: '0px', left: '0px' }} onClick={() => setShowAddColorPicker(false)} />
                                <SketchPicker color={newCategoryColor} onChangeComplete={handleAddColorChange} />
                            </div>
                         ) : null}
                    </div>

                    {addError && <p style={{ color: 'red' }}>{addError}</p>}

                    <button type="submit" disabled={isAdding} style={{ padding: '10px 15px' }}>
                        {isAdding ? 'Adding...' : 'Add Category'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage; 