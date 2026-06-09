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

export const GOAL_TEMPLATES = [
	{
		id: "balanced",
		label: "Balanced",
		description: "Moderate calories, protein, carbs, fiber, and sugar.",
		goals: {
			1008: 350,
			1004: 15,
			1005: 60,
			1079: 10,
			2000: 25,
			1003: 25,
		},
	},
	{
		id: "high-protein",
		label: "High Protein",
		description: "Prioritizes protein while keeping sugar moderate.",
		goals: {
			1008: 450,
			1004: 18,
			1005: 50,
			1079: 8,
			2000: 20,
			1003: 45,
		},
	},
	{
		id: "low-sugar",
		label: "Low Sugar",
		description: "Keeps sugar low while preserving fiber and protein.",
		goals: {
			1008: 300,
			1004: 12,
			1005: 35,
			1079: 12,
			2000: 10,
			1003: 25,
		},
	},
	{
		id: "calorie-dense",
		label: "Calorie Dense",
		description: "Higher energy target for a more filling drink.",
		goals: {
			1008: 650,
			1004: 30,
			1005: 85,
			1079: 10,
			2000: 35,
			1003: 35,
		},
	},
	{
		id: "fiber-focused",
		label: "Fiber Focused",
		description: "Raises fiber and keeps sugar controlled.",
		goals: {
			1008: 375,
			1004: 12,
			1005: 60,
			1079: 18,
			2000: 18,
			1003: 25,
		},
	},
] as const;

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

export const NUTRIENT_POINT_COLORS = {
	belowGoal: {
		fill: "rgba(250, 204, 21, 0.34)",
		stroke: "rgba(202, 138, 4, 0.95)",
	},
	nearGoal: {
		fill: "rgba(76, 175, 80, 0.34)",
		stroke: "rgba(76, 175, 80, 0.95)",
	},
	overGoal: {
		fill: "rgba(248, 113, 113, 0.38)",
		stroke: "rgba(220, 38, 38, 0.95)",
	},
} as const;

export const NUTRIENT_POINT_GOAL_TOLERANCE = 0.1;
