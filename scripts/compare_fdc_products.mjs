// Compare FDC search output for two product queries.
// Usage:
//   node scripts/compare_fdc_products.mjs "sunflower oil" "2% milk"
//   npm run compare:fdc -- "sunflower oil" "2% milk"

import { config } from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env") });

const API_KEY = process.env.VITE_FDC_API_KEY;
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const DEFAULT_QUERIES = ["sunflower oil", "2% milk"];
const NUTRIENTS_TO_COMPARE = [
	{ id: 1008, label: "Calories" },
	{ id: 1004, label: "Total Fat" },
	{ id: 1005, label: "Total Carb." },
	{ id: 1079, label: "Dietary Fiber" },
	{ id: 2000, label: "Total Sugars" },
	{ id: 1003, label: "Protein" },
];

if (!API_KEY || API_KEY === "your_api_key_here") {
	console.error("Missing API key. Set VITE_FDC_API_KEY in your .env file.");
	process.exit(1);
}

const queries = process.argv.slice(2);
const [firstQuery, secondQuery] = queries.length >= 2 ? queries : DEFAULT_QUERIES;

function buildSearchUrl(query, pageSize = 5) {
	const url = new URL(`${BASE_URL}/foods/search`);
	url.searchParams.set("api_key", API_KEY);
	url.searchParams.set("query", query);
	url.searchParams.set("pageSize", String(pageSize));
	url.searchParams.set("dataType", "Foundation,SR Legacy,Branded");
	return url;
}

async function searchFoods(query) {
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
		foods: data.foods ?? [],
	};
}

function getNutrient(food, nutrientId) {
	return food.foodNutrients?.find(
		(nutrient) => Number(nutrient.nutrientId) === nutrientId,
	);
}

function formatNutrient(food, nutrientId) {
	const nutrient = getNutrient(food, nutrientId);
	if (!nutrient) return "—";

	const value = Number(nutrient.value);
	const formattedValue = Number.isFinite(value) ? value.toFixed(2) : nutrient.value;
	return `${formattedValue} ${nutrient.unitName ?? ""}`.trim();
}

function summarizeFood(food) {
	return {
		fdcId: food.fdcId,
		description: food.description,
		dataType: food.dataType,
		brandOwner: food.brandOwner ?? null,
		foodCategory: food.foodCategory ?? null,
		servingSize:
			food.servingSize && food.servingSizeUnit
				? `${food.servingSize} ${food.servingSizeUnit}`
				: null,
		nutrients: Object.fromEntries(
			NUTRIENTS_TO_COMPARE.map((nutrient) => [
				nutrient.label,
				formatNutrient(food, nutrient.id),
			]),
		),
	};
}

function printSummary(result) {
	const topFood = result.foods[0];

	console.log(`\n=== ${result.query} ===`);
	console.log(`Total hits: ${result.totalHits}`);

	if (!topFood) {
		console.log("No results.");
		return;
	}

	console.log("Top result:");
	console.log(JSON.stringify(summarizeFood(topFood), null, 2));

	if (result.foods.length > 1) {
		console.log("\nOther result candidates:");
		console.table(
			result.foods.slice(1).map((food, index) => ({
				rank: index + 2,
				fdcId: food.fdcId,
				description: food.description,
				dataType: food.dataType,
				brandOwner: food.brandOwner ?? "",
			})),
		);
	}
}

function printNutrientComparison(firstFood, secondFood) {
	if (!firstFood || !secondFood) return;

	console.log("\n=== Nutrient comparison for top results ===");
	console.table(
		NUTRIENTS_TO_COMPARE.map((nutrient) => ({
			nutrient: nutrient.label,
			[firstFood.description]: formatNutrient(firstFood, nutrient.id),
			[secondFood.description]: formatNutrient(secondFood, nutrient.id),
		})),
	);
}

try {
	const [firstResult, secondResult] = await Promise.all([
		searchFoods(firstQuery),
		searchFoods(secondQuery),
	]);

	printSummary(firstResult);
	printSummary(secondResult);
	printNutrientComparison(firstResult.foods[0], secondResult.foods[0]);
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
