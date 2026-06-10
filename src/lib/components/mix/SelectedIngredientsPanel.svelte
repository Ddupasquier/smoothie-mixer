<script lang="ts">
	import IngredientCard from "$lib/components/mix/IngredientCard.svelte";
	import type { FdcFood } from "$lib/utils/food/types";
	import type { NutrientMeta } from "$lib/utils/mix/mixCalculations";
	import {
		getFoodNutrientChips,
		getFoodSourceLabel,
		getServingGramsLabel,
	} from "$lib/utils/mix/mixUi";
	import type { ServingConversion } from "$lib/utils/serving/servingAmount";
	import type { ServingMeasureUnit } from "../../../defaults/servingMeasureDefaults";

	let {
		selectedFoods,
		fridgeItems,
		selectedNutrients,
		servingGrams,
		getServingQuantity,
		getServingUnit,
		getServingConversion,
		getServingConversionWarning,
		onRemove,
		onServingChange,
	}: {
		selectedFoods: FdcFood[];
		fridgeItems: FdcFood[];
		selectedNutrients: NutrientMeta[];
		servingGrams: Record<number, number>;
		getServingQuantity: (food: FdcFood) => number;
		getServingUnit: (food: FdcFood) => ServingMeasureUnit;
		getServingConversion: (food: FdcFood) => ServingConversion;
		getServingConversionWarning: (food: FdcFood) => string | null | undefined;
		onRemove: (foodId: number) => void;
		onServingChange: (
			food: FdcFood,
			quantityValue: string,
			unit: ServingMeasureUnit,
		) => void;
	} = $props();
</script>

<section class="selected-ingredients-panel" aria-label="Selected ingredients">
	<div class="selected-ingredients-header">
		<div>
			<h4>Selected Ingredients</h4>
			<p>Adjust amounts here. The graph updates from these values.</p>
		</div>
	</div>
	<div class="selected-ingredient-cards">
		{#each selectedFoods as food}
			<IngredientCard
				{food}
				sourceLabel={getFoodSourceLabel(food, fridgeItems)}
				quantity={getServingQuantity(food)}
				unit={getServingUnit(food)}
				gramsLabel={getServingGramsLabel(getServingConversion(food))}
				warning={getServingConversionWarning(food)}
				nutrientChips={getFoodNutrientChips(
					food,
					selectedNutrients,
					servingGrams,
				)}
				onRemove={onRemove}
				onServingChange={onServingChange}
			/>
		{/each}
	</div>
</section>

<style lang="scss">
	@use "../../../styles/variables" as *;

	.selected-ingredients-panel {
		display: grid;
		gap: $app-gap-sm;
		padding: $app-gap-sm;
		background: $app-bg;
		border: $app-border;
		border-radius: $app-card-radius;

		h4 {
			color: $app-primary;
			font-size: $app-font-size-lg;
			font-weight: 700;
		}

		p {
			color: $app-muted;
			font-size: $app-font-size-md;
		}
	}

	.selected-ingredients-header {
		display: flex;
		justify-content: space-between;
		gap: $app-gap-sm;
	}

	.selected-ingredient-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
		gap: $app-gap-sm;
		max-height: min(52vh, 30rem);
		overflow-y: auto;
		overscroll-behavior: contain;
		padding-right: 0.2rem;
	}

	@media (max-width: 680px) {
		.selected-ingredient-cards {
			grid-template-columns: 1fr;
			max-height: 42vh;
		}
	}
</style>
