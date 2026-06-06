// Audit whether FDC search results provide the app's vital nutrients.
// Usage:
//   node scripts/audit_fdc_vitals.mjs
//   node scripts/audit_fdc_vitals.mjs "olive oil" "2% milk" "banana"
//   npm run audit:fdc-vitals -- "olive oil" "sunflower oil"

import { config } from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.VITE_FDC_API_KEY;
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

const DEFAULT_QUERIES = [
	"olive oil",
	"sunflower oil",
	"canola oil",
	"avocado oil",
	"2% milk",
	"whole milk",
	"greek yogurt",
	"banana",
	"kale",
	"spinach",
	"blueberries",
	"peanut butter",
	"whey protein",
	"tofu",
	"chia seeds",
	"almonds",
	"flaxseed",
];

const VITALS = [
	{ id: 1008, label: "Calories", unit: "kcal" },
	{ id: 1004, label: "Total Fat", unit: "g" },
	{ id: 1005, label: "Total Carb.", unit: "g" },
	{ id: 1079, label: "Dietary Fiber", unit: "g" },
	{ id: 2000, label: "Total Sugars", unit: "g" },
	{ id: 1003, label: "Protein", unit: "g" },
];

const FALLBACK_NUTRIENT_IDS = {
	1004: [1085],
};

const FALLBACK_NUTRIENT_NUMBERS = {
	1008: ["208"],
	1003: ["203"],
	1004: ["204", "298"],
	1005: ["205"],
	1079: ["291"],
	2000: ["269"],
};

if (!API_KEY || API_KEY === "your_api_key_here") {
	console.error("Missing API key. Set VITE_FDC_API_KEY in your .env file.");
	process.exit(1);
}

const queries = process.argv.slice(2);
const auditQueries = queries.length > 0 ? queries : DEFAULT_QUERIES;

const buildSearchUrl = (query) => {
	const url = new URL(`${BASE_URL}/foods/search`);
	url.searchParams.set("api_key", API_KEY);
	url.searchParams.set("query", query);
	url.searchParams.set("pageSize", "1");
	url.searchParams.set("dataType", "Foundation,SR Legacy,Branded");
	return url;
};

const searchTopFood = async (query) => {
	const response = await fetch(buildSearchUrl(query));

	if (!response.ok) {
		throw new Error(
			`FDC search failed for "${query}": ${response.status} ${response.statusText}`,
		);
	}

	const data = await response.json();
	return {
		query,
		totalHits: data.totalHits ?? 0,
		food: data.foods?.[0] ?? null,
	};
};

const findExact = (food, nutrientId) => {
	return food.foodNutrients?.find(
		(nutrient) => Number(nutrient.nutrientId) === nutrientId,
	);
};

const findFallback = (food, nutrientId) => {
	const fallbackIds = FALLBACK_NUTRIENT_IDS[nutrientId] ?? [];
	const fallbackNumbers = FALLBACK_NUTRIENT_NUMBERS[nutrientId] ?? [];

	return food.foodNutrients?.find((nutrient) => {
		if (fallbackIds.includes(Number(nutrient.nutrientId))) return true;
		return fallbackNumbers.includes(String(nutrient.nutrientNumber));
	});
};

const findResolved = (food, nutrientId) => {
	const exact = findExact(food, nutrientId);
	if (exact) return { nutrient: exact, source: "exact" };

	const fallback = findFallback(food, nutrientId);
	if (fallback) return { nutrient: fallback, source: "fallback" };

	if (nutrientId === 1008) {
		const calories = deriveCalories(food);
		if (calories > 0) {
			return {
				nutrient: {
					nutrientId,
					nutrientName: "Calories derived from macros",
					unitName: "KCAL",
					value: calories,
				},
				source: "derived",
			};
		}
	}

	return { nutrient: null, source: "missing" };
};

const deriveCalories = (food) => {
	const fat = findResolvedWithoutDerivation(food, 1004)?.value ?? 0;
	const carbs = findResolvedWithoutDerivation(food, 1005)?.value ?? 0;
	const protein = findResolvedWithoutDerivation(food, 1003)?.value ?? 0;
	return fat * 9 + carbs * 4 + protein * 4;
};

const findResolvedWithoutDerivation = (food, nutrientId) => {
	return findExact(food, nutrientId) ?? findFallback(food, nutrientId) ?? null;
};

const formatValue = (nutrient, fallbackUnit) => {
	if (!nutrient) return "—";

	const value = Number(nutrient.value);
	const formattedValue = Number.isFinite(value) ? value.toFixed(2) : "—";
	return `${formattedValue} ${nutrient.unitName ?? fallbackUnit}`.trim();
};

const sourceMarker = (source) => {
	if (source === "exact") return "exact";
	if (source === "fallback") return "fallback";
	if (source === "derived") return "derived";
	return "MISSING";
};

const auditFood = (result) => {
	if (!result.food) {
		return {
			query: result.query,
			fdcId: "—",
			description: "No result",
			dataType: "—",
			missingCount: VITALS.length,
			vitals: Object.fromEntries(VITALS.map((vital) => [vital.label, "MISSING"])),
		};
	}

	const vitals = Object.fromEntries(
		VITALS.map((vital) => {
			const { nutrient, source } = findResolved(result.food, vital.id);
			return [
				vital.label,
				`${sourceMarker(source)}: ${formatValue(nutrient, vital.unit)}`,
			];
		}),
	);

	const missingCount = Object.values(vitals).filter((value) =>
		value.startsWith("MISSING"),
	).length;

	return {
		query: result.query,
		fdcId: result.food.fdcId,
		description: result.food.description,
		dataType: result.food.dataType,
		missingCount,
		vitals,
	};
};

const printAudit = (audits) => {
	console.table(
		audits.map((audit) => ({
			query: audit.query,
			fdcId: audit.fdcId,
			description: audit.description,
			dataType: audit.dataType,
			missing: audit.missingCount,
		})),
	);

	for (const audit of audits) {
		console.log(`\n=== ${audit.query} → ${audit.description} ===`);
		console.table(audit.vitals);
	}

	const needsAttention = audits.filter((audit) => audit.missingCount > 0);
	if (needsAttention.length > 0) {
		console.log("\nProducts with missing vitals:");
		console.table(
			needsAttention.map((audit) => ({
				query: audit.query,
				description: audit.description,
				missing: audit.missingCount,
			})),
		);
	}
};

try {
	const results = await Promise.all(auditQueries.map(searchTopFood));
	const audits = results.map(auditFood);
	printAudit(audits);
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
