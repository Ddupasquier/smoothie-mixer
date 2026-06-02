import type { FdcFood } from "$lib/utils/types";
import type { NutritionTotals } from "$lib/utils/types";
import { getFdcNutrientValue } from "$lib/utils/fdcNutrients";

/**
 * Convert an FdcFood into NutritionTotals, scaling nutrients by the given servingGrams.
 * FDC values are per 100g, so scale accordingly.
 */
export function foodToNutritionTotals(food: FdcFood, servingGrams: number = 100): NutritionTotals {
    function get(nutrientId: number): number {
        const value = getFdcNutrientValue(food, nutrientId);
        return (value * servingGrams) / 100;
    }
    const result = {
        calories: get(1008),
        protein: get(1003),
        carbs: get(1005),
        fat: get(1004),
        fiber: get(1079),
        sugar: get(2000),
    };
    return result;
}
