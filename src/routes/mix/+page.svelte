<script lang="ts">
    function resetMix() {
        selected = vitalNutrients.map((n) => n.id);
        options = getDefaultOptions();
        addNutrientId = "";
        // Deselect all fridge and shopping items
        selectedFoodIds = [];
        servingGrams = {};
        servingQuantities = {};
        servingUnits = {};
        nutrientGoals = { ...DEFAULT_NUTRIENT_GOALS };
        // Add any other fields to reset as needed
    }
    import CheckboxGroup from "$lib/components/CheckboxGroup.svelte";
    import NutrientOverageSummary, {
        type NutrientOverage,
    } from "$lib/components/NutrientOverageSummary.svelte";
    import PointShape from "$lib/components/PointShape.svelte";
    import {
        readSmoothieList,
        SMOOTHIE_LISTS_CHANGED_EVENT,
    } from "$lib/utils/smoothieLists";
    import {
        convertServingAmount,
        convertServingToGrams,
        parseServingAmount,
    } from "$lib/utils/servingAmount";
    import { getFdcNutrientValue } from "$lib/utils/fdcNutrients";
    import type { FdcFood } from "$lib/utils/types";
    import { onMount } from "svelte";
    import {
        DEFAULT_GOAL_BY_UNIT,
        DEFAULT_NUTRIENT_GOALS,
        DEFAULT_SERVING_GRAMS,
        MIX_STORAGE_KEYS,
        NUTRIENT_PROGRESS_COLORS,
        NUTRIENT_PROGRESS_THRESHOLDS,
    } from "../../defaults/mixDefaults";
    import { POINT_SHAPE_DEFAULTS } from "../../defaults/pointShapeDefaults";
    import {
        SERVING_MEASURE_ALIASES,
        SERVING_MEASURE_OPTIONS,
        type ServingMeasureUnit,
    } from "../../defaults/servingMeasureDefaults";
    import { vitalNutrients } from "../../variables/vitalNutrients";
    import { ALL_NUTRIENTS } from "../../variables/allNutrients";
    import PillRow from "$lib/components/PillRow.svelte";

    type NutrientOption = { id: string | number; label: string };
    type SavedMixState = {
        selected?: (string | number)[];
        options?: NutrientOption[];
        selectedFoodIds?: number[];
        servingGrams?: Record<string, number>;
        servingInputs?: Record<string, string>;
        servingQuantities?: Record<string, number>;
        servingUnits?: Record<string, ServingMeasureUnit>;
    };

    let selected = $state<(string | number)[]>(vitalNutrients.map((n) => n.id));
    let options = $state<NutrientOption[]>(getDefaultOptions());
    let addNutrientId = $state<string | number>("");
    let fridgeItems = $state<FdcFood[]>([]);
    let shoppingItems = $state<FdcFood[]>([]);
    let selectedFoodIds = $state<number[]>([]);
    let servingGrams = $state<Record<number, number>>({});
    let servingQuantities = $state<Record<number, number>>({});
    let servingUnits = $state<Record<number, ServingMeasureUnit>>({});
    let nutrientGoals = $state<Record<number, number>>({
        ...DEFAULT_NUTRIENT_GOALS,
    });

    const selectedCount = $derived(selected.length);
    const selectedNutrients = $derived(
        selected.flatMap((id) => {
            const nutrient = getNutrientMeta(id);
            return nutrient ? [nutrient] : [];
        }),
    );
    const allIngredientItems = $derived([...fridgeItems, ...shoppingItems]);
    const selectedFoods = $derived(
        allIngredientItems.filter((item) =>
            selectedFoodIds.includes(item.fdcId),
        ),
    );
    const nutrientProgress = $derived(
        selectedNutrients.map((nutrient) => {
            const goal =
                nutrientGoals[Number(nutrient.id)] || getDefaultGoal(nutrient);
            if (goal <= 0) return 0;
            return getNutrientTotal(Number(nutrient.id)) / goal;
        }),
    );
    const nutrientChartMetrics = $derived(
        selectedNutrients.map((nutrient) => {
            const nutrientId = Number(nutrient.id);
            const baselineGoal = getDefaultGoal(nutrient);
            const safeBaselineGoal = baselineGoal > 0 ? baselineGoal : 1;
            const goal = nutrientGoals[nutrientId] || baselineGoal;
            const total = getNutrientTotal(nutrientId);

            return {
                goalRatio: goal / safeBaselineGoal,
                totalRatio: total / safeBaselineGoal,
            };
        }),
    );
    const chartReferenceRatio = $derived(
        Math.max(
            1,
            ...nutrientChartMetrics.map((metric) => metric.goalRatio),
        ),
    );
    const chartValues = $derived(
        nutrientChartMetrics.map((metric) =>
            clampChartValue(metric.totalRatio / chartReferenceRatio),
        ),
    );
    const nutrientLabels = $derived(
        selectedNutrients.map((nutrient) =>
            nutrient.label.replace("Total ", ""),
        ),
    );
    const goalValues = $derived(
        nutrientChartMetrics.map((metric) =>
            clampChartValue(metric.goalRatio / chartReferenceRatio),
        ),
    );
    const maxNutrientProgress = $derived(
        nutrientProgress.reduce((max, progress) => Math.max(max, progress), 0),
    );
    const chartColors = $derived(getChartColors(maxNutrientProgress));
    const nutrientOverages = $derived<NutrientOverage[]>(
        selectedNutrients.flatMap((nutrient) => {
            const goal =
                nutrientGoals[Number(nutrient.id)] || getDefaultGoal(nutrient);
            const nutrientId = Number(nutrient.id);
            const total = getNutrientTotal(nutrientId);
            if (goal <= 0 || total <= goal) return [];

            return [
                {
                    label: nutrient.label,
                    unit: nutrient.unit,
                    total,
                    goal,
                    overage: total - goal,
                    contributors: getNutrientContributors(nutrientId),
                },
            ];
        }),
    );

    function getNutrientMeta(id: string | number) {
        return [...vitalNutrients, ...ALL_NUTRIENTS].find(
            (nutrient) => nutrient.id == id,
        );
    }

    function getDefaultOptions() {
        return vitalNutrients.map((nutrient) => ({
            id: nutrient.id,
            label: nutrient.label,
        }));
    }

    function mergeOptions(...optionLists: NutrientOption[][]) {
        const seen = new Set<string>();
        return optionLists.flat().filter((option) => {
            const key = String(option.id);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function normalizeOptions(value: unknown): NutrientOption[] {
        if (!Array.isArray(value)) return [];

        return value.flatMap((option) => {
            if (
                option &&
                typeof option === "object" &&
                "id" in option &&
                "label" in option &&
                (typeof option.id === "string" ||
                    typeof option.id === "number") &&
                typeof option.label === "string"
            ) {
                return [{ id: option.id, label: option.label }];
            }

            return [];
        });
    }

    function optionsFromSelectedIds(selectedIds: (string | number)[]) {
        return selectedIds.flatMap((id) => {
            const nutrient = getNutrientMeta(id);
            return nutrient ? [{ id: nutrient.id, label: nutrient.label }] : [];
        });
    }

    function getDefaultGoal(nutrient: { id: string | number; unit?: string }) {
        const id = Number(nutrient.id);
        if (DEFAULT_NUTRIENT_GOALS[id]) return DEFAULT_NUTRIENT_GOALS[id];
        if (nutrient.unit === "g") return DEFAULT_GOAL_BY_UNIT.grams;
        if (nutrient.unit === "kcal") return DEFAULT_GOAL_BY_UNIT.calories;
        return DEFAULT_GOAL_BY_UNIT.fallback;
    }

    function getChartColors(progress: number) {
        if (progress <= NUTRIENT_PROGRESS_THRESHOLDS.atGoal) {
            return NUTRIENT_PROGRESS_COLORS.atGoal;
        }

        if (progress <= NUTRIENT_PROGRESS_THRESHOLDS.barelyOver) {
            return NUTRIENT_PROGRESS_COLORS.barelyOver;
        }

        if (progress <= NUTRIENT_PROGRESS_THRESHOLDS.midwayOver) {
            return NUTRIENT_PROGRESS_COLORS.midwayOver;
        }

        return NUTRIENT_PROGRESS_COLORS.wayOver;
    }

    function clampChartValue(value: number) {
        if (!Number.isFinite(value)) return 0;
        return Math.max(0, Math.min(value, 1));
    }

    function getNutrientTotal(nutrientId: number) {
        return selectedFoods.reduce(
            (total, food) => total + getFoodNutrientAmount(food, nutrientId),
            0,
        );
    }

    function getFoodNutrientAmount(food: FdcFood, nutrientId: number) {
        const nutrientValue = getFdcNutrientValue(food, nutrientId);
        if (!nutrientValue) return 0;
        const grams = servingGrams[food.fdcId] ?? DEFAULT_SERVING_GRAMS;

        return (nutrientValue * grams) / 100;
    }

    function getNutrientContributors(nutrientId: number) {
        return selectedFoods
            .map((food) => ({
                label: food.description,
                amount: getFoodNutrientAmount(food, nutrientId),
                grams: servingGrams[food.fdcId] ?? DEFAULT_SERVING_GRAMS,
            }))
            .filter((contributor) => contributor.amount > 0)
            .sort((a, b) => b.amount - a.amount);
    }

    function loadIngredientLists() {
        fridgeItems = readSmoothieList(MIX_STORAGE_KEYS.fridge);
        shoppingItems = readSmoothieList(MIX_STORAGE_KEYS.shoppingList);
    }

    function loadNutrientGoals() {
        try {
            const rawGoals = localStorage.getItem(
                MIX_STORAGE_KEYS.nutrientGoals,
            );
            const savedGoals = rawGoals ? JSON.parse(rawGoals) : {};
            nutrientGoals = {
                ...DEFAULT_NUTRIENT_GOALS,
                ...savedGoals,
            };
        } catch {
            nutrientGoals = { ...DEFAULT_NUTRIENT_GOALS };
        }
    }

    function saveNutrientGoals(nextGoals: Record<number, number>) {
        localStorage.setItem(
            MIX_STORAGE_KEYS.nutrientGoals,
            JSON.stringify(nextGoals),
        );
    }

    function loadMixState() {
        try {
            const rawState = localStorage.getItem(MIX_STORAGE_KEYS.mixState);
            if (!rawState) return;

            const savedState = JSON.parse(rawState) as SavedMixState;
            const savedSelected = Array.isArray(savedState.selected)
                ? savedState.selected
                : selected;
            const savedOptions = normalizeOptions(savedState.options);

            selected = savedSelected;
            options = mergeOptions(
                getDefaultOptions(),
                savedOptions,
                optionsFromSelectedIds(savedSelected),
            );
            selectedFoodIds = Array.isArray(savedState.selectedFoodIds)
                ? savedState.selectedFoodIds.filter((id) => Number.isFinite(id))
                : [];
            servingGrams = Object.fromEntries(
                Object.entries(savedState.servingGrams ?? {})
                    .map(([id, grams]) => [Number(id), Number(grams)])
                    .filter(
                        ([id, grams]) =>
                            Number.isFinite(id) && Number.isFinite(grams),
                    ),
            );
            servingQuantities = Object.fromEntries(
                selectedFoodIds.map((foodId) => {
                    const parsedInput = savedState.servingInputs?.[foodId]
                        ? parseServingAmount(savedState.servingInputs[foodId])
                        : null;
                    const savedQuantity = Number(
                        savedState.servingQuantities?.[foodId],
                    );
                    return [
                        foodId,
                        Number.isFinite(savedQuantity)
                            ? savedQuantity
                            : (parsedInput?.quantity ??
                              servingGrams[foodId] ??
                              DEFAULT_SERVING_GRAMS),
                    ];
                }),
            );
            servingUnits = Object.fromEntries(
                selectedFoodIds.map((foodId) => {
                    const parsedInput = savedState.servingInputs?.[foodId]
                        ? parseServingAmount(savedState.servingInputs[foodId])
                        : null;
                    return [
                        foodId,
                        normalizeServingUnit(
                            savedState.servingUnits?.[foodId],
                        ) ??
                            parsedInput?.unit ??
                            "g",
                    ];
                }),
            );
            servingGrams = Object.fromEntries(
                selectedFoodIds.map((foodId) => {
                    const food = allIngredientItems.find(
                        (item) => item.fdcId === foodId,
                    );
                    const quantity =
                        servingQuantities[foodId] ??
                        servingGrams[foodId] ??
                        DEFAULT_SERVING_GRAMS;
                    const unit = servingUnits[foodId] ?? "g";
                    return [
                        foodId,
                        convertServingToGrams(quantity, unit, food),
                    ];
                }),
            );
        } catch {
            selected = vitalNutrients.map((nutrient) => nutrient.id);
            options = getDefaultOptions();
            selectedFoodIds = [];
            servingGrams = {};
            servingQuantities = {};
            servingUnits = {};
        }
    }

    function saveMixState() {
        localStorage.setItem(
            MIX_STORAGE_KEYS.mixState,
            JSON.stringify({
                selected,
                options,
                selectedFoodIds,
                servingGrams,
                servingQuantities,
                servingUnits,
            }),
        );
    }

    function handleChange(next: (string | number)[]) {
        selected = next;
        saveMixState();
    }

    function handleAddNutrient() {
        if (!addNutrientId) return;
        const nutrient = ALL_NUTRIENTS.find((n) => n.id == addNutrientId);
        if (nutrient && !options.some((opt) => opt.id == nutrient.id)) {
            options = [...options, { id: nutrient.id, label: nutrient.label }];
            saveMixState();
        }
        addNutrientId = "";
    }

    function updateGoal(id: string | number, value: string) {
        const nextGoals = {
            ...nutrientGoals,
            [Number(id)]: Math.max(0, Number(value) || 0),
        };
        nutrientGoals = nextGoals;
        saveNutrientGoals(nextGoals);
    }

    function toggleFood(foodId: number) {
        if (selectedFoodIds.includes(foodId)) {
            selectedFoodIds = selectedFoodIds.filter((id) => id !== foodId);
            saveMixState();
            return;
        }

        selectedFoodIds = [...selectedFoodIds, foodId];
        const food = allIngredientItems.find((item) => item.fdcId === foodId);
        const defaultServing = getDefaultServingAmount(food);
        servingGrams = {
            ...servingGrams,
            [foodId]:
                servingGrams[foodId] ??
                convertServingToGrams(
                    defaultServing.quantity,
                    defaultServing.unit,
                    food,
                ),
        };
        servingQuantities = {
            ...servingQuantities,
            [foodId]: servingQuantities[foodId] ?? defaultServing.quantity,
        };
        servingUnits = {
            ...servingUnits,
            [foodId]: servingUnits[foodId] ?? defaultServing.unit,
        };
        saveMixState();
    }

    function getDefaultServingAmount(food?: FdcFood) {
        const servingUnit = normalizeServingUnit(food?.servingSizeUnit);
        if (food?.servingSize && servingUnit) {
            return {
                quantity: food.servingSize,
                unit: servingUnit,
            };
        }

        return {
            quantity: DEFAULT_SERVING_GRAMS,
            unit: "g" as ServingMeasureUnit,
        };
    }

    function getServingGrams(food: FdcFood) {
        return servingGrams[food.fdcId] ?? DEFAULT_SERVING_GRAMS;
    }

    function getServingGramsLabel(food: FdcFood) {
        const conversion = getServingConversion(food);
        return `${conversion.isEstimate ? "≈ " : ""}${conversion.grams.toFixed(1)}g`;
    }

    function getServingQuantity(food: FdcFood) {
        return servingQuantities[food.fdcId] ?? DEFAULT_SERVING_GRAMS;
    }

    function getServingUnit(food: FdcFood) {
        return normalizeServingUnit(servingUnits[food.fdcId]) ?? "g";
    }

    function normalizeServingUnit(value: unknown) {
        if (typeof value !== "string") return null;
        return (
            SERVING_MEASURE_ALIASES[
                value.trim().toLowerCase().replace(/\s+/g, "")
            ] ?? null
        );
    }

    function getServingConversion(food: FdcFood) {
        return convertServingAmount(
            getServingQuantity(food),
            getServingUnit(food),
            food,
        );
    }

    function getServingConversionWarning(food: FdcFood) {
        return getServingConversion(food).warning;
    }

    function updateServingAmount(
        food: FdcFood,
        quantityValue: string,
        unit: ServingMeasureUnit,
    ) {
        const quantity = Math.max(0, Number(quantityValue) || 0);
        servingQuantities = {
            ...servingQuantities,
            [food.fdcId]: quantity,
        };
        servingUnits = {
            ...servingUnits,
            [food.fdcId]: unit,
        };
        servingGrams = {
            ...servingGrams,
            [food.fdcId]: convertServingToGrams(quantity, unit, food),
        };
        saveMixState();
    }

    onMount(() => {
        loadIngredientLists();
        loadMixState();
        loadNutrientGoals();
        window.addEventListener("storage", loadIngredientLists);
        window.addEventListener(
            SMOOTHIE_LISTS_CHANGED_EVENT,
            loadIngredientLists,
        );
        window.addEventListener("focus", loadIngredientLists);
        return () => {
            window.removeEventListener("storage", loadIngredientLists);
            window.removeEventListener(
                SMOOTHIE_LISTS_CHANGED_EVENT,
                loadIngredientLists,
            );
            window.removeEventListener("focus", loadIngredientLists);
        };
    });
</script>

<div class="mix-page">
    <header class="mix-header">
        <h2>Mix</h2>
        <p>Build your smoothie here.</p>
        <button type="button" class="reset-btn" onclick={resetMix}
            >Reset All</button
        >
    </header>

    <section class="mix-panel" aria-labelledby="nutrient-controls-title">
        <div class="panel-header">
            <div>
                <h3 id="nutrient-controls-title">Nutrients</h3>
                <p>{selectedCount} selected</p>
            </div>
            <div class="add-nutrient-controls">
                <label for="add-nutrient">Add nutrient</label>
                <select id="add-nutrient" bind:value={addNutrientId}>
                    <option value="">Select nutrient</option>
                    {#each ALL_NUTRIENTS.filter((n) => !options.some((opt) => opt.id == n.id)) as n}
                        <option value={n.id}>{n.label}</option>
                    {/each}
                </select>
                <button
                    type="button"
                    onclick={handleAddNutrient}
                    disabled={!addNutrientId}>Add</button
                >
            </div>
        </div>

        <div class="mix-builder">
            <div class="mix-nutrients" aria-label="Selected nutrients">
                <CheckboxGroup {options} {selected} onChange={handleChange} />
            </div>

            <div class="goal-grid" aria-label="Nutrient goals">
                {#each selectedNutrients as nutrient}
                    <label class="goal-input">
                        <span>{nutrient.label}</span>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            value={nutrientGoals[Number(nutrient.id)] ??
                                getDefaultGoal(nutrient)}
                            oninput={(event) =>
                                updateGoal(
                                    nutrient.id,
                                    event.currentTarget.value,
                                )}
                        />
                        <span class="goal-unit">{nutrient.unit}</span>
                        <small>
                            {getNutrientTotal(Number(nutrient.id)).toFixed(1)} /
                            {nutrientGoals[Number(nutrient.id)] ??
                                getDefaultGoal(nutrient)}
                        </small>
                    </label>
                {/each}
            </div>

            <div class="ingredient-lists" aria-label="Smoothie ingredients">
                <section class="ingredient-list">
                    <h4>Fridge</h4>
                    {#if fridgeItems.length > 0}
                        <PillRow
                            pills={fridgeItems.map((food) => food.description)}
                            onRemove={(idx) =>
                                toggleFood(fridgeItems[idx].fdcId)}
                            onSelect={(idx) =>
                                toggleFood(fridgeItems[idx].fdcId)}
                            activeIndices={fridgeItems
                                .map((food, i) =>
                                    selectedFoodIds.includes(food.fdcId)
                                        ? i
                                        : -1,
                                )
                                .filter((i) => i !== -1)}
                        />
                    {:else}
                        <p>No fridge items yet.</p>
                    {/if}
                </section>

                <section class="ingredient-list">
                    <h4>Shopping List</h4>
                    {#if shoppingItems.length > 0}
                        <PillRow
                            pills={shoppingItems.map(
                                (food) => food.description,
                            )}
                            onRemove={(idx) =>
                                toggleFood(shoppingItems[idx].fdcId)}
                            onSelect={(idx) =>
                                toggleFood(shoppingItems[idx].fdcId)}
                            activeIndices={shoppingItems
                                .map((food, i) =>
                                    selectedFoodIds.includes(food.fdcId)
                                        ? i
                                        : -1,
                                )
                                .filter((i) => i !== -1)}
                        />
                    {:else}
                        <p>No shopping list items yet.</p>
                    {/if}
                </section>
            </div>

            <div class="shape-panel" aria-label="Generated shape">
                <div class="shape-preview">
                    <PointShape
                        points={selectedCount}
                        values={chartValues}
                        {goalValues}
                        labels={nutrientLabels}
                        fillColor={chartColors.fill}
                        strokeColor={chartColors.stroke}
                        size={POINT_SHAPE_DEFAULTS.size}
                        fullWidth
                    />
                </div>
            </div>

            <NutrientOverageSummary overages={nutrientOverages} />

            {#if selectedFoods.length > 0}
                <section
                    class="serving-panel"
                    aria-label="Selected ingredient amounts"
                >
                    <h4>Ingredient Amounts</h4>
                    <div class="serving-list">
                        {#each selectedFoods as food}
                            {@const volumeWarning =
                                getServingConversionWarning(food)}
                            <div class="serving-input">
                                <span>{food.description}</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={getServingQuantity(food)}
                                    aria-label={`Quantity for ${food.description}`}
                                    oninput={(event) =>
                                        updateServingAmount(
                                            food,
                                            event.currentTarget.value,
                                            getServingUnit(food),
                                        )}
                                />
                                <select
                                    aria-label={`Measure for ${food.description}`}
                                    value={getServingUnit(food)}
                                    onchange={(event) =>
                                        updateServingAmount(
                                            food,
                                            String(getServingQuantity(food)),
                                            event.currentTarget
                                                .value as ServingMeasureUnit,
                                        )}
                                >
                                    {#each SERVING_MEASURE_OPTIONS as option}
                                        <option value={option.value}
                                            >{option.label}</option
                                        >
                                    {/each}
                                </select>
                                <span class="serving-grams"
                                    >{getServingGramsLabel(food)}</span
                                >
                                {#if volumeWarning}
                                    <p class="serving-warning">
                                        {volumeWarning}
                                    </p>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </section>
            {/if}
        </div>
    </section>
</div>

<style lang="scss">
    @use "../../styles/variables" as *;

    .reset-btn {
        margin-bottom: $app-gap-md;
        background: $app-btn-bg;
        color: #fff;
        border: none;
        border-radius: $app-radius;
        font-size: 1rem;
        font-weight: 700;
        padding: 0.45em 1.1em;
        cursor: pointer;
        transition: background 0.15s;
        &:hover {
            background: $app-btn-bg-hover;
        }
    }

    .mix-page {
        max-width: $app-max-width;
        margin: 0 auto;
        padding: $app-padding 0;
        box-sizing: border-box;
    }

    .mix-header {
        margin-bottom: $app-gap-sm;

        h2 {
            margin-bottom: 0.25rem;
            color: $app-primary;
        }

        p {
            color: $app-muted;
        }
    }

    .mix-panel {
        padding: $app-gap-md;
        background: $app-section-bg;
        border: $app-border;
        border-radius: $app-card-radius;
        box-shadow: $app-box-shadow;
    }

    .panel-header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
        gap: $app-gap-md;
        align-items: end;
        margin-bottom: $app-gap-md;

        h3 {
            margin-bottom: 0.1rem;
            color: $app-primary;
            font-size: 1.05rem;
            font-weight: 600;
        }

        p {
            color: $app-muted;
            font-size: 0.9rem;
            font-weight: 600;
        }
    }

    .add-nutrient-controls {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 4.5rem;
        gap: 0.4rem;

        label {
            grid-column: 1 / -1;
            color: $app-muted;
            font-size: 0.84rem;
            font-weight: 700;
            line-height: 1;
        }

        select {
            width: 100%;
            min-width: 0;
            height: 2.35rem;
            padding: 0 0.7rem;
            color: $app-primary;
            background: $app-bg;
            border: $app-border;
            border-radius: 8px;
        }

        button {
            height: 2.35rem;
            padding: 0 0.7rem;
            background: $app-btn-bg;
            color: $app-btn-text;

            &:hover:not(:disabled) {
                background: $app-btn-bg-hover;
            }

            &:disabled {
                cursor: not-allowed;
                background: $app-btn-disabled;
            }
        }
    }

    .mix-builder {
        display: grid;
        grid-template-columns: 1fr;
        align-items: stretch;
        gap: $app-gap-md;
    }

    .mix-nutrients {
        display: flex;
        align-content: flex-start;
    }

    .goal-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: $app-gap-sm;
    }

    .goal-input {
        display: grid;
        grid-template-columns: 1fr minmax(4rem, 5.5rem) auto;
        align-items: center;
        gap: 0.4rem;
        min-width: 0;
        padding: 0.45rem 0.6rem;
        background: $app-bg;
        border: $app-border;
        border-radius: $app-radius;
        color: $app-primary;
        font-size: 0.9rem;
        font-weight: 600;

        span {
            min-width: 0;
        }

        input {
            width: 100%;
            min-width: 0;
            height: 2rem;
            padding: 0 0.45rem;
            color: $app-primary;
            background: $app-section-bg;
            border: $app-border;
            border-radius: 7px;
        }

        .goal-unit {
            color: $app-muted;
            font-size: 0.82rem;
        }

        small {
            grid-column: 1 / -1;
            color: $app-muted;
            font-size: 0.78rem;
            font-weight: 600;
        }
    }

    .ingredient-lists {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: $app-gap-md;
    }

    .ingredient-list {
        min-width: 0;
        padding: $app-gap-sm;
        background: $app-bg;
        border: $app-border;
        border-radius: $app-card-radius;

        h4 {
            margin-bottom: $app-gap-sm;
            color: $app-primary;
            font-size: 0.95rem;
            font-weight: 700;
        }

        p {
            color: $app-muted;
            font-size: 0.9rem;
        }
    }

    .ingredient-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: $app-gap-sm;

        button {
            max-width: 100%;
            padding: 0.42rem 0.65rem;
            overflow: hidden;
            color: $app-primary;
            background: $app-section-bg;
            border: $app-border;
            border-radius: 999px;
            box-shadow: $app-card-shadow;
            font-size: 0.9rem;
            font-weight: 600;
            text-overflow: ellipsis;
            white-space: nowrap;

            &:hover {
                background: $app-accent;
                border-color: #b3d3f6;
            }

            &.selected {
                color: $app-btn-text;
                background: $app-primary;
                border-color: $app-primary;
            }
        }
    }

    .shape-panel {
        display: grid;
        place-items: center;
        padding: $app-gap-md;
        background: $app-bg;
        border: $app-border;
        border-radius: $app-card-radius;
    }

    .shape-preview {
        display: grid;
        place-items: center;
        width: 100%;
        background: $app-section-bg;
        border-radius: $app-card-radius;
        box-shadow: $app-card-shadow;
    }

    .serving-panel {
        padding: $app-gap-sm;
        background: $app-bg;
        border: $app-border;
        border-radius: $app-card-radius;

        h4 {
            margin-bottom: $app-gap-sm;
            color: $app-primary;
            font-size: 0.95rem;
            font-weight: 700;
        }
    }

    .serving-list {
        display: grid;
        gap: $app-gap-sm;
    }

    .serving-input {
        display: grid;
        grid-template-columns:
            minmax(0, 1fr) minmax(4.5rem, 6rem) minmax(7rem, 9rem)
            auto;
        align-items: center;
        gap: 0.45rem;
        padding: 0.45rem 0.6rem;
        color: $app-primary;
        background: $app-section-bg;
        border: $app-border;
        border-radius: $app-radius;
        font-size: 0.9rem;
        font-weight: 600;

        span:first-child {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        input,
        select {
            width: 100%;
            height: 2rem;
            padding: 0 0.45rem;
            color: $app-primary;
            background: $app-bg;
            border: $app-border;
            border-radius: 7px;
        }

        .serving-grams {
            color: $app-muted;
            font-size: 0.82rem;
            font-weight: 700;
        }

        .serving-warning {
            grid-column: 1 / -1;
            margin: 0.1rem 0 0;
            color: #8a5a00;
            background: rgba(250, 204, 21, 0.16);
            border: 1px solid rgba(202, 138, 4, 0.28);
            border-radius: 7px;
            padding: 0.45rem 0.55rem;
            font-size: 0.78rem;
            font-weight: 600;
            line-height: 1.35;
        }
    }

    @media (max-width: 680px) {
        .mix-page {
            padding-top: $app-gap-sm;
        }

        .panel-header {
            grid-template-columns: 1fr;
        }

        .ingredient-lists {
            grid-template-columns: 1fr;
        }

        .add-nutrient-controls {
            grid-template-columns: minmax(0, 1fr) 4.5rem;
        }
    }
</style>
