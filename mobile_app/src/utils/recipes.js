
export function scaleRecipe(recipeKey, multiplier, recipes) {
    if (!recipeKey || !recipes[recipeKey]) return null;

    const recipe = recipes[recipeKey];
    const ingredients = [];

    if (recipe.ingredients) {
        for (const [name, details] of Object.entries(recipe.ingredients)) {
            ingredients.push({
                name: name.replace(/_/g, ' '),
                amount: details.amount * multiplier,
                unit: details.unit
            });
        }
    } else {
        // Direct ingredient list
        for (const [key, value] of Object.entries(recipe)) {
            if (key !== "base_weight" && typeof value === 'object' && value !== null && 'amount' in value) {
                ingredients.push({
                    name: key.replace(/_/g, ' '),
                    amount: value.amount * multiplier,
                    unit: value.unit
                });
            }
        }
    }

    const instructionsKey = recipeKey + "_instructions";
    const instructions = recipes[instructionsKey] || [];

    return {
        ingredients,
        instructions
    };
}
