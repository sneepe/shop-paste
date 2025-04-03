// src/config/standardCategories.ts
// Define the interface directly here for now, or move to a types file later
export interface Category {
    id: string; // lowercase name, e.g., 'dairy'
    name: string; // Display name, e.g., 'Dairy'
    color: string; // Hex color code, e.g., '#ADD8E6'
}

export const standardCategories: Category[] = [
    { id: 'produce', name: 'Produce', color: '#90EE90' }, // LightGreen
    { id: 'dairy', name: 'Dairy', color: '#ADD8E6' },     // LightBlue
    { id: 'meat', name: 'Meat', color: '#FFB6C1' },      // LightPink
    { id: 'pantry', name: 'Pantry', color: '#F5DEB3' },   // Wheat
    { id: 'frozen', name: 'Frozen', color: '#B0E0E6' },   // PowderBlue
    { id: 'beverages', name: 'Beverages', color: '#77B5FE' }, // Medium Blue
    { id: 'bakery', name: 'Bakery', color: '#FFDAB9' },   // PeachPuff
    { id: 'household', name: 'Household', color: '#D8BFD8' }, // Thistle
    { id: 'other', name: 'Other', color: '#D3D3D3' },     // LightGray
];

// Helper to get a default color if needed
export const defaultCategoryColor = '#D3D3D3'; 