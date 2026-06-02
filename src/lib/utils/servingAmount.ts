import {
	DEFAULT_GRAMS_PER_WEIGHT_MEASURE,
	DEFAULT_MILLILITERS_PER_VOLUME_MEASURE,
	SERVING_MEASURE_ALIASES,
	type ServingMeasureDimension,
	type ServingMeasureUnit,
} from "../../defaults/servingMeasureDefaults";
import type { FdcFood } from "./types";

export type ParsedServingAmount = {
	grams: number;
	quantity: number;
	unit: ServingMeasureUnit;
};

export type DensityEstimate = {
	gramsPerMilliliter: number;
	label: string;
	variancePercent: number;
	confidence: "known" | "estimated" | "rough";
};

export type ServingConversion = {
	grams: number;
	milliliters: number | null;
	dimension: ServingMeasureDimension;
	density: DensityEstimate | null;
	isEstimate: boolean;
	range: { minGrams: number; maxGrams: number } | null;
	warning: string | null;
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
	food?: FdcFood,
) {
	return convertServingAmount(quantity, unit, food).grams;
}

export function convertServingAmount(
	quantity: number,
	unit: ServingMeasureUnit,
	food?: FdcFood,
): ServingConversion {
	const safeQuantity = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
	const dimension = getServingMeasureDimension(unit);

	if (dimension === "weight") {
		return {
			grams:
				safeQuantity *
				(DEFAULT_GRAMS_PER_WEIGHT_MEASURE[unit] ?? 1),
			milliliters: null,
			dimension,
			density: null,
			isEstimate: false,
			range: null,
			warning: null,
		};
	}

	const milliliters =
		safeQuantity * (DEFAULT_MILLILITERS_PER_VOLUME_MEASURE[unit] ?? 0);
	const density = getDensityEstimate(food);
	const grams = milliliters * density.gramsPerMilliliter;
	const variance = density.variancePercent / 100;
	const range = {
		minGrams: grams * Math.max(0, 1 - variance),
		maxGrams: grams * (1 + variance),
	};

	return {
		grams,
		milliliters,
		dimension,
		density,
		isEstimate: true,
		range,
		warning: getVolumeWarning(density, range),
	};
}

export function getServingMeasureDimension(
	unit: ServingMeasureUnit,
): ServingMeasureDimension {
	return unit in DEFAULT_GRAMS_PER_WEIGHT_MEASURE ? "weight" : "volume";
}

export function getDensityEstimate(food?: FdcFood): DensityEstimate {
	const text = `${food?.description ?? ""} ${food?.foodCategory ?? ""}`.toLowerCase();

	if (/\boil\b|olive oil|sunflower oil|canola oil|avocado oil/.test(text)) {
		return {
			gramsPerMilliliter: 0.91,
			label: "cooking oil",
			variancePercent: 3,
			confidence: "known",
		};
	}

	if (/\bmilk\b|dairy beverage/.test(text)) {
		return {
			gramsPerMilliliter: 1.03,
			label: "milk",
			variancePercent: 3,
			confidence: "known",
		};
	}

	if (/water|juice|beverage|drink|tea|coffee/.test(text)) {
		return {
			gramsPerMilliliter: 1,
			label: "water-like liquid",
			variancePercent: 5,
			confidence: "estimated",
		};
	}

	if (/yogurt|yoghurt/.test(text)) {
		return {
			gramsPerMilliliter: 1.05,
			label: "yogurt",
			variancePercent: 10,
			confidence: "estimated",
		};
	}

	if (/honey|syrup|molasses/.test(text)) {
		return {
			gramsPerMilliliter: 1.38,
			label: "syrup or honey",
			variancePercent: 10,
			confidence: "estimated",
		};
	}

	if (/peanut butter|almond butter|nut butter/.test(text)) {
		return {
			gramsPerMilliliter: 1.08,
			label: "nut butter",
			variancePercent: 15,
			confidence: "estimated",
		};
	}

	if (/protein|powder|flour/.test(text)) {
		return {
			gramsPerMilliliter: 0.5,
			label: "powder",
			variancePercent: 40,
			confidence: "rough",
		};
	}

	if (/kale|spinach|lettuce|leafy|greens/.test(text)) {
		return {
			gramsPerMilliliter: 0.22,
			label: "leafy greens",
			variancePercent: 50,
			confidence: "rough",
		};
	}

	if (/blueberr|strawberr|raspberr|blackberr|berries/.test(text)) {
		return {
			gramsPerMilliliter: 0.62,
			label: "berries",
			variancePercent: 20,
			confidence: "estimated",
		};
	}

	if (/banana/.test(text)) {
		return {
			gramsPerMilliliter: 0.65,
			label: "sliced banana",
			variancePercent: 25,
			confidence: "rough",
		};
	}

	return {
		gramsPerMilliliter: 1,
		label: "generic volume fallback",
		variancePercent: 50,
		confidence: "rough",
	};
}

function getVolumeWarning(
	density: DensityEstimate,
	range: { minGrams: number; maxGrams: number },
) {
	const rangeText = `${range.minGrams.toFixed(1)}–${range.maxGrams.toFixed(1)}g`;
	const prefix =
		density.confidence === "known"
			? "Volume conversion uses a typical"
			: density.confidence === "estimated"
				? "Volume conversion is estimated from a typical"
				: "Volume conversion is a rough estimate using a";

	return `${prefix} ${density.label} density. Actual weight may vary about ±${density.variancePercent}% (${rangeText}). Use grams for the most accurate result.`;
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
