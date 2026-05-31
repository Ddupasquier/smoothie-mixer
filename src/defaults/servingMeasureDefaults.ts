export type ServingMeasureUnit = "g" | "oz";

export const SERVING_MEASURE_OPTIONS: {
	value: ServingMeasureUnit;
	label: string;
}[] = [
	{ value: "g", label: "grams" },
	{ value: "oz", label: "ounces" },
];

export const SERVING_MEASURE_ALIASES: Record<string, ServingMeasureUnit> = {
	g: "g",
	gram: "g",
	grams: "g",
	oz: "oz",
	ounce: "oz",
	ounces: "oz",
};

export const DEFAULT_GRAMS_PER_MEASURE: Record<ServingMeasureUnit, number> = {
	g: 1,
	oz: 28.35,
};
