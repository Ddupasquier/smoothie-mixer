import {
	DEFAULT_GRAMS_PER_MEASURE,
	SERVING_MEASURE_ALIASES,
	type ServingMeasureUnit,
} from "../../defaults/servingMeasureDefaults";

export type ParsedServingAmount = {
	grams: number;
	quantity: number;
	unit: ServingMeasureUnit;
};

function parseQuantity(value: string) {
	const normalized = value.trim();
	const mixedNumberMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
	if (mixedNumberMatch) {
		const whole = Number(mixedNumberMatch[1]);
		const numerator = Number(mixedNumberMatch[2]);
		const denominator = Number(mixedNumberMatch[3]);
		return denominator === 0 ? null : whole + numerator / denominator;
	}

	const fractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
	if (fractionMatch) {
		const numerator = Number(fractionMatch[1]);
		const denominator = Number(fractionMatch[2]);
		return denominator === 0 ? null : numerator / denominator;
	}

	const numericValue = Number(normalized);
	return Number.isFinite(numericValue) ? numericValue : null;
}

export function convertServingToGrams(
	quantity: number,
	unit: ServingMeasureUnit,
) {
	const safeQuantity = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
	return safeQuantity * DEFAULT_GRAMS_PER_MEASURE[unit];
}

export function parseServingAmount(input: string): ParsedServingAmount | null {
	const normalized = input.trim().toLowerCase();
	if (!normalized) return null;

	const match = normalized.match(
		/^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*([a-z]+)?(?:\b|$)/,
	);
	if (!match) return null;

	const quantity = parseQuantity(match[1]);
	if (quantity === null || quantity < 0) return null;

	const unit = SERVING_MEASURE_ALIASES[match[2] ?? "g"];
	if (!unit) return null;

	return {
		grams: convertServingToGrams(quantity, unit),
		quantity,
		unit,
	};
}
