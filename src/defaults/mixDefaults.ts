export const MIX_STORAGE_KEYS = {
	fridge: "smoothie-fridge",
	shoppingList: "smoothie-shopping-list",
	nutrientGoals: "smoothie-nutrient-goals",
	mixState: "smoothie-mix-state",
} as const;

export const DEFAULT_NUTRIENT_GOALS: Record<number, number> = {
	1008: 350,
	1004: 15,
	1005: 60,
	1079: 10,
	2000: 25,
	1003: 25,
	1162: 90,
	1087: 300,
	1089: 5,
	1092: 900,
	1106: 300,
	1110: 400,
	1185: 45,
	1253: 50,
	1258: 500,
};

export const DEFAULT_GOAL_BY_UNIT = {
	grams: 20,
	calories: 350,
	fallback: 100,
} as const;

export const DEFAULT_SERVING_GRAMS = 100;

export const NUTRIENT_PROGRESS_THRESHOLDS = {
	atGoal: 1,
	barelyOver: 1.1,
	midwayOver: 1.35,
} as const;

export const NUTRIENT_PROGRESS_COLORS = {
	atGoal: {
		fill: "rgba(76, 175, 80, 0.34)",
		stroke: "rgba(76, 175, 80, 0.95)",
	},
	barelyOver: {
		fill: "rgba(250, 204, 21, 0.38)",
		stroke: "rgba(202, 138, 4, 0.95)",
	},
	midwayOver: {
		fill: "rgba(251, 146, 60, 0.38)",
		stroke: "rgba(234, 88, 12, 0.95)",
	},
	wayOver: {
		fill: "rgba(248, 113, 113, 0.38)",
		stroke: "rgba(220, 38, 38, 0.95)",
	},
} as const;
