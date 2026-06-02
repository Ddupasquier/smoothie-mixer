export type ServingMeasureUnit =
	| "mg"
	| "g"
	| "kg"
	| "oz"
	| "lb"
	| "ml"
	| "tsp"
	| "tbsp"
	| "cup"
	| "floz";

export type ServingMeasureDimension = "weight" | "volume";

export const SERVING_MEASURE_OPTIONS: {
	value: ServingMeasureUnit;
	label: string;
	dimension: ServingMeasureDimension;
}[] = [
	{ value: "g", label: "grams (g)", dimension: "weight" },
	{ value: "mg", label: "milligrams (mg)", dimension: "weight" },
	{ value: "oz", label: "ounces (oz)", dimension: "weight" },
	{ value: "kg", label: "kilograms (kg)", dimension: "weight" },
	{ value: "lb", label: "pounds (lb)", dimension: "weight" },
	{ value: "ml", label: "milliliters (ml)", dimension: "volume" },
	{ value: "tsp", label: "teaspoons (tsp)", dimension: "volume" },
	{ value: "tbsp", label: "tablespoons (tbsp)", dimension: "volume" },
	{ value: "cup", label: "cups", dimension: "volume" },
	{ value: "floz", label: "fluid ounces (fl oz)", dimension: "volume" },
];

export const SERVING_MEASURE_ALIASES: Record<string, ServingMeasureUnit> = {
	mg: "mg",
	milligram: "mg",
	milligrams: "mg",
	g: "g",
	gram: "g",
	grams: "g",
	kg: "kg",
	kilogram: "kg",
	kilograms: "kg",
	oz: "oz",
	ounce: "oz",
	ounces: "oz",
	lb: "lb",
	lbs: "lb",
	pound: "lb",
	pounds: "lb",
	ml: "ml",
	mlt: "ml",
	milliliter: "ml",
	milliliters: "ml",
	millilitre: "ml",
	millilitres: "ml",
	tsp: "tsp",
	teaspoon: "tsp",
	teaspoons: "tsp",
	tbsp: "tbsp",
	tablespoon: "tbsp",
	tablespoons: "tbsp",
	c: "cup",
	cup: "cup",
	cups: "cup",
	floz: "floz",
	flounce: "floz",
	flounces: "floz",
	fluidounce: "floz",
	fluidounces: "floz",
};

export const DEFAULT_GRAMS_PER_WEIGHT_MEASURE = {
	mg: 0.001,
	g: 1,
	kg: 1000,
	oz: 28.35,
	lb: 453.592,
} as const satisfies Partial<Record<ServingMeasureUnit, number>>;

export const DEFAULT_MILLILITERS_PER_VOLUME_MEASURE = {
	ml: 1,
	tsp: 4.92892,
	tbsp: 14.7868,
	cup: 240,
	floz: 29.5735,
} as const satisfies Partial<Record<ServingMeasureUnit, number>>;
