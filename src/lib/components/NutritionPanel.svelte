<script lang="ts">
	import MoveItemPrompt from "$lib/components/MoveItemPrompt.svelte";
	import NutritionConfidenceDetails from "$lib/components/NutritionConfidenceDetails.svelte";
	import type { FdcFood } from "$lib/utils/types";
	import { getFoodQuality } from "$lib/utils/foodQuality";
	import {
		addFoodToSmoothieList,
		readSmoothieList,
		removeFoodFromSmoothieList,
	} from "$lib/utils/smoothieLists";
	import {
		getFdcNutrientValue,
		isFdcNutrientMatch,
	} from "$lib/utils/fdcNutrients";
	import { onDestroy, onMount } from "svelte";
	import { MIX_STORAGE_KEYS } from "../../defaults/mixDefaults";

	interface Props {
		food?: FdcFood;
	}

	let { food }: Props = $props();

	import { vitalNutrients } from "../../variables/vitalNutrients";

	const foodQuality = $derived(food ? getFoodQuality(food) : null);
	const vitalRows = $derived(
		food
			? vitalNutrients.map((vn) => {
					const value = getFdcNutrientValue(food, Number(vn.id));
					return {
						label: vn.label,
						value: value ? value.toFixed(1) : "0",
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
							!vitalIds.some((id) => isFdcNutrientMatch(n, id)) &&
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

	const syncHeight = () => {
		if (vitalListRef) {
			rightColHeight = vitalListRef.offsetHeight;
		}
	};

	$effect(() => {
		syncHeight();
	});

	onMount(() => {
		syncHeight();
		window.addEventListener("resize", syncHeight);
		return () => window.removeEventListener("resize", syncHeight);
	});

	// Move prompt state
	let movePrompt = $state<null | {
		message: string;
		onConfirm: () => void;
		onCancel: () => void;
	}>(null);
	let feedbackMessage = $state("");
	let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

	const showFeedback = (message: string) => {
		feedbackMessage = message;
		if (feedbackTimer) clearTimeout(feedbackTimer);
		feedbackTimer = setTimeout(() => {
			feedbackMessage = "";
			feedbackTimer = null;
		}, 1800);
	};

	onDestroy(() => {
		if (feedbackTimer) clearTimeout(feedbackTimer);
	});

	const handleAddToFridge = () => {
		if (!food) return;
		const shoppingList = readSmoothieList(MIX_STORAGE_KEYS.shoppingList);
		if (shoppingList.some((item) => item.fdcId === food.fdcId)) {
			movePrompt = {
				message:
					"This item is already in your shopping list. Move it to your fridge?",
				onConfirm: () => {
					removeFoodFromSmoothieList(
						MIX_STORAGE_KEYS.shoppingList,
						food.fdcId,
					);
					addFoodToSmoothieList(MIX_STORAGE_KEYS.fridge, food);
					showFeedback("Moved to fridge.");
					movePrompt = null;
				},
				onCancel: () => {
					movePrompt = null;
				},
			};
			return;
		}
		const added = addFoodToSmoothieList(MIX_STORAGE_KEYS.fridge, food);
		showFeedback(added ? "Added to fridge." : "Already in fridge.");
	};

	const handleAddToShopping = () => {
		if (!food) return;
		const fridgeList = readSmoothieList(MIX_STORAGE_KEYS.fridge);
		if (fridgeList.some((item) => item.fdcId === food.fdcId)) {
			movePrompt = {
				message:
					"This item is already in your fridge. Move it to your shopping list?",
				onConfirm: () => {
					removeFoodFromSmoothieList(MIX_STORAGE_KEYS.fridge, food.fdcId);
					addFoodToSmoothieList(MIX_STORAGE_KEYS.shoppingList, food);
					showFeedback("Moved to shopping list.");
					movePrompt = null;
				},
				onCancel: () => {
					movePrompt = null;
				},
			};
			return;
		}
		const added = addFoodToSmoothieList(MIX_STORAGE_KEYS.shoppingList, food);
		showFeedback(added ? "Added to shopping list." : "Already in shopping list.");
	};
</script>

<section class="nf-label">
	<div class="nf-heading">
		<div class="nf-title">Nutrition Facts</div>
		<div class="nf-basis">Per 100g food data</div>
	</div>
	{#if food?.description}
		<div class="nf-food-row">
			<div class="nf-food">{food.description}</div>
			{#if food.customFood}
				<span class="nf-custom-badge">Custom</span>
			{/if}
		</div>
	{/if}
	{#if foodQuality && (foodQuality.label === "Partial" || foodQuality.label === "Limited")}
		<NutritionConfidenceDetails quality={foodQuality} />
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

	<div class="nf-actions">
		<button class="nf-btn" onclick={handleAddToFridge} disabled={!food}
			>Add to Fridge</button
		>
		<button class="nf-btn" onclick={handleAddToShopping} disabled={!food}
			>Add to Shopping List</button
		>
	</div>
	{#if feedbackMessage}
		<div class="nf-feedback" role="status" aria-live="polite">
			<span>✓</span>
			{feedbackMessage}
		</div>
	{/if}
	{#if movePrompt}
		<MoveItemPrompt
			message={movePrompt.message}
			onConfirm={movePrompt.onConfirm}
			onCancel={movePrompt.onCancel}
		/>
	{/if}
</section>

<style lang="scss">
	@use "../../styles/variables" as *;

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
	.nf-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		border-bottom: 8px solid #111;
		padding-bottom: 0.18rem;
		margin-bottom: 0.1rem;
	}
	.nf-title {
		font-size: 2.1rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.01em;
		line-height: 1.1;
	}
	.nf-basis {
		max-width: 6.8rem;
		padding-top: 0.18rem;
		color: #222;
		font-size: 0.68rem;
		font-weight: 800;
		line-height: 1.15;
		text-align: right;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}
	.nf-food-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 0.2rem;
	}
	.nf-food {
		font-size: 1.01rem;
		font-weight: 600;
		color: #222;
	}
	.nf-custom-badge {
		width: fit-content;
		padding: 0.08rem 0.4rem;
		color: $app-btn-text;
		background: $app-custom-strong;
		border-radius: 999px;
		font-family: Arial, sans-serif;
		font-size: 0.64rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.04em;
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
	.nf-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.7rem;
		margin: 0.7rem 0 0.2rem 0;
	}
	.nf-feedback {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.35rem;
		min-height: 1.3rem;
		margin: 0.2rem 0;
		color: $app-primary;
		font-family: Arial, sans-serif;
		font-size: 0.86rem;
		font-weight: 800;
		animation: nf-feedback-pop 0.18s ease-out;

		span {
			display: inline-grid;
			place-items: center;
			width: 1.05rem;
			height: 1.05rem;
			color: $app-primary;
			background: $app-success-bg;
			border-radius: 999px;
			font-size: 0.72rem;
			line-height: 1;
		}
	}
	.nf-btn {
		background: #222;
		color: #fff;
		border: none;
		border-radius: 3px;
		font-size: 1rem;
		font-weight: 700;
		padding: 0.45em 1.1em;
		cursor: pointer;
		transition: background 0.15s;

		&:disabled {
			background: #aaa;
			cursor: not-allowed;
		}
		&:not(:disabled):hover {
			background: #444;
		}
	}

	@keyframes nf-feedback-pop {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
