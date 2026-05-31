<script lang="ts">
	import type { FdcFood, NutritionTotals } from "$lib/utils/types";
	import { NUTRIENT_IDS } from "$lib/utils/types";
	import { onMount } from "svelte";

	interface Props {
		food?: FdcFood;
		totals: NutritionTotals;
	}

	let { totals, food }: Props = $props();

	const vitalNutrients = [
		{
			id: NUTRIENT_IDS.CALORIES,
			label: "Calories",
			unit: "kcal",
			highlight: true,
		},
		{ id: NUTRIENT_IDS.FAT, label: "Total Fat", unit: "g" },
		{ id: NUTRIENT_IDS.CARBS, label: "Total Carb.", unit: "g" },
		{ id: NUTRIENT_IDS.FIBER, label: "Dietary Fiber", unit: "g" },
		{ id: NUTRIENT_IDS.SUGAR, label: "Total Sugars", unit: "g" },
		{ id: NUTRIENT_IDS.PROTEIN, label: "Protein", unit: "g" },
	];

	const vitalRows = $derived(
		food
			? vitalNutrients.map((vn) => {
					const n = food.foodNutrients.find(
						(f) => f.nutrientId === vn.id,
					);
					return {
						label: vn.label,
						value: n ? n.value.toFixed(1) : "0",
						unit: vn.unit,
						highlight: vn.highlight || false,
					};
				})
			: [],
	);

	const vitalIds = vitalNutrients.map((vn) => Number(vn.id));
	const extraRows = $derived(
		food
			? food.foodNutrients
					.filter(
						(n) =>
							!vitalIds.includes(Number(n.nutrientId)) &&
							n.value !== 0,
					)
					.map((n) => ({
						label: n.nutrientName,
						value:
							n.value % 1 === 0
								? Math.round(n.value)
								: n.value.toFixed(2),
						unit: n.unitName,
					}))
			: [],
	);

	// Height sync logic
	let vitalListRef: HTMLUListElement | null = null;
	let rightColHeight = $state(0);

	function syncHeight() {
		if (vitalListRef) {
			rightColHeight = vitalListRef.offsetHeight;
		}
	}

	$effect(() => {
		syncHeight();
	});

	onMount(() => {
		syncHeight();
		window.addEventListener("resize", syncHeight);
		return () => window.removeEventListener("resize", syncHeight);
	});
</script>

<section class="nf-label">
	<div class="nf-title">Nutrition Facts</div>
	{#if food?.description}
		<div class="nf-food">{food.description}</div>
	{/if}
	<div class="nf-thick-divider"></div>
	<div class="nf-columns">
		<ul class="nf-list vital-list" bind:this={vitalListRef}>
			{#each vitalRows as row, i}
				<li class="nf-row {row.highlight ? 'nf-highlight' : ''}">
					<span
						class="nf-label-text {i === 0
							? 'nf-calories-label'
							: ''}">{row.label}</span
					>
					<span class="nf-value {i === 0 ? 'nf-calories-value' : ''}"
						>{row.value}
						<span class="nf-unit">{row.unit}</span></span
					>
				</li>
				{#if i === 0}
					<div class="nf-thick-divider"></div>
				{/if}
				{#if i === vitalRows.length - 2}
					<div class="nf-divider"></div>
				{/if}
			{/each}
		</ul>
		<div class="nf-scroll-wrap" style="max-height: {rightColHeight}px;">
			<ul class="nf-list extra-list">
				{#each extraRows as row}
					<li class="nf-row nf-extra">
						<span class="nf-label-text">{row.label}</span>
						<span class="nf-value"
							>{row.value}
							<span class="nf-unit">{row.unit}</span></span
						>
					</li>
				{/each}
			</ul>
		</div>
	</div>
	<div class="nf-note">
		Values are based on the serving sizes you entered (per 100 g raw food
		data).
	</div>
</section>

<style>
	.nf-label {
		background: #fff;
		border: 3.5px solid #111;
		border-radius: 0;
		margin: 0 auto;
		font-family: "Arial Narrow", Arial, sans-serif;
		color: #111;
		box-shadow: none;
		padding: 0.7rem 1.1rem 1.1rem 1.1rem;
	}
	.nf-title {
		font-size: 2.1rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.01em;
		border-bottom: 8px solid #111;
		padding-bottom: 0.18rem;
		margin-bottom: 0.1rem;
		line-height: 1.1;
	}
	.nf-food {
		font-size: 1.01rem;
		font-weight: 600;
		margin-bottom: 0.2rem;
		color: #222;
	}
	.nf-thick-divider {
		border-bottom: 4px solid #111;
		margin: 0.2rem 0 0.3rem 0;
	}
	.nf-divider {
		border-bottom: 2px solid #111;
		margin: 0.1rem 0 0.1rem 0;
	}
	.nf-columns {
		display: flex;
		flex-direction: row;
		gap: 1.1rem;
		align-items: stretch;
		margin-bottom: 0.2rem;
		min-height: 120px;
	}
	.vital-list {
		flex: 0 0 220px;
		margin: 0;
		padding: 0;
		/* border-right: 3px solid #111; */
		padding-right: 1.1rem;
		min-width: 180px;
		max-width: 220px;
	}
	.nf-scroll-wrap {
		flex: 1 1 0;
		min-width: 0;
		/* max-width: 220px; */
		padding-left: 1.1rem;
		overflow-y: auto;
		max-height: 100%;
		border-left: 3px solid #111;
		display: flex;
		align-items: stretch;
	}
	.nf-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.nf-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 0.13rem 0.1rem 0.13rem 0.1rem;
		font-size: 1.01rem;
		font-weight: 600;
		background: none;
		color: #111;
	}
	.nf-highlight {
		font-size: 1.18rem;
		font-weight: 900;
	}
	.nf-label-text {
		color: #111;
		font-weight: 700;
		letter-spacing: 0.01em;
		font-size: 1.01rem;
		text-transform: uppercase;
	}
	.nf-calories-label {
		font-size: 1.18rem;
		font-weight: 900;
	}
	.nf-value {
		font-weight: 900;
		color: #111;
		font-size: 1.01rem;
	}
	.nf-calories-value {
		font-size: 1.18rem;
		font-weight: 900;
	}
	.nf-unit {
		font-weight: 400;
		color: #222;
		font-size: 0.82em;
		margin-left: 0.13em;
		text-transform: uppercase;
	}
	.nf-note {
		margin-top: 0.6rem;
		font-size: 0.77rem;
		color: #222;
		line-height: 1.4;
		letter-spacing: 0.01em;
		border-top: 2px solid #111;
		padding-top: 0.3rem;
	}
</style>
