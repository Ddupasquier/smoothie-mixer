// Vital nutrients used throughout the app
// Update this array to add/remove vital nutrients globally
import { NUTRIENT_IDS } from '../lib/types';

export const vitalNutrients = [
    {
        id: NUTRIENT_IDS.CALORIES,
        label: 'Calories',
        unit: 'kcal',
        highlight: true,
    },
    { id: NUTRIENT_IDS.FAT, label: 'Total Fat', unit: 'g' },
    { id: NUTRIENT_IDS.CARBS, label: 'Total Carb.', unit: 'g' },
    { id: NUTRIENT_IDS.FIBER, label: 'Dietary Fiber', unit: 'g' },
    { id: NUTRIENT_IDS.SUGAR, label: 'Total Sugars', unit: 'g' },
    { id: NUTRIENT_IDS.PROTEIN, label: 'Protein', unit: 'g' },
];
