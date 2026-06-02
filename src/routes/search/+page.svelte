<script lang="ts">
    import IngredientSearch from "$lib/components/IngredientSearch.svelte";
    import NutritionPanel from "$lib/components/NutritionPanel.svelte";
    import type { FdcFood } from "$lib/utils/types";
    import { foodToNutritionTotals } from "$lib/utils/foodToNutritionTotals";

    let lastResults = $state<FdcFood[]>([]);
    let lastQuery = $state("");
    let selectedFood = $state<FdcFood | null>(null);

    function handleSelect(food: FdcFood) {
        selectedFood = food;
    }

    type ResultsEvent = CustomEvent<{ results: FdcFood[]; query: string }>;
    function handleResults(event: ResultsEvent) {
        lastResults = event.detail.results;
        lastQuery = event.detail.query;
    }
</script>

<div class="search-page">
    <h2>Search</h2>
    <div class="ingredient-search-section">
        <IngredientSearch onSelect={handleSelect} on:results={handleResults} />
    </div>
    {#if selectedFood}
        <div class="nutrition-facts-label"></div>
        <NutritionPanel
            totals={foodToNutritionTotals(selectedFood, 100)}
            food={selectedFood}
        />
    {/if}
</div>

<style lang="scss">
    @use "../../styles/variables" as *;

    .search-page {
        max-width: $app-max-width;
        margin: 0 auto;
        padding: $app-padding;
        background: $app-bg;
        border-radius: $app-radius;
        min-height: 100vh;
        box-sizing: border-box;

        h2 {
            margin-bottom: $app-gap-sm;
        }

        .ingredient-search-section {
            margin-bottom: $app-gap-lg;
        }

        .nutrition-facts-label {
            margin: 1.1rem 0 0.7rem 0;
            color: $app-muted;
            font-size: 0.97rem;
            font-weight: 500;

            .nf-title {
                margin-bottom: 0.2rem;
            }
            .nf-food {
                margin-bottom: 0.2rem;
            }
        }

        .nf-label {
            margin-bottom: 1.2rem;
            border-radius: $app-radius;
            box-shadow: $app-box-shadow;
            border: $app-border;
            background: $app-section-bg;
        }

        /* MoveItemPrompt spacing */
        .move-prompt {
            margin-bottom: 1.2rem;
        }
    }
</style>
