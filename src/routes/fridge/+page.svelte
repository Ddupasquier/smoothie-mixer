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
        // TODO: Add selected food to On Hand or Shopping List
        // For now, just log it
        console.log("Selected food:", food);
    }

    // Patch IngredientSearch to capture results for debugging
    type ResultsEvent = CustomEvent<{ results: FdcFood[]; query: string }>;
    function handleResults(event: ResultsEvent) {
        lastResults = event.detail.results;
        lastQuery = event.detail.query;
    }
</script>

<h2>Fridge</h2>

<IngredientSearch onSelect={handleSelect} on:results={handleResults} />

{#if selectedFood}
    <section class="nutrition-facts-label">
        <div class="nf-title">Nutrition Facts</div>
        <div class="nf-food">{selectedFood.description}</div>
        <NutritionPanel
            totals={foodToNutritionTotals(selectedFood)}
            food={selectedFood}
        />
    </section>
{/if}

<section class="fridge-section">
    <h3>On Hand</h3>
    <div class="fridge-container" aria-label="On Hand ingredients">
        <!-- TODO: List On Hand ingredients here -->
        <p class="placeholder">No ingredients on hand yet.</p>
    </div>
</section>

<section class="fridge-section">
    <h3>Shopping List</h3>
    <div class="fridge-container" aria-label="Shopping List ingredients">
        <!-- TODO: List Shopping List ingredients here -->
        <p class="placeholder">No items in shopping list yet.</p>
    </div>
</section>

<style>
    .fridge-section {
        margin-bottom: 2rem;
    }
    .nutrition-facts-label {
        margin: 1.1rem 0 1.1rem 0;
        margin-left: auto;
        margin-right: auto;
        font-family: "Inter", "Arial", sans-serif;
        font-size: 0.93rem;
        color: #111;
    }
    .nf-title {
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: 0.01em;
        margin-bottom: 0.1rem;
        color: #111;
        line-height: 1.1;
    }
    .nf-food {
        font-size: 0.98rem;
        color: #222;
        font-weight: 500;
        margin-bottom: 0.2rem;
        word-break: break-word;
    }
    
    @media (max-width: 600px) {
        .nutrition-facts-label {
            padding: 0.5rem 0.2rem 0.4rem 0.2rem;
            font-size: 0.85rem;
        }
        .nf-title {
            font-size: 1.08rem;
        }
        .nf-food {
            font-size: 0.91rem;
        }
    }

    .fridge-container {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius);
        padding: 1rem;
        min-height: 60px;
        margin-top: 0.5rem;
    }
    .placeholder {
        color: var(--color-text-muted);
        font-size: 0.95rem;
    }
</style>
