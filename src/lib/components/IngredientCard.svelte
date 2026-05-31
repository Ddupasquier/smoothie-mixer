<script lang="ts">
	import { getNutrientValue } from "$lib/stores/smoothie.svelte";
	import type { Ingredient } from "$lib/utils/types";
	import { NUTRIENT_IDS } from "$lib/utils/types";

	interface Props {
		ingredient: Ingredient;
		onRemove: (fdcId: number) => void;
		onUpdateGrams: (fdcId: number, grams: number) => void;
	}

	let { ingredient, onRemove, onUpdateGrams }: Props = $props();

	const localGrams = $derived(() => ingredient.servingGrams);

	function handleGramsChange(e: Event) {
		const val = parseInt((e.target as HTMLInputElement).value, 10);
		if (!isNaN(val) && val > 0) {
			onUpdateGrams(ingredient.fdcId, val);
		}
	}

	const calories = $derived(
		getNutrientValue(ingredient, NUTRIENT_IDS.CALORIES),
	);
	const protein = $derived(
		getNutrientValue(ingredient, NUTRIENT_IDS.PROTEIN),
	);
</script>

<li class="ingredient-card">
	<div class="ing-header">
		<span class="ing-name">{ingredient.name}</span>
		<button
			class="remove-btn"
			aria-label="Remove {ingredient.name}"
			onclick={() => onRemove(ingredient.fdcId)}
		>
			✕
		</button>
	</div>
	<div class="ing-footer">
		<label class="grams-label">
			<span>Grams:</span>
			<input
				type="number"
				class="grams-input"
				min="1"
				max="1000"
				value={localGrams}
				onchange={handleGramsChange}
			/>
		</label>
		<div class="ing-macros">
			<span>{Math.round(calories)} kcal</span>
			<span>{protein.toFixed(1)} g protein</span>
		</div>
	</div>
</li>

<style>
	.ingredient-card {
		list-style: none;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ing-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.ing-name {
		font-weight: 600;
		font-size: 0.9rem;
		line-height: 1.3;
		flex: 1;
	}

	.remove-btn {
		background: transparent;
		color: var(--color-danger);
		font-size: 1rem;
		padding: 0.15rem 0.4rem;
		border-radius: var(--radius-sm);
		line-height: 1;
		flex-shrink: 0;
	}

	.remove-btn:hover {
		background: #fce4e4;
	}

	.ing-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.grams-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.grams-input {
		width: 70px;
		padding: 0.25rem 0.4rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		text-align: center;
	}

	.ing-macros {
		display: flex;
		gap: 0.6rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}
</style>
