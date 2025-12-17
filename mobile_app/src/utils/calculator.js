
// --- Simple Ground Calculator Logic ---

export function calculateSimpleGroundDistribution(outletOrders, donutScores, bomboloniFixedAmounts, data) {
    const {
        donutProducts,
        BOMBOLONI_KARAKTER_PRODUCT_NAME,
        outlets,
        constants
    } = data;

    const DONUTS_PER_BOX = constants.DONUTS_PER_BOX;
    const distributableDonutProducts = donutProducts.filter(product => product !== BOMBOLONI_KARAKTER_PRODUCT_NAME);

    let distributionResults = {};
    let totalDonutsPerOutlet = {}; // In boxes
    let totalPcsPerOutlet = {}; // In pcs for internal tracking if needed, though boxes is primary for logic

    outlets.forEach(outlet => {
        distributionResults[outlet] = {};
        totalDonutsPerOutlet[outlet] = 0;

        // 1. Handle Bomboloni Karakter fixed amount
        const bomboloniKarakterPcs = bomboloniFixedAmounts[outlet] || 0;
        const bomboloniKarakterBoxes = bomboloniKarakterPcs / DONUTS_PER_BOX; // No rounding
        distributionResults[outlet][BOMBOLONI_KARAKTER_PRODUCT_NAME] = bomboloniKarakterBoxes;
        totalDonutsPerOutlet[outlet] += bomboloniKarakterBoxes;

        // 2. Calculate remaining orders
        const totalOutletOrderPcs = outletOrders[outlet] || 0;
        let remainingOutletOrdersPcs = Math.max(0, totalOutletOrderPcs - bomboloniKarakterPcs);

        let totalScoreForOutlet = 0;
        distributableDonutProducts.forEach(product => {
            totalScoreForOutlet += (donutScores[product] && donutScores[product][outlet]) ? donutScores[product][outlet] : 0;
        });

        if (totalScoreForOutlet > 0) {
            distributableDonutProducts.forEach(product => {
                const score = (donutScores[product] && donutScores[product][outlet]) ? donutScores[product][outlet] : 0;
                const proportion = score / totalScoreForOutlet;
                // This logic exactly mirrors the web app:
                const distributedPcs = remainingOutletOrdersPcs * proportion;
                const distributedBoxes = Math.round(distributedPcs / DONUTS_PER_BOX);
                distributionResults[outlet][product] = distributedBoxes;
                totalDonutsPerOutlet[outlet] += distributedBoxes;
            });
        } else {
            // Even distribution backup logic
            const numDistributable = distributableDonutProducts.length;
            if (numDistributable > 0) {
                const distributedPcs = remainingOutletOrdersPcs / numDistributable;
                const distributedBoxes = Math.round(distributedPcs / DONUTS_PER_BOX);
                distributableDonutProducts.forEach(product => {
                    distributionResults[outlet][product] = distributedBoxes;
                    totalDonutsPerOutlet[outlet] += distributedBoxes;
                });
            }
        }
    });

    // Calculate Grand Totals and Weights
    let grandTotalBoxes = 0;

    // Summing grand totals
    Object.values(totalDonutsPerOutlet).forEach(val => grandTotalBoxes += val);

    // Calculate weights for Adonan/Loyang/Trolley
    // Note: The web app recalculates this dynamically based on the *current* input values if they change.
    // Ideally this function is called whenever inputs change.
    // However, the web app's initial "Calculate" button logic uses the calculated distributionResults.
    // The "updateTotals" function in web app uses the input *values* (which might be manually adjusted).
    // For this utility, we will return the distributionResults. 
    // If the UI allows manual adjustment, a separate re-calculation might be needed or this called again with "fixed" overrides.
    // For simplicity, we calculate the totals based on the results we just generated.

    let totalDonutWeight = 0;
    let totalBomboloniWeight = 0;

    donutProducts.forEach(product => {
        const productWeightPerPcs = product.startsWith("Bomboloni") ? constants.BOMBOLONI_WEIGHT_PER_PCS : constants.DONUT_WEIGHT_PER_PCS;
        outlets.forEach(outlet => {
            const boxes = distributionResults[outlet][product] || 0;
            const pcs = boxes * DONUTS_PER_BOX;

            if (product === BOMBOLONI_KARAKTER_PRODUCT_NAME) {
                // For Bomboloni Karakter, strict weight based on pcs input (fixed amount)
                totalBomboloniWeight += (bomboloniFixedAmounts[outlet] || 0) * productWeightPerPcs;
            } else if (product.startsWith("Bomboloni")) {
                totalBomboloniWeight += pcs * productWeightPerPcs;
            } else {
                totalDonutWeight += pcs * productWeightPerPcs;
            }
        });
    });

    const grandTotalWeight = totalDonutWeight + totalBomboloniWeight;
    const baseWeight = data.recipes.adonan_donut_simple_ground.base_weight;

    const totalAdonan = (grandTotalWeight > 0 && baseWeight > 0) ? (grandTotalWeight / baseWeight) : 0;
    const grandTotalPcs = grandTotalBoxes * DONUTS_PER_BOX;
    const totalLoyang = grandTotalPcs / constants.PCS_PER_LOYANG;
    const totalTrolley = totalLoyang / constants.LOYANG_PER_TROLLEY;

    return {
        distributionResults, // { Outlet: { Product: Boxes } }
        totalDonutsPerOutlet, // { Outlet: TotalBoxes }
        grandTotalBoxes,
        grandTotalPcs,
        totalAdonan,
        totalLoyang,
        totalTrolley
    };
}


