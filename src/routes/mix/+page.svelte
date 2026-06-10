<script lang="ts">
	import GoalTargets from "$lib/components/mix/GoalTargets.svelte";
	import IngredientChooser from "$lib/components/mix/IngredientChooser.svelte";
	import MixEmptyState from "$lib/components/mix/MixEmptyState.svelte";
	import NutrientAdjustmentSuggestions from "$lib/components/mix/NutrientAdjustmentSuggestions.svelte";
	import NutrientSelector from "$lib/components/mix/NutrientSelector.svelte";
	import PointShape from "$lib/components/mix/PointShape.svelte";
	import SaveGoalReview from "$lib/components/mix/SaveGoalReview.svelte";
	import SelectedIngredientsPanel from "$lib/components/mix/SelectedIngredientsPanel.svelte";
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
		formatChartNumber,
		getDefaultNutrientOptions,
		getEstimatedVolumeWarnings,
		getFoodSourceLabel,
		getNutrientMeta,
		type NutrientOption,
		type SaveGoalDiff,
		withOverageDetails,
	} from "$lib/utils/mix/mixUi";
	import {
		getDefaultMixState,
		getEmptyServingState,
		getMixStateSnapshot,
		getServingConversion as getServingConversionFromState,
		getServingQuantity as getServingQuantityFromState,
		getServingUnit as getServingUnitFromState,
		getStateWithGramServing,
		getStateWithServingAmount,
		getStateWithToggledFood,
		readStoredMixState,
		readStoredNutrientGoals,
		writeStoredMixState,
		writeStoredRawMixState,
		writeStoredNutrientGoals,
		type MixStateSnapshot,
	} from "$lib/utils/mix/mixState";
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
        GOAL_TEMPLATES,
        MIX_STORAGE_KEYS,
    } from "../../defaults/mixDefaults";
    import { POINT_SHAPE_DEFAULTS } from "../../defaults/pointShapeDefaults";
	import type { ServingMeasureUnit } from "../../defaults/servingMeasureDefaults";
	import { vitalNutrients } from "../../variables/vitalNutrients";
	import { ALL_NUTRIENTS } from "../../variables/allNutrients";

    let selected = $state<(string | number)[]>(vitalNutrients.map((n) => n.id));
    let options = $state<NutrientOption[]>(getDefaultNutrientOptions());
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

	const assignMixState = (state: MixStateSnapshot) => {
		selected = state.selected;
		options = state.options;
		selectedFoodIds = state.selectedFoodIds;
		servingGrams = state.servingGrams;
		servingQuantities = state.servingQuantities;
		servingUnits = state.servingUnits;
	};

	const getCurrentMixState = () => {
		return getMixStateSnapshot({
			selected,
			options,
			selectedFoodIds,
			servingGrams,
			servingQuantities,
			servingUnits,
		});
	};

    const getServingQuantity = (food: FdcFood) => {
        return getServingQuantityFromState(food, servingQuantities);
    };

    const getServingUnit = (food: FdcFood) => {
        return getServingUnitFromState(food, servingUnits);
    };

    const getServingConversion = (food: FdcFood) => {
        return getServingConversionFromState(food, servingQuantities, servingUnits);
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
    const saveGoalDiffs = $derived<SaveGoalDiff[]>(
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
        nutrientGoals = readStoredNutrientGoals();
    };

    const saveNutrientGoals = (nextGoals: Record<number, number>) => {
        writeStoredNutrientGoals(nextGoals);
        void saveCloudMixPreferences({ nutrientGoals: nextGoals });
    };

    const loadMixState = () => {
        assignMixState(readStoredMixState(getCurrentMixState(), allIngredientItems));
    };

    const saveMixState = () => {
        const mixState = getCurrentMixState();
        writeStoredMixState(mixState);
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
            writeStoredNutrientGoals(cloudPreferences.nutrientGoals ?? {});
            loadNutrientGoals();
        }

        if (hasCloudMixState) {
            writeStoredRawMixState(cloudPreferences.mixState ?? {});
            loadMixState();
        }

    };

    const resetGoals = () => {
        nutrientGoals = { ...DEFAULT_NUTRIENT_GOALS };
        selectedGoalTemplateId = "";
        saveNutrientGoals(nutrientGoals);
    };

    const clearIngredients = () => {
        selectedFoodIds = [];
		const emptyServingState = getEmptyServingState();
        servingGrams = emptyServingState.servingGrams;
        servingQuantities = emptyServingState.servingQuantities;
        servingUnits = emptyServingState.servingUnits;
        saveMixState();
    };

    const resetMix = () => {
		assignMixState(getDefaultMixState());
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

    const handleAddNutrient = (nutrientId: string | number) => {
        const nutrient = ALL_NUTRIENTS.find((n) => n.id == nutrientId);
        if (nutrient && !options.some((opt) => opt.id == nutrient.id)) {
            options = [...options, { id: nutrient.id, label: nutrient.label }];
            saveMixState();
        }
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

    const updateGoalTemplateSelection = (templateId: string) => {
        selectedGoalTemplateId = templateId;
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
		assignMixState(
			getStateWithToggledFood(getCurrentMixState(), foodId, allIngredientItems),
		);
        saveMixState();
    };

    const addSuggestedFood = (foodId: number, nextServingGrams: number) => {
		assignMixState(
			getStateWithGramServing(
				getCurrentMixState(),
				foodId,
				nextServingGrams,
				true,
			),
		);
        saveMixState();
    };

    const applySuggestedReduction = (
        foodId: number,
        nextServingGrams: number,
    ) => {
		assignMixState(
			getStateWithGramServing(
				getCurrentMixState(),
				foodId,
				nextServingGrams,
			),
		);
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
		assignMixState(
			getStateWithServingAmount(
				getCurrentMixState(),
				food,
				quantityValue,
				unit,
			),
		);
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
        <SaveGoalReview diffs={saveGoalDiffs} />
    </TextInputDialog>

    <section class="mix-panel" aria-labelledby="nutrient-controls-title">
        <div class="mix-builder">
            <NutrientSelector
                {options}
                {selected}
                {selectedCount}
                onChange={handleChange}
                onAddNutrient={handleAddNutrient}
            />

            <GoalTargets
                {selectedNutrients}
                {nutrientGoals}
                {selectedGoalTemplateId}
                onTemplateChange={updateGoalTemplateSelection}
                onApplyTemplate={applyGoalTemplate}
                onUpdateGoal={updateGoal}
                getGoal={getDefaultNutrientGoal}
                getTotal={getNutrientTotal}
            />

            <IngredientChooser
                {fridgeItems}
                {shoppingItems}
                {selectedFoodIds}
                onToggleFood={toggleFood}
            />

            {#if selectedFoods.length > 0}
                <SelectedIngredientsPanel
                    {selectedFoods}
                    {fridgeItems}
                    {selectedNutrients}
                    {servingGrams}
                    {getServingQuantity}
                    {getServingUnit}
                    {getServingConversion}
                    {getServingConversionWarning}
                    onRemove={toggleFood}
                    onServingChange={updateServingAmount}
                />
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
            font-size: $app-font-size-sm;
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

    .mix-panel {
        padding: $app-gap-sm;
        background: $app-section-bg;
        border: $app-border;
        border-radius: $app-card-radius;
        box-shadow: $app-box-shadow;
    }

    .mix-builder {
        display: grid;
        grid-template-columns: 1fr;
        align-items: stretch;
        gap: $app-gap-sm;
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

    @media (max-width: $app-breakpoint-md) {
        .mix-page {
            padding-top: $app-gap-sm;
        }

        .mix-header {
            display: grid;
        }

        .reset-actions {
            justify-content: flex-start;
        }

    }
</style>
