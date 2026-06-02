<script lang="ts">
    import IngredientSearch from "$lib/components/IngredientSearch.svelte";
    import NutritionPanel from "$lib/components/NutritionPanel.svelte";
    import type { FdcFood } from "$lib/utils/types";

    let selectedFood = $state<FdcFood | null>(null);

    function handleSelect(food: FdcFood) {
        selectedFood = food;
    }
</script>

<div class="search-page">
    <h2>Search</h2>
    <div class="ingredient-search-section">
        <IngredientSearch onSelect={handleSelect} />
    </div>
    {#if selectedFood}
        <NutritionPanel food={selectedFood} />
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
    }
</style>
