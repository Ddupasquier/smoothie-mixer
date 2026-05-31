<script lang="ts">
    import IngredientSearch from "$lib/components/IngredientSearch.svelte";
    import NutritionPanel from "$lib/components/NutritionPanel.svelte";
    import PillRow from "$lib/components/PillRow.svelte";
    import type { FdcFood } from "$lib/utils/types";
    import { foodToNutritionTotals } from "$lib/utils/foodToNutritionTotals";
    import {
        readSmoothieList,
        removeFoodFromSmoothieList,
        SMOOTHIE_LISTS_CHANGED_EVENT,
        type SmoothieListKey,
    } from "$lib/utils/smoothieLists";
    import { onMount } from "svelte";
    import { MIX_STORAGE_KEYS } from "../../defaults/mixDefaults";
    // Restore handleSelect for IngredientSearch
    function handleSelect(food: FdcFood) {
        selectedFood = food;
    }

    let lastResults = $state<FdcFood[]>([]);
    let lastQuery = $state("");
    let selectedFood = $state<FdcFood | null>(null);

    // Pills state
    let onHand = $state<FdcFood[]>([]);
    let shoppingList = $state<FdcFood[]>([]);

    function loadLists() {
        onHand = readSmoothieList(MIX_STORAGE_KEYS.fridge);
        shoppingList = readSmoothieList(MIX_STORAGE_KEYS.shoppingList);
    }

    function removeFromLocalStorageByIndex(key: SmoothieListKey, idx: number) {
        const list = readSmoothieList(key);
        const food = list[idx];
        if (!food) return;
        removeFoodFromSmoothieList(key, food.fdcId);
        loadLists();
    }

    // Load on mount and whenever the NutritionPanel adds

    onMount(() => {
        loadLists();
        window.addEventListener("storage", loadLists);
        window.addEventListener(SMOOTHIE_LISTS_CHANGED_EVENT, loadLists);
        window.addEventListener("focus", loadLists);
        return () => {
            window.removeEventListener("storage", loadLists);
            window.removeEventListener(SMOOTHIE_LISTS_CHANGED_EVENT, loadLists);
            window.removeEventListener("focus", loadLists);
        };
    });

    // Patch IngredientSearch to capture results for debugging
    type ResultsEvent = CustomEvent<{ results: FdcFood[]; query: string }>;
    function handleResults(event: ResultsEvent) {
        lastResults = event.detail.results;
        lastQuery = event.detail.query;
    }
</script>

<section class="fridge-section">
    <h3>On Hand</h3>
    <div class="fridge-container" aria-label="On Hand ingredients">
        {#if onHand.length > 0}
            <PillRow
                pills={onHand.map((item) => item.description)}
                onRemove={(idx) =>
                    removeFromLocalStorageByIndex(MIX_STORAGE_KEYS.fridge, idx)}
            />
        {:else}
            <p class="placeholder">No ingredients on hand yet.</p>
        {/if}
    </div>
</section>

<section class="fridge-section">
    <h3>Shopping List</h3>
    <div class="fridge-container" aria-label="Shopping List ingredients">
        {#if shoppingList.length > 0}
            <PillRow
                pills={shoppingList.map((item) => item.description)}
                onRemove={(idx) =>
                    removeFromLocalStorageByIndex(MIX_STORAGE_KEYS.shoppingList, idx)}
            />
        {:else}
            <p class="placeholder">No items in shopping list yet.</p>
        {/if}
    </div>
</section>

<style lang="scss">
    @use "../../styles/variables" as *;
    .fridge-section {
        margin-bottom: $app-gap-lg;

        h3 {
            margin-bottom: $app-gap-sm;
            color: $app-primary;
            font-size: 1.13em;
            font-weight: 600;
        }

        .fridge-container {
            background: $app-bg;
            border-radius: $app-card-radius;
            padding: $app-gap-md $app-gap-lg 0.7em $app-gap-lg;
            min-height: 48px;
            margin-bottom: 0.5em;
            box-shadow: $app-card-shadow;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
        }

        .placeholder {
            color: #b3b3b3;
            font-size: 0.98em;
            margin: 0.2em 0;
        }
    }
</style>
