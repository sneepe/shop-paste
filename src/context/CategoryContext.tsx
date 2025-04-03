// src/context/CategoryContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth'; // Use hook for easier auth state handling
import { Category, standardCategories, defaultCategoryColor } from '../config/standardCategories';

interface CategoryContextProps {
    categories: Category[];
    getCategoryColor: (categoryId: string | undefined) => string;
    loadingCategories: boolean;
    categoryError: string | null;
}

const CategoryContext = createContext<CategoryContextProps | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, loadingAuth, errorAuth] = useAuthState(auth);
    const [categories, setCategories] = useState<Category[]>(standardCategories); // Default to standard
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState<string | null>(null);

    useEffect(() => {
        if (loadingAuth || !user) {
            // Reset to standard if user logs out or while loading
            setCategories(standardCategories);
            setLoadingCategories(loadingAuth); // Reflect auth loading state initially
             if (!loadingAuth && !user) setLoadingCategories(false); // Set false if definitely logged out
            return;
        }

        setLoadingCategories(true);
        setCategoryError(null);
        const userCategoriesDocRef = doc(db, 'userCategories', user.uid);

        const unsubscribe = onSnapshot(userCategoriesDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                // Document exists, load categories from it
                const data = docSnap.data();
                if (data && Array.isArray(data.categories)) {
                     // TODO: Maybe merge with standard categories in case new standards are added?
                     // For now, just use the saved ones.
                    setCategories(data.categories as Category[]);
                } else {
                     // Data format is wrong, fallback or error
                     console.warn("User category data format is incorrect, resetting to standard.");
                     setCategories(standardCategories);
                      try { // Attempt to fix it by saving standard categories
                         await setDoc(userCategoriesDocRef, { categories: standardCategories });
                     } catch (fixErr) { console.error("Failed to fix category data:", fixErr); }
                }
            } else {
                // Document doesn't exist, create it with standard categories
                 console.log("User categories not found, creating with standard categories.");
                try {
                    await setDoc(userCategoriesDocRef, { categories: standardCategories });
                    setCategories(standardCategories); // Set state after successful creation
                } catch (createErr) {
                    console.error("Error creating user categories document:", createErr);
                    setCategoryError("Could not initialize categories.");
                    // Fallback to standard categories in UI anyway
                     setCategories(standardCategories);
                }
            }
            setLoadingCategories(false);
        }, (err) => {
            console.error("Error listening to user categories:", err);
            setCategoryError("Failed to load categories.");
            setCategories(standardCategories); // Fallback
            setLoadingCategories(false);
        });

        // Cleanup listener on unmount or when user changes
        return () => unsubscribe();

    }, [user, loadingAuth]); // Rerun when user or auth loading state changes

    const getCategoryColor = (categoryId: string | undefined): string => {
         if (!categoryId) return defaultCategoryColor;
         const category = categories.find(cat => cat.id === categoryId.toLowerCase());
         return category ? category.color : defaultCategoryColor;
    };

    return (
        <CategoryContext.Provider value={{ categories, getCategoryColor, loadingCategories, categoryError }}>
            {children}
        </CategoryContext.Provider>
    );
};

// Custom hook to use the CategoryContext
export const useCategories = (): CategoryContextProps => {
    const context = useContext(CategoryContext);
    if (context === undefined) {
        throw new Error('useCategories must be used within a CategoryProvider');
    }
    return context;
}; 