<script lang="ts">
	import type { FdcFood } from "$lib/utils/types";
	import { searchFoods } from "$lib/utils/fdc";
	import {
		CUSTOM_FOODS_CHANGED_EVENT,
		searchCustomFoods,
	} from "$lib/utils/customFoods";
	import { compareFoodQuality } from "$lib/utils/foodQuality";
	import { createEventDispatcher, onMount } from "svelte";
	import PillRow from "./PillRow.svelte";
	import SearchDropdown from "./SearchDropdown.svelte";

	let { onSelect }: { onSelect: (food: FdcFood) => void } = $props();
	let query = $state("");
	let pills = $state<string[]>([]);
	let results = $state<FdcFood[]>([]);
	let loading = $state(false);
	let error = $state("");
	let debounceTimer: ReturnType<typeof setTimeout>;
	const dispatch = createEventDispatcher();

	const mergeResults = (customResults: FdcFood[], apiResults: FdcFood[]) => {
		const seen = new Set<number>();
		return [...customResults, ...apiResults].filter((food) => {
			if (seen.has(food.fdcId)) return false;
			seen.add(food.fdcId);
			return true;
		});
	};

	const sortByQualityThenName = (items: FdcFood[]) => {
		return items.sort((a, b) => {
			const qualitySort = compareFoodQuality(a, b);
			if (qualitySort !== 0) return qualitySort;
			return a.description.localeCompare(b.description);
		});
	};

	const sortedResults = $derived(() => {
		const allTerms = [...pills, query.trim()]
			.map((s) => s.toLowerCase())
			.filter(Boolean);
		if (allTerms.length === 0)
			return sortByQualityThenName([...results]);
		if (allTerms.length === 1) {
			const startsWith: FdcFood[] = [];
			const contains: FdcFood[] = [];
			const rest: FdcFood[] = [];
			for (const food of results) {
				const desc = food.description.toLowerCase();
				if (desc.startsWith(allTerms[0])) {
					startsWith.push(food);
				} else if (desc.includes(allTerms[0])) {
					contains.push(food);
				} else {
					rest.push(food);
				}
			}
			sortByQualityThenName(startsWith);
			sortByQualityThenName(contains);
			sortByQualityThenName(rest);
			return [...startsWith, ...contains, ...rest];
		}
		const allParts: FdcFood[] = [];
		const firstPart: FdcFood[] = [];
		const rest: FdcFood[] = [];
		for (const food of results) {
			const desc = food.description.toLowerCase();
			const containsAll = allTerms.every((p) => desc.includes(p));
			if (containsAll) {
				if (desc.startsWith(allTerms[0])) {
					firstPart.push(food);
				} else {
					allParts.push(food);
				}
			} else {
				rest.push(food);
			}
		}
		sortByQualityThenName(firstPart);
		sortByQualityThenName(allParts);
		sortByQualityThenName(rest);
		return [...firstPart, ...allParts, ...rest];
	});

	const triggerSearch = () => {
		clearTimeout(debounceTimer);
		error = "";
		const allTerms = [...pills, query.trim()].filter(Boolean);
		const searchString = allTerms.join(" ");
		if (!searchString) {
			results = [];
			return;
		}
		debounceTimer = setTimeout(async () => {
			loading = true;
			const customResults = searchCustomFoods(searchString);
			try {
				results = mergeResults(customResults, await searchFoods(searchString));
				dispatch("results", { results, query: searchString });
			} catch (e) {
				error =
					e instanceof Error
						? e.message
						: "Search failed. Check your API key in .env.";
				results = customResults;
				dispatch("results", { results, query: searchString });
			} finally {
				loading = false;
			}
		}, 500);
	};

	const handleInput = () => {
		triggerSearch();
	};

	$effect(() => {
		pills;
		triggerSearch();
	});

	const select = (food: FdcFood) => {
		onSelect(food);
		query = "";
		results = [];
	};

	onMount(() => {
		const refreshCustomResults = () => {
			const searchString = [...pills, query.trim()].filter(Boolean).join(" ");
			if (!searchString) return;
			results = mergeResults(searchCustomFoods(searchString), results);
		};

		window.addEventListener(CUSTOM_FOODS_CHANGED_EVENT, refreshCustomResults);
		window.addEventListener("storage", refreshCustomResults);
		return () => {
			window.removeEventListener(
				CUSTOM_FOODS_CHANGED_EVENT,
				refreshCustomResults,
			);
			window.removeEventListener("storage", refreshCustomResults);
		};
	});
</script>

<div class="search-wrap">
	<label class="search-label" for="ingredient-search"
		>Search ingredients</label
	>
	<div class="search-row">
		<input
			id="ingredient-search"
			type="search"
			class="search-input"
			placeholder="Type and press Enter or Space to add…"
			bind:value={query}
			oninput={handleInput}
			onkeydown={(e) => {
				if ((e.key === "Enter" || e.key === " ") && query.trim()) {
					pills = [...pills, query.trim()];
					query = "";
					e.preventDefault();
				}
			}}
		/>
		{#if loading}
			<span class="spinner" aria-label="Searching…">⏳</span>
		{/if}
	</div>
	<PillRow
		{pills}
		onRemove={(idx) => (pills = pills.filter((_, i) => i !== idx))}
	/>
	{#if error}
		<p class="search-error" role="alert">{error}</p>
	{/if}
	<SearchDropdown results={sortedResults()} onSelect={select} />
</div>

<style>
	.search-wrap {
		position: relative;
	}
	.search-label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.4rem;
		font-size: 0.95rem;
		color: var(--color-text);
	}
	.search-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.search-input {
		flex: 1;
		padding: 0.65rem 0.9rem;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		outline: none;
		transition: border-color 0.15s;
		background: var(--color-surface);
	}
	.search-input:focus {
		border-color: var(--color-primary);
	}
	.spinner {
		font-size: 1.1rem;
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.search-error {
		margin-top: 0.4rem;
		font-size: 0.85rem;
		color: var(--color-danger);
	}
</style>
