import type { FdcFood } from "$lib/utils/types";

export const compactFood = (food: FdcFood): FdcFood => {
	return {
		fdcId: food.fdcId,
		description: food.description,
		brandOwner: food.brandOwner,
		foodCategory: food.foodCategory,
		dataType: food.dataType,
		servingSize: food.servingSize,
		servingSizeUnit: food.servingSizeUnit,
		customFood: food.customFood,
		customServingLabel: food.customServingLabel,
		customServingWeightGrams: food.customServingWeightGrams,
		customDensityGramsPerMilliliter: food.customDensityGramsPerMilliliter,
		customDensityLabel: food.customDensityLabel,
		customDensityVariancePercent: food.customDensityVariancePercent,
		customDensityConfidence: food.customDensityConfidence,
		foodNutrients: food.foodNutrients.map((nutrient) => ({
			nutrientId: nutrient.nutrientId,
			nutrientName: nutrient.nutrientName,
			nutrientNumber: nutrient.nutrientNumber,
			unitName: nutrient.unitName,
			value: nutrient.value,
		})),
	};
};
