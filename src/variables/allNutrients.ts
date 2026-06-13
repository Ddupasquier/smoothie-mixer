import { NUTRIENT_IDS } from "$lib/utils/food/types";
import { DISCOVERED_FDC_NUTRIENTS } from "./fdcNutrients.generated";

const NUTRIENT_LABEL_OVERRIDES: Record<number, string> = {
    [NUTRIENT_IDS.CALORIES]: "Calories",
    [NUTRIENT_IDS.PROTEIN]: "Protein",
    [NUTRIENT_IDS.FAT]: "Total Fat",
    [NUTRIENT_IDS.CARBS]: "Total Carbohydrates",
    [NUTRIENT_IDS.FIBER]: "Dietary Fiber",
    [NUTRIENT_IDS.SUGAR]: "Total Sugars",
    [NUTRIENT_IDS.VITAMIN_C]: "Vitamin C",
    [NUTRIENT_IDS.CALCIUM]: "Calcium",
    [NUTRIENT_IDS.IRON]: "Iron",
    [NUTRIENT_IDS.POTASSIUM]: "Potassium",
    [NUTRIENT_IDS.SODIUM]: "Sodium",
    [NUTRIENT_IDS.VITAMIN_A_RAE]: "Vitamin A (RAE)",
    [NUTRIENT_IDS.VITAMIN_D_IU]: "Vitamin D",
    [NUTRIENT_IDS.VITAMIN_K1]: "Vitamin K1",
    [NUTRIENT_IDS.CHOLESTEROL]: "Cholesterol",
    1258: "Saturated Fat",
    1292: "Monounsaturated Fat",
    1293: "Polyunsaturated Fat",
    1090: "Magnesium",
    1091: "Phosphorus",
    1095: "Zinc",
    1098: "Copper",
    1165: "Vitamin B1 (Thiamin)",
    1166: "Vitamin B2 (Riboflavin)",
    1167: "Vitamin B3 (Niacin)",
    1175: "Vitamin B6",
    1177: "Folate",
    1178: "Vitamin B12",
    1235: "Added Sugars",
};

const NUTRIENT_UNIT_OVERRIDES: Record<string, string> = {
    MG_ATE: "mg α-TE",
    SP_GR: "specific gravity",
};

export const ALL_NUTRIENTS = DISCOVERED_FDC_NUTRIENTS.map((nutrient) => ({
    id: nutrient.id,
    label: NUTRIENT_LABEL_OVERRIDES[nutrient.id] ?? nutrient.label,
    unit: NUTRIENT_UNIT_OVERRIDES[nutrient.unit] ?? nutrient.unit,
}));

export const POPULAR_NUTRIENT_IDS = [
    NUTRIENT_IDS.SODIUM,
    NUTRIENT_IDS.POTASSIUM,
    NUTRIENT_IDS.CALCIUM,
    NUTRIENT_IDS.IRON,
    1090,
    NUTRIENT_IDS.CHOLESTEROL,
    1258,
    1292,
    1293,
    NUTRIENT_IDS.VITAMIN_C,
    NUTRIENT_IDS.VITAMIN_A_RAE,
    NUTRIENT_IDS.VITAMIN_D_IU,
    NUTRIENT_IDS.VITAMIN_K1,
    1175,
    1177,
    1178,
    1235,
] as const;
