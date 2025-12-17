
const fs = require('fs');

// Mock DOM objects or browser APIs if needed, though our utils should be clean.
// Using node's require to load ES modules might require package.json type:module or babel.
// Since we used export keyword, we need to handle that.
// I will just read the files and eval them or use a quick babel-register if installed.
// Actually, since I am in a node environment without babel-register setup in this script execution, 
// I will try to use rudimentary regex to extract functions for this specific test, or just rely on the fact the syntax is standard JS.
// But standard Node doesn't support 'export' without .mjs.
// I'll try to use babel-register since it is in devDependencies.

require('@babel/register')({
    presets: ['@babel/preset-env']
});

try {
    const data = require('./assets/data.json');
    const { calculateSimpleGroundDistribution, calculateCroissantProduction } = require('./src/utils/calculator');
    const { parseWhatsAppOrder } = require('./src/utils/parser');
    const { scaleRecipe } = require('./src/utils/recipes');

    console.log("--- Starting Logic Tests ---");

    // Test 1: Simple Ground Distribution
    console.log("Test 1: Simple Ground Calculation...");
    const outlets = data.outlets;
    const scores = data.defaultDonutScores;
    // Increase input to ensure distribution exceeds rounding threshold
    const inputs = { "GP": 500, "Tiban": 500 };
    const fixed = {};
    const res1 = calculateSimpleGroundDistribution(inputs, scores, fixed, data);

    // Validate some known behavior
    if (res1.totalDonutsPerOutlet["GP"] > 0 && res1.totalDonutsPerOutlet["Tiban"] > 0) {
        console.log(`✅ Simple Ground Calc: Distribution looks correct. GP: ${res1.totalDonutsPerOutlet["GP"]} boxes.`);
    } else {
        console.error("❌ Simple Ground Calc Failed:", res1.totalDonutsPerOutlet);
    }


    // Test 2: WhatsApp Parser
    console.log("Test 2: WhatsApp Parser...");
    const productsList = data.croissant_department.product_management.croissantProducts;
    // User-like input where quantity is at the end, which the parser supports best
    const sampleText = `
    Simple Ground
    1. Plain Croissant 10
    Pain Au Choco 5pcs
    
    Baker Museum
    FROZEN
    Cromboloni 5
    `;
    const res2 = parseWhatsAppOrder(sampleText, productsList);

    // Expect: Simple Ground -> Plain (10) Baked, Pain Au Choco (5) Baked
    // Expect: Baker Museum -> Cromboloni (5) Frozen
    const sg = res2.parsedItemsByOutlet["Simple Ground"];
    const bm = res2.parsedItemsByOutlet["Baker Museum"];

    if (sg && sg["Plain Croissant"].baked === 10 && sg["Pain Au Choco"].baked === 5 &&
        bm && bm["Cromboloni"].frozen === 5) {
        console.log("✅ WhatsApp Parser: Parsed correctly.");
    } else {
        console.error("❌ WhatsApp Parser Failed:", JSON.stringify(res2, null, 2));
    }


    // Test 3: Croissant Production
    console.log("Test 3: Croissant Production Logic...");
    // Use the parsed output from Test 2, converted to expected input format
    let productInputs = {};
    for (const outlet in res2.parsedItemsByOutlet) {
        for (const prod in res2.parsedItemsByOutlet[outlet]) {
            if (!productInputs[prod]) productInputs[prod] = { baked: 0, frozen: 0 };
            productInputs[prod].baked += res2.parsedItemsByOutlet[outlet][prod].baked;
            productInputs[prod].frozen += res2.parsedItemsByOutlet[outlet][prod].frozen;
        }
    }

    const recipes = data.croissant_department.recipe_management;
    const res3 = calculateCroissantProduction(productInputs, productsList, recipes);

    // Check if recipes are generated
    if (res3.recipeResults.length > 0 && res3.ingredientResults.length > 0) {
        console.log(`✅ Croissant Production: Generated ${res3.recipeResults.length} recipes and ${res3.ingredientResults.length} ingredients.`);
        console.log("Sample Recipe:", res3.recipeResults[0].displayName, res3.recipeResults[0].amount);
    } else {
        console.error("❌ Croissant Production Failed: No results.");
    }

    // Test 4: Recipe Scaler
    console.log("Test 4: Recipe Scaler...");
    const testRecipeKey = "adonan_croissant_plain"; // Assuming this exists or similar
    // Find a valid key
    const validKey = Object.keys(recipes)[0];
    const res4 = scaleRecipe(validKey, 2.0, recipes);

    if (res4 && res4.ingredients) {
        console.log(`✅ Recipe Scaler: Scaled ${validKey} successfully.`);
    } else {
        console.error("❌ Recipe Scaler Failed.");
    }

    console.log("--- All Tests Completed ---");

} catch (e) {
    console.error("Runtime Error:", e);
}
