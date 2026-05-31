import type { FdcFood } from "$lib/utils/types";
import type { NutritionTotals } from "$lib/utils/types";

export function foodToNutritionTotals(food: FdcFood): NutritionTotals {
    // Map FdcFood.foodNutrients to NutritionTotals shape
    function get(nutrientId: number): number {
        const n = food.foodNutrients.find((n) => n.nutrientId === nutrientId);
        return n ? n.value : 0;
    }
    return {
        calories: get(1008),
        protein: get(1003),
        carbs: get(1005),
        fat: get(1004),
        fiber: get(1079),
        sugar: get(2000),
    };
}