// --- Croissant Calculator Logic ---

/*
 * productInputSummary: { "ProductName": { baked: number, frozen: number } }
 * productsList: Array of product objects
 * recipes: Object of recipes
 */
export function calculateCroissantProduction(productInputSummary, productsList, recipes) {
    let totalResepMap = {};

    function calculateTotalRecipeResep(recipeKey, resepMultiplier) {
        const recipe = recipes[recipeKey];
        if (!recipe) return;

        if (!totalResepMap[recipeKey]) totalResepMap[recipeKey] = 0;
        totalResepMap[recipeKey] += resepMultiplier;

        if (recipe.ingredients) {
            for (const ingredientRaw in recipe.ingredients) {
                const details = recipe.ingredients[ingredientRaw];
                const ingredientKey = ingredientRaw.replace(/ /g, '_').toLowerCase();

                if (recipes[ingredientKey]) {
                    // Sub-recipe recursion
                    const subRecipe = recipes[ingredientKey];
                    const amountNeeded = details.amount;
                    const subRecipeBaseWeight = subRecipe.base_weight;

                    if (details.unit === "pcs") {
                        // Variant factor logic from web app:
                        // "Apply variantFactor to the amount if it's a direct piece count for a sub-recipe that represents a final product"
                        // In strict porting, the web app uses `subRecipe.variants.baked.base_weight_factor` assuming baked if not specified.
                        const variantFactor = (subRecipe.variants && subRecipe.variants.baked) ? subRecipe.variants.baked.base_weight_factor : 1.0;
                        const effectiveAmount = amountNeeded * variantFactor;
                        const subRecipeResep = effectiveAmount * resepMultiplier;
                        calculateTotalRecipeResep(ingredientKey, subRecipeResep);
                    } else if (subRecipeBaseWeight && subRecipeBaseWeight > 0) {
                        const subRecipeResep = (amountNeeded / subRecipeBaseWeight) * resepMultiplier;
                        calculateTotalRecipeResep(ingredientKey, subRecipeResep);
                    }
                }
            }
        }
    }

    // 1. Process Product Inputs
    for (const productName in productInputSummary) {
        const summary = productInputSummary[productName];
        const productObj = productsList.find(p => p.name === productName);

        if (!productObj) continue;

        if (summary.baked > 0) {
            let recipeKey = productObj.recipe_key_baked || productObj.recipe_key;
            const factor = productObj.variants?.baked?.base_weight_factor || 1.0;
            if (recipeKey) {
                calculateTotalRecipeResep(recipeKey, summary.baked * factor);
            }
        }

        if (summary.frozen > 0) {
            let recipeKey = productObj.recipe_key_frozen || productObj.recipe_key;
            const factor = productObj.variants?.frozen?.base_weight_factor || 1.0;
            if (recipeKey) {
                calculateTotalRecipeResep(recipeKey, summary.frozen * factor);
            }
        }
    }

    // 2. Sorting
    const sortedRecipeKeys = Object.keys(totalResepMap).sort((a, b) => {
        const getPriority = (key) => {
            const k = key.toLowerCase();
            if (k.includes('adonan')) return 4;
            if (k.includes('laminasi')) return 3;
            if (k.includes('filling') || k.includes('topping') || k.includes('sauce') || k.includes('cream')) return 2;
            return 1;
        };
        const pA = getPriority(a);
        const pB = getPriority(b);
        if (pA !== pB) return pA - pB;
        return a.localeCompare(b);
    });

    const simpleRecipeResults = sortedRecipeKeys
        .filter(key => totalResepMap[key] > 0)
        .map(key => {
            // Find display name logic
            const product = productsList.find(p => p.recipe_key === key || p.recipe_key_baked === key || p.recipe_key_frozen === key);
            let displayName = key.replace(/_/g, ' ');
            if (product) {
                if (product.recipe_key_baked === key) displayName = `${product.name} (Baked)`;
                else if (product.recipe_key_frozen === key) displayName = `${product.name} (Frozen)`;
                else displayName = product.name;
            }
            return {
                key: key,
                displayName: displayName,
                amount: totalResepMap[key]
            };
        });

    // 3. Aggregate Ingredients
    let aggregatedIngredients = {};

    function aggregateBaseIngredients(recipeKey, totalResep) {
        const recipe = recipes[recipeKey];
        if (!recipe || !recipe.ingredients) return;

        for (const ingredientRaw in recipe.ingredients) {
            const details = recipe.ingredients[ingredientRaw];
            const ingredientKey = ingredientRaw.replace(/ /g, '_').toLowerCase();

            // If NOT a sub-recipe, it's a base ingredient
            if (!recipes[ingredientKey]) {
                const amount = details.amount * totalResep;
                if (!aggregatedIngredients[ingredientRaw]) {
                    aggregatedIngredients[ingredientRaw] = { amount: 0, unit: details.unit };
                }
                aggregatedIngredients[ingredientRaw].amount += amount;
            }
        }
    }

    for (const key in totalResepMap) {
        if (totalResepMap[key] > 0) {
            aggregateBaseIngredients(key, totalResepMap[key]);
        }
    }

    const ingredientResults = Object.keys(aggregatedIngredients).map(name => ({
        name: name,
        amount: aggregatedIngredients[name].amount,
        unit: aggregatedIngredients[name].unit
    }));

    return {
        recipeResults: simpleRecipeResults,
        ingredientResults: ingredientResults
    };
}
