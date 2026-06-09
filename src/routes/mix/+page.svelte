<script lang="ts">
    import CheckboxGroup from "$lib/components/common/CheckboxGroup.svelte";
    import IngredientCard from "$lib/components/mix/IngredientCard.svelte";
    import MixEmptyState from "$lib/components/mix/MixEmptyState.svelte";
    import NutrientAdjustmentSuggestions from "$lib/components/mix/NutrientAdjustmentSuggestions.svelte";
    import PointShape from "$lib/components/mix/PointShape.svelte";
    import SmartWarnings from "$lib/components/mix/SmartWarnings.svelte";
    import TextInputDialog from "$lib/components/common/TextInputDialog.svelte";
    import {
        getNutrientGoalWarnings,
        type SmartWarning,
    } from "$lib/utils/mix/smartWarnings";
    import {
        cacheSmoothieListLocally,
        readSmoothieList,
        SMOOTHIE_LISTS_CHANGED_EVENT,
    } from "$lib/utils/storage/smoothieLists";
    import {
        readCloudMixPreferences,
        reconcileCloudSmoothieList,
        saveCloudMixPreferences,
    } from "$lib/utils/storage/supabaseData";
    import IngredientContributionBreakdown from "$lib/components/mix/IngredientContributionBreakdown.svelte";
    import { addSavedDrink } from "$lib/utils/storage/savedDrinks";
    import {
        convertServingAmount,
        convertServingToGrams,
        parseServingAmount,
    } from "$lib/utils/serving/servingAmount";
    import {
        formatChartNumber,
        formatSignedChartNumber,
        getDefaultNutrientOptions,
        getDefaultServingAmount,
        getEstimatedVolumeWarnings,
        getFoodNutrientChips,
        getFoodSourceLabel,
        getNutrientMeta,
        getServingGramsLabel,
        mergeNutrientOptions,
        normalizeNutrientOptions,
        normalizeServingUnit,
        optionsFromSelectedNutrientIds,
        readNutrientGoalsFromStorage,
        type NutrientOption,
        type SavedMixState,
        withOverageDetails,
    } from "$lib/utils/mix/mixUi";
    import {
        getChartColors,
        getChartValues,
        getDefaultNutrientGoal,
        getGoalValues,
        getNutrientContributionBreakdowns,
        getNutrientChartMetrics,
        getNutrientContributors as calculateNutrientContributors,
        getNutrientFoodSuggestions,
        getNutrientReductionSuggestions,
        getPointColors,
        getNutrientProgress,
        getNutrientTotal as calculateNutrientTotal,
    } from "$lib/utils/mix/mixCalculations";
    import type { FdcFood } from "$lib/utils/food/types";
    import { onMount } from "svelte";
    import {
        DEFAULT_NUTRIENT_GOALS,
        DEFAULT_SERVING_GRAMS,
        GOAL_TEMPLATES,
        MIX_STORAGE_KEYS,
    } from "../../defaults/mixDefaults";
    import { POINT_SHAPE_DEFAULTS } from "../../defaults/pointShapeDefaults";
    import type { ServingMeasureUnit } from "../../defaults/servingMeasureDefaults";
    import { vitalNutrients } from "../../variables/vitalNutrients";
    import { ALL_NUTRIENTS } from "../../variables/allNutrients";
    import PillRow from "$lib/components/common/PillRow.svelte";

    let selected = $state<(string | number)[]>(vitalNutrients.map((n) => n.id));
    let options = $state<NutrientOption[]>(getDefaultNutrientOptions());
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
    let saveDialogOpen = $state(false);
    let selectedGoalTemplateId = $state("");

    const getServingQuantity = (food: FdcFood) => {
        return servingQuantities[food.fdcId] ?? DEFAULT_SERVING_GRAMS;
    };

    const getServingUnit = (food: FdcFood) => {
        return normalizeServingUnit(servingUnits[food.fdcId]) ?? "g";
    };

    const getServingConversion = (food: FdcFood) => {
        return convertServingAmount(
            getServingQuantity(food),
            getServingUnit(food),
            food,
        );
    };

    const selectedCount = $derived(selected.length);
    const selectedNutrients = $derived(
        selected.flatMap((id) => {
            const nutrient = getNutrientMeta(id, [
                vitalNutrients,
                ALL_NUTRIENTS,
            ]);
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
        getNutrientProgress(
            selectedNutrients,
            selectedFoods,
            nutrientGoals,
            servingGrams,
        ),
    );
    const nutrientChartMetrics = $derived(
        getNutrientChartMetrics(
            selectedNutrients,
            selectedFoods,
            nutrientGoals,
            servingGrams,
        ),
    );
    const chartValues = $derived(getChartValues(nutrientChartMetrics));
    const nutrientLabels = $derived(
        selectedNutrients.map((nutrient) =>
            (nutrient.label ?? String(nutrient.id)).replace("Total ", ""),
        ),
    );
    const nutrientValueLabels = $derived(
        selectedNutrients.map((nutrient) => {
            const nutrientId = Number(nutrient.id);
            const total = getNutrientTotal(nutrientId);
            const goal =
                nutrientGoals[nutrientId] ?? getDefaultNutrientGoal(nutrient);
            return `${formatChartNumber(total)}/${formatChartNumber(goal)}${nutrient.unit ?? ""}`;
        }),
    );
    const saveGoalDiffs = $derived(
        selectedNutrients.map((nutrient) => {
            const nutrientId = Number(nutrient.id);
            const total = getNutrientTotal(nutrientId);
            const goal =
                nutrientGoals[nutrientId] ?? getDefaultNutrientGoal(nutrient);
            const difference = total - goal;
            const tolerance = Math.max(goal * 0.05, 0.05);
            const status =
                Math.abs(difference) <= tolerance
                    ? "near"
                    : difference > 0
                      ? "over"
                      : "under";

            return {
                label: nutrient.label ?? String(nutrient.id),
                unit: nutrient.unit ?? "",
                total,
                goal,
                difference,
                percentOfGoal: goal > 0 ? (total / goal) * 100 : 0,
                status,
            };
        }),
    );
    const goalValues = $derived(getGoalValues(nutrientChartMetrics));
    const contributionBreakdowns = $derived(
        getNutrientContributionBreakdowns(
            selectedNutrients,
            selectedFoods,
            servingGrams,
        ),
    );
    const nutrientFoodSuggestions = $derived(
        getNutrientFoodSuggestions({
            nutrients: selectedNutrients,
            availableFoods: allIngredientItems,
            selectedFoodIds,
            nutrientGoals,
            servingGrams,
            sourceLabelForFood: (food) => getFoodSourceLabel(food, fridgeItems),
        }),
    );
    const nutrientReductionSuggestions = $derived(
        getNutrientReductionSuggestions({
            nutrients: selectedNutrients,
            selectedFoods,
            nutrientGoals,
            servingGrams,
            sourceLabelForFood: (food) => getFoodSourceLabel(food, fridgeItems),
        }),
    );
    const nutrientOverages = $derived(
        selectedNutrients.flatMap((nutrient) => {
            const goal =
                nutrientGoals[Number(nutrient.id)] ||
                getDefaultNutrientGoal(nutrient);
            const nutrientId = Number(nutrient.id);
            const total = getNutrientTotal(nutrientId);
            if (goal <= 0 || total <= goal) return [];

            return [
                {
                    nutrientId,
                    label: nutrient.label ?? String(nutrient.id),
                    unit: nutrient.unit ?? "",
                    total,
                    goal,
                    overage: total - goal,
                    contributors: getNutrientContributors(nutrientId),
                },
            ];
        }),
    );
    const smartWarnings = $derived<SmartWarning[]>([
        ...getNutrientGoalWarnings(
            selectedNutrients.map((nutrient) => {
                const nutrientId = Number(nutrient.id);
                return {
                    id: nutrient.id,
                    label: nutrient.label ?? String(nutrient.id),
                    unit: nutrient.unit ?? "",
                    total: getNutrientTotal(nutrientId),
                    goal:
                        nutrientGoals[nutrientId] ??
                        getDefaultNutrientGoal(nutrient),
                };
            }),
            { includeUnderTargets: selectedFoods.length > 0 },
        ).map((warning) => withOverageDetails(warning, nutrientOverages)),
        ...getEstimatedVolumeWarnings(selectedFoods, getServingConversion),
    ]);
    const maxNutrientProgress = $derived(
        nutrientProgress.reduce((max, progress) => Math.max(max, progress), 0),
    );
    const chartColors = $derived(getChartColors(maxNutrientProgress));
    const pointColors = $derived(getPointColors(nutrientProgress));

    const getNutrientTotal = (nutrientId: number) => {
        return calculateNutrientTotal(selectedFoods, nutrientId, servingGrams);
    };

    const getNutrientContributors = (nutrientId: number) => {
        return calculateNutrientContributors(
            selectedFoods,
            nutrientId,
            servingGrams,
        );
    };

    const loadIngredientLists = () => {
        fridgeItems = readSmoothieList(MIX_STORAGE_KEYS.fridge);
        shoppingItems = readSmoothieList(MIX_STORAGE_KEYS.shoppingList);
    };

    const loadCloudBackedIngredientLists = async () => {
        const localFridge = readSmoothieList(MIX_STORAGE_KEYS.fridge);
        const localShoppingList = readSmoothieList(MIX_STORAGE_KEYS.shoppingList);

        fridgeItems = localFridge;
        shoppingItems = localShoppingList;

        const [nextFridge, nextShoppingList] = await Promise.all([
            reconcileCloudSmoothieList(MIX_STORAGE_KEYS.fridge, localFridge),
            reconcileCloudSmoothieList(
                MIX_STORAGE_KEYS.shoppingList,
                localShoppingList,
            ),
        ]);

        fridgeItems = nextFridge;
        shoppingItems = nextShoppingList;
        cacheSmoothieListLocally(MIX_STORAGE_KEYS.fridge, nextFridge);
        cacheSmoothieListLocally(MIX_STORAGE_KEYS.shoppingList, nextShoppingList);
    };

    const loadNutrientGoals = () => {
        nutrientGoals = {
            ...DEFAULT_NUTRIENT_GOALS,
            ...readNutrientGoalsFromStorage(),
        };
    };

    const saveNutrientGoals = (nextGoals: Record<number, number>) => {
        localStorage.setItem(
            MIX_STORAGE_KEYS.nutrientGoals,
            JSON.stringify(nextGoals),
        );
        void saveCloudMixPreferences({ nutrientGoals: nextGoals });
    };

    const loadMixState = () => {
        try {
            const rawState = localStorage.getItem(MIX_STORAGE_KEYS.mixState);
            if (!rawState) return;

            const savedState = JSON.parse(rawState) as SavedMixState;
            const savedSelected = Array.isArray(savedState.selected)
                ? savedState.selected
                : selected;
            const savedOptions = normalizeNutrientOptions(savedState.options);

            selected = savedSelected;
            options = mergeNutrientOptions(
                getDefaultNutrientOptions(),
                savedOptions,
                optionsFromSelectedNutrientIds(savedSelected, [
                    vitalNutrients,
                    ALL_NUTRIENTS,
                ]),
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
            options = getDefaultNutrientOptions();
            selectedFoodIds = [];
            servingGrams = {};
            servingQuantities = {};
            servingUnits = {};
        }
    };

    const saveMixState = () => {
        const mixState = {
            selected,
            options,
            selectedFoodIds,
            servingGrams,
            servingQuantities,
            servingUnits,
        };

        localStorage.setItem(
            MIX_STORAGE_KEYS.mixState,
            JSON.stringify(mixState),
        );
        void saveCloudMixPreferences({ mixState });
    };

    const loadCloudBackedMixPreferences = async () => {
        const cloudPreferences = await readCloudMixPreferences();
        if (!cloudPreferences) return;

        const hasCloudGoals =
            cloudPreferences.nutrientGoals &&
            Object.keys(cloudPreferences.nutrientGoals).length > 0;
        const hasCloudMixState =
            cloudPreferences.mixState &&
            Object.keys(cloudPreferences.mixState).length > 0;

        if (hasCloudGoals) {
            localStorage.setItem(
                MIX_STORAGE_KEYS.nutrientGoals,
                JSON.stringify(cloudPreferences.nutrientGoals),
            );
            loadNutrientGoals();
        }

        if (hasCloudMixState) {
            localStorage.setItem(
                MIX_STORAGE_KEYS.mixState,
                JSON.stringify(cloudPreferences.mixState),
            );
            loadMixState();
        }

        if (!hasCloudGoals || !hasCloudMixState) {
            void saveCloudMixPreferences({
                nutrientGoals,
                mixState: {
                    selected,
                    options,
                    selectedFoodIds,
                    servingGrams,
                    servingQuantities,
                    servingUnits,
                },
            });
        }
    };

    const resetGoals = () => {
        nutrientGoals = { ...DEFAULT_NUTRIENT_GOALS };
        selectedGoalTemplateId = "";
        saveNutrientGoals(nutrientGoals);
    };

    const clearIngredients = () => {
        selectedFoodIds = [];
        servingGrams = {};
        servingQuantities = {};
        servingUnits = {};
        saveMixState();
    };

    const resetMix = () => {
        selected = vitalNutrients.map((n) => n.id);
        options = getDefaultNutrientOptions();
        addNutrientId = "";
        clearIngredients();
        nutrientGoals = { ...DEFAULT_NUTRIENT_GOALS };
        selectedGoalTemplateId = "";
        saveNutrientGoals(nutrientGoals);
        saveMixState();
    };

    const saveCurrentDrink = (name: string) => {
        addSavedDrink({
            name,
            foods: selectedFoods,
            selected,
            options,
            nutrientGoals,
            servingGrams,
            servingQuantities,
            servingUnits,
        });
        saveDialogOpen = false;
    };

    const handleChange = (next: (string | number)[]) => {
        selected = next;
        saveMixState();
    };

    const handleAddNutrient = () => {
        if (!addNutrientId) return;
        const nutrient = ALL_NUTRIENTS.find((n) => n.id == addNutrientId);
        if (nutrient && !options.some((opt) => opt.id == nutrient.id)) {
            options = [...options, { id: nutrient.id, label: nutrient.label }];
            saveMixState();
        }
        addNutrientId = "";
    };

    const updateGoal = (id: string | number, value: string) => {
        const nextGoals = {
            ...nutrientGoals,
            [Number(id)]: Math.max(0, Number(value) || 0),
        };
        nutrientGoals = nextGoals;
        saveNutrientGoals(nextGoals);
        selectedGoalTemplateId = "";
    };

    const applyGoalTemplate = () => {
        const template = GOAL_TEMPLATES.find(
            (item) => item.id === selectedGoalTemplateId,
        );
        if (!template) return;

        const nextGoals = {
            ...nutrientGoals,
            ...template.goals,
        };
        nutrientGoals = nextGoals;
        saveNutrientGoals(nextGoals);
    };

    const toggleFood = (foodId: number) => {
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
    };

    const addSuggestedFood = (foodId: number, nextServingGrams: number) => {
        if (!selectedFoodIds.includes(foodId)) {
            selectedFoodIds = [...selectedFoodIds, foodId];
        }
        servingGrams = {
            ...servingGrams,
            [foodId]: nextServingGrams,
        };
        servingQuantities = {
            ...servingQuantities,
            [foodId]: nextServingGrams,
        };
        servingUnits = {
            ...servingUnits,
            [foodId]: "g",
        };
        saveMixState();
    };

    const applySuggestedReduction = (
        foodId: number,
        nextServingGrams: number,
    ) => {
        servingGrams = {
            ...servingGrams,
            [foodId]: nextServingGrams,
        };
        servingQuantities = {
            ...servingQuantities,
            [foodId]: nextServingGrams,
        };
        servingUnits = {
            ...servingUnits,
            [foodId]: "g",
        };
        saveMixState();
    };

    const getServingConversionWarning = (food: FdcFood) => {
        return getServingConversion(food).warning;
    };

    const updateServingAmount = (
        food: FdcFood,
        quantityValue: string,
        unit: ServingMeasureUnit,
    ) => {
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
    };

    onMount(() => {
        void loadCloudBackedIngredientLists();
        loadMixState();
        loadNutrientGoals();
        void loadCloudBackedMixPreferences();
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
        <div>
            <h2>Mix</h2>
            <p>Build your smoothie here.</p>
        </div>
        <div class="reset-actions" aria-label="Mix reset actions">
            <button
                type="button"
                onclick={() => (saveDialogOpen = true)}
                disabled={selectedFoods.length === 0}>Save</button
            >
            <button type="button" onclick={resetGoals}>Reset Goals</button>
            <button type="button" onclick={clearIngredients}
                >Clear Ingredients</button
            >
            <button type="button" onclick={resetMix}>Reset All</button>
        </div>
    </header>

    <TextInputDialog
        open={saveDialogOpen}
        title="Review & Save Drink"
        description="Before saving, confirm these totals are close enough to your goals."
        label="Drink name"
        placeholder="Post-workout, Low sugar, High fiber…"
        confirmLabel="Save Anyway"
        cancelLabel="Cancel"
        onConfirm={saveCurrentDrink}
        onCancel={() => (saveDialogOpen = false)}
    >
        <div class="save-goal-review">
            <p>
                Current ingredients compared with your selected nutrient goals:
            </p>
            <div class="save-goal-review__list">
                {#each saveGoalDiffs as diff}
                    <div class="save-goal-review__row">
                        <div>
                            <strong>{diff.label}</strong>
                            <span
                                >Actual {formatChartNumber(diff.total)}{diff.unit}
                                · Goal {formatChartNumber(diff.goal)}{diff.unit}
                                · {Math.round(diff.percentOfGoal)}%</span
                            >
                        </div>
                        <span class={`save-goal-review__badge ${diff.status}`}>
                            {diff.status === "near"
                                ? "Near goal"
                                : diff.status === "over"
                                  ? "Over"
                                  : "Under"}
                            {formatSignedChartNumber(diff.difference)}{diff.unit}
                        </span>
                    </div>
                {/each}
            </div>
        </div>
    </TextInputDialog>

    <section class="mix-panel" aria-labelledby="nutrient-controls-title">
        <div class="mix-builder">
            <section class="setup-card setup-card--nutrients">
                <div class="panel-header">
                    <div>
                        <h3 id="nutrient-controls-title">Nutrients</h3>
                        <p>{selectedCount} selected for the graph</p>
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

                <div class="mix-nutrients" aria-label="Selected nutrients">
                    <CheckboxGroup {options} {selected} onChange={handleChange} />
                </div>
            </section>

            <section class="setup-card setup-card--goals">
                <div class="section-heading">
                    <div>
                        <h4>Goal Targets</h4>
                        <p>Set the target amount for each selected nutrient.</p>
                    </div>
                    <div class="goal-template-controls">
                        <label for="goal-template">Template</label>
                        <select
                            id="goal-template"
                            bind:value={selectedGoalTemplateId}
                        >
                            <option value="">Choose preset</option>
                            {#each GOAL_TEMPLATES as template}
                                <option value={template.id}>{template.label}</option>
                            {/each}
                        </select>
                        <button
                            type="button"
                            onclick={applyGoalTemplate}
                            disabled={!selectedGoalTemplateId}>Apply</button
                        >
                    </div>
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
                                    getDefaultNutrientGoal(nutrient)}
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
                                    getDefaultNutrientGoal(nutrient)}
                            </small>
                        </label>
                    {/each}
                </div>
            </section>

            <section class="setup-card setup-card--ingredients">
                <div class="section-heading">
                    <h4>Choose Ingredients</h4>
                    <p>Select items from your fridge or shopping list.</p>
                </div>
                <div class="ingredient-lists" aria-label="Smoothie ingredients">
                    <section class="ingredient-list">
                        <h5>Fridge</h5>
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
                                customIndices={fridgeItems
                                    .map((food, i) => (food.customFood ? i : -1))
                                    .filter((i) => i !== -1)}
                            />
                        {:else}
                            <p>No fridge items yet.</p>
                        {/if}
                    </section>

                    <section class="ingredient-list">
                        <h5>Shopping List</h5>
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
                                customIndices={shoppingItems
                                    .map((food, i) => (food.customFood ? i : -1))
                                    .filter((i) => i !== -1)}
                            />
                        {:else}
                            <p>No shopping list items yet.</p>
                        {/if}
                    </section>
                </div>
            </section>

            {#if selectedFoods.length > 0}
                <section
                    class="selected-ingredients-panel"
                    aria-label="Selected ingredients"
                >
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
                                sourceLabel={getFoodSourceLabel(
                                    food,
                                    fridgeItems,
                                )}
                                quantity={getServingQuantity(food)}
                                unit={getServingUnit(food)}
                                gramsLabel={getServingGramsLabel(
                                    getServingConversion(food),
                                )}
                                warning={getServingConversionWarning(food)}
                                nutrientChips={getFoodNutrientChips(
                                    food,
                                    selectedNutrients,
                                    servingGrams,
                                )}
                                onRemove={toggleFood}
                                onServingChange={updateServingAmount}
                            />
                        {/each}
                    </div>
                </section>
            {:else}
                <MixEmptyState />
            {/if}

            <div class="shape-panel" aria-label="Generated shape">
                <div class="shape-preview">
                    <PointShape
                        points={selectedCount}
                        values={chartValues}
                        {goalValues}
                        labels={nutrientLabels}
                        valueLabels={nutrientValueLabels}
                        {pointColors}
                        fillColor={chartColors.fill}
                        strokeColor={chartColors.stroke}
                        size={POINT_SHAPE_DEFAULTS.size}
                        fullWidth
                    />
                </div>
                <SmartWarnings warnings={smartWarnings} />
                <NutrientAdjustmentSuggestions
                    foodSuggestions={nutrientFoodSuggestions}
                    reductionSuggestions={nutrientReductionSuggestions}
                    onAdd={addSuggestedFood}
                    onReduce={applySuggestedReduction}
                />
                <IngredientContributionBreakdown
                    breakdowns={contributionBreakdowns}
                />
            </div>

        </div>
    </section>
</div>

<style lang="scss">
    @use "../../styles/variables" as *;

    .mix-page {
        max-width: $app-max-width;
        margin: 0 auto;
        padding: $app-padding 0;
        box-sizing: border-box;
    }

    .mix-header {
        display: flex;
        justify-content: space-between;
        gap: $app-gap-md;
        align-items: flex-start;
        margin-bottom: $app-gap-md;

        h2 {
            margin-bottom: 0.25rem;
            color: $app-primary;
        }

        p {
            color: $app-muted;
        }
    }

    .reset-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.35rem;
        max-width: 22rem;

        button {
            background: $app-btn-bg;
            color: $app-btn-text;
            border-radius: $app-radius;
            font-size: 0.8rem;
            font-weight: 700;
            padding: 0.42rem 0.7rem;

            &:hover {
                background: $app-btn-bg-hover;
            }

            &:disabled {
                cursor: not-allowed;
                background: $app-btn-disabled;
            }
        }
    }

    .save-goal-review {
        display: grid;
        gap: $app-gap-sm;

        > p {
            color: $app-muted;
            font-size: 0.86rem;
            line-height: 1.4;
        }
    }

    .save-goal-review__list {
        display: grid;
        gap: 0.4rem;
        max-height: 16rem;
        overflow-y: auto;
        padding-right: 0.15rem;
    }

    .save-goal-review__row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.6rem;
        padding: 0.5rem 0.6rem;
        background: $app-bg;
        border: $app-border;
        border-radius: $app-radius;

        div {
            display: grid;
            gap: 0.1rem;
            min-width: 0;
        }

        strong {
            color: $app-primary;
            font-size: 0.86rem;
        }

        span {
            color: $app-muted;
            font-size: 0.76rem;
            font-weight: 700;
        }
    }

    .save-goal-review__badge {
        justify-self: end;
        width: fit-content;
        max-width: 8rem;
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
        text-align: right;
        white-space: nowrap;

		&.near {
			color: $app-primary;
			background: $app-success-bg;
		}

        &.under {
            color: $app-primary;
            background: $app-accent;
        }

        &.over {
            color: $app-warning-text;
            background: $app-warning-bg;
        }
    }

    .mix-panel {
        padding: $app-gap-sm;
        background: $app-section-bg;
        border: $app-border;
        border-radius: $app-card-radius;
        box-shadow: $app-box-shadow;
    }

    .setup-card {
        padding: $app-gap-sm;
        background: $app-bg;
        border: $app-border;
        border-radius: $app-card-radius;
    }

    .section-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: $app-gap-sm;
        margin-bottom: $app-gap-sm;

        > div:first-child {
            min-width: 0;
        }

        h4 {
            color: $app-primary;
            font-size: 0.92rem;
            font-weight: 800;
        }

        p {
            color: $app-muted;
            font-size: 0.8rem;
            line-height: 1.35;
        }
    }

    .goal-template-controls {
        display: grid;
        grid-template-columns: minmax(8.5rem, 1fr) auto;
        gap: 0.35rem;
        min-width: min(100%, 15rem);

        label {
            grid-column: 1 / -1;
            color: $app-muted;
            font-size: 0.72rem;
            font-weight: 800;
        }

        select {
            width: 100%;
            min-width: 0;
            height: 2rem;
            padding: 0 0.5rem;
            color: $app-primary;
            background: $app-section-bg;
            border: $app-border;
            border-radius: 8px;
            font-size: 0.82rem;
        }

        button {
            height: 2rem;
            padding: 0 0.6rem;
            color: $app-btn-text;
            background: $app-btn-bg;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 800;

            &:hover:not(:disabled) {
                background: $app-btn-bg-hover;
            }

            &:disabled {
                cursor: not-allowed;
                background: $app-btn-disabled;
            }
        }
    }

    .panel-header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(220px, 300px);
        gap: $app-gap-sm;
        align-items: end;
        margin-bottom: $app-gap-sm;

        h3 {
            margin-bottom: 0.1rem;
            color: $app-primary;
            font-size: 0.98rem;
            font-weight: 800;
        }

        p {
            color: $app-muted;
            font-size: 0.8rem;
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
            font-size: 0.75rem;
            font-weight: 700;
            line-height: 1;
        }

        select {
            width: 100%;
            min-width: 0;
            height: 2.1rem;
            padding: 0 0.55rem;
            color: $app-primary;
            background: $app-bg;
            border: $app-border;
            border-radius: 8px;
            font-size: 0.86rem;
        }

        button {
            height: 2.1rem;
            padding: 0 0.65rem;
            background: $app-btn-bg;
            color: $app-btn-text;
            font-size: 0.84rem;

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
        gap: $app-gap-sm;
    }

    .mix-nutrients {
        display: flex;
        align-content: flex-start;

        :global(.checkbox-group) {
            gap: 0.35rem;
        }

        :global(.checkbox-item) {
            min-height: 1.85rem;
            padding: 0.3rem 0.55rem;
            font-size: 0.84rem;
        }

        :global(input) {
            width: 0.8rem;
            height: 0.8rem;
        }
    }

    .goal-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
        gap: 0.45rem;
    }

    .goal-input {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(3.8rem, 4.8rem) auto;
        align-items: center;
        gap: 0.35rem;
        min-width: 0;
        padding: 0.42rem 0.55rem;
        background: $app-section-bg;
        border: $app-border;
        border-radius: $app-radius;
        color: $app-primary;
        font-size: 0.82rem;
        font-weight: 800;

        span {
            min-width: 0;
            overflow-wrap: anywhere;
        }

        input {
            width: 100%;
            min-width: 0;
            height: 1.85rem;
            padding: 0 0.45rem;
            color: $app-primary;
            background: $app-bg;
            border: $app-border;
            border-radius: 7px;
            font-size: 0.86rem;
        }

        .goal-unit {
            color: $app-muted;
            font-size: 0.76rem;
        }

        small {
            grid-column: 1 / -1;
            color: $app-muted;
            font-size: 0.72rem;
            font-weight: 600;
        }
    }

    .ingredient-lists {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: $app-gap-sm;
    }

    .ingredient-list {
        min-width: 0;
        max-height: 13rem;
        overflow: auto;
        padding: 0;
        background: $app-section-bg;
        border: $app-border;
        border-radius: $app-card-radius;

        h5 {
            position: sticky;
            top: 0;
            z-index: 2;
            margin: 0 0 0.35rem;
            padding: 0.45rem;
            color: $app-primary;
            background: $app-section-bg;
            border-bottom: $app-border;
            font-size: 0.84rem;
            font-weight: 800;
        }

        p {
            padding: 0 0.45rem 0.45rem;
            color: $app-muted;
            font-size: 0.82rem;
        }

        :global(.pill-row) {
            gap: 0.3rem;
            margin: 0;
            padding: 0 0.45rem 0.45rem;
        }

        :global(.pill) {
            max-width: 100%;
            padding: 0.16rem 0.55rem;
            font-size: 0.82rem;
            line-height: 1.2;
            overflow-wrap: anywhere;
        }

        :global(.pill-remove) {
            flex-shrink: 0;
            font-size: 1rem;
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

    .selected-ingredients-panel {
        display: grid;
        gap: $app-gap-sm;
        padding: $app-gap-sm;
        background: $app-bg;
        border: $app-border;
        border-radius: $app-card-radius;

        h4 {
            color: $app-primary;
            font-size: 0.95rem;
            font-weight: 700;
        }

        p {
            color: $app-muted;
            font-size: 0.86rem;
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
        .mix-page {
            padding-top: $app-gap-sm;
        }

        .panel-header {
            grid-template-columns: 1fr;
        }

        .mix-header {
            display: grid;
        }

        .reset-actions {
            justify-content: flex-start;
        }

        .ingredient-lists {
            grid-template-columns: 1fr;
        }

        .section-heading {
            display: grid;
        }

        .goal-template-controls {
            min-width: 0;
        }

        .selected-ingredient-cards {
            grid-template-columns: 1fr;
            max-height: 42vh;
        }

        .add-nutrient-controls {
            grid-template-columns: minmax(0, 1fr) 4.5rem;
        }
    }
</style>
