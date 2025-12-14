// Global variables to store data from JSON
let BOMBOLONI_KARAKTER_PRODUCT_NAME;
let donutProducts;
let distributableDonutProducts;
let defaultDonutScores;
let outlets;
let DONUTS_PER_BOX;
let DONUT_WEIGHT_PER_PCS;
let BOMBOLONI_WEIGHT_PER_PCS;
let PCS_PER_LOYANG;
let LOYANG_PER_TROLLEY;
let recipes;
let croissantProductsList = []; // New global variable for croissant products, initialize as empty array
let croissantRecipes = {};     // New global variable for croissant recipes, initialize as empty object
let intermediateRecipeKeysForScaler = []; // Global variable for scaler exclusions
let rawCroissantProducts = []; // Global variable for raw croissant products

// Global variable to keep track of the active department
let activeDepartment = 'simple-ground'; // Default active department

// Department Selection Function
function selectDepartment(departmentId) {
    activeDepartment = departmentId;

    // Hide all department navigation buttons
    document.getElementById('simple-ground-nav-buttons').style.display = 'none';
    document.getElementById('croissant-nav-buttons').style.display = 'none';

    // Show relevant navigation buttons for the selected department
    document.getElementById(departmentId + '-nav-buttons').style.display = 'flex';

    // Determine the currently active main page (not the department-specific sub-pages)
    let currentActiveMainPageId = 'production-calculator'; // Default to production calculator
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        if (activePage.id === 'production-calculator-page') {
            currentActiveMainPageId = 'production-calculator';
        } else {
            currentActiveMainPageId = activePage.id.replace('-page', '');
        }
    }

    // Now show the current active main page, but with the new department context
    showPage(currentActiveMainPageId, departmentId);

    // Immediately re-populate recipes when department changes
    populateRecipes(departmentId);
    if (document.getElementById('recipe-page').classList.contains('active')) {
        refreshRecipeScalerContent();
    }
}

// Page Navigation Function
function showPage(pageId, department) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Handle the specific production calculator page
    if (pageId === 'production-calculator') {
        document.getElementById('production-calculator-page').classList.add('active');

        // Hide all internal calculator contents
        document.getElementById('simple-ground-calculator-content').style.display = 'none';
        document.getElementById('croissant-calculator-content').style.display = 'none';

        // Show the specific calculator content based on the selected department
        if (department === 'simple-ground') {
            document.getElementById('simple-ground-calculator-content').style.display = 'block';
        } else if (department === 'croissant') {
            document.getElementById('croissant-calculator-content').style.display = 'block';
        }
    } else {
        // Show other pages
        document.getElementById(pageId + '-page').classList.add('active');
    }

    // Update nav buttons for the current department
    document.querySelectorAll(`.nav-buttons .nav-button`).forEach(button => {
        button.classList.remove('active');
        const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/showPage\('([^']+)',\s*'([^']+)'\)/);
            if (match && match[1] === pageId && match[2] === department) {
                button.classList.add('active');
            }
        }
    });

    // If navigating to the recipe scaler page, re-populate recipes and trigger a scale
    if (pageId === 'recipe') {
        refreshRecipeScalerContent();
    }
}

// Fetch data and initialize the application
async function initializeApp() {
    try {
        const response = await fetch('data/data.json');
        const data = await response.json();

        // Assign data to global variables
        BOMBOLONI_KARAKTER_PRODUCT_NAME = data.BOMBOLONI_KARAKTER_PRODUCT_NAME;
        donutProducts = data.donutProducts;
        distributableDonutProducts = donutProducts.filter(product => product !== BOMBOLONI_KARAKTER_PRODUCT_NAME);
        defaultDonutScores = data.defaultDonutScores;
        outlets = data.outlets;
        DONUTS_PER_BOX = data.constants.DONUTS_PER_BOX;
        DONUT_WEIGHT_PER_PCS = data.constants.DONUT_WEIGHT_PER_PCS;
        BOMBOLONI_WEIGHT_PER_PCS = data.constants.BOMBOLONI_WEIGHT_PER_PCS;
        PCS_PER_LOYANG = data.constants.PCS_PER_LOYANG;
        LOYANG_PER_TROLLEY = data.constants.LOYANG_PER_TROLLEY;
        recipes = data.recipes; // Top-level recipes

        console.log('Data loaded:', data); // Debugging: log full data

        // Assign department-specific data to global variables
        rawCroissantProducts = data.croissant_department.product_management.croissantProducts; // Assign to global variable
        croissantRecipes = data.croissant_department.recipe_management;

        // Define a list of recipe keys that correspond to intermediate products to exclude from the calculator inputs
        const intermediateRecipeKeys = [
            "adonan_original", "adonan_charcoal", "adonan_brioche", "adonan_puff_pastry",
            "laminasi_original", "laminasi_charcoal", "laminasi_kouign_amann", "laminasi_puff_pastry"
        ];

        // Define a list of recipe keys that correspond to items to EXCLUDE from the recipe scaler dropdown.
        intermediateRecipeKeysForScaler = [ // Assign to global variable
            // Only include true intermediate recipes here
        ];

        // Filter croissantProductsList to only include final products (objects) for the calculator
        croissantProductsList = rawCroissantProducts.filter(productObj => {
            // Check if the product's primary recipe_key (or baked/frozen recipe_keys if applicable) is in the intermediate list
            const recipeKeysToCheck = [];
            if (productObj.recipe_key) {
                recipeKeysToCheck.push(productObj.recipe_key);
            }
            if (productObj.recipe_key_baked) {
                recipeKeysToCheck.push(productObj.recipe_key_baked);
            }
            if (productObj.recipe_key_frozen) {
                recipeKeysToCheck.push(productObj.recipe_key_frozen);
            }

            // A product is intermediate if any of its associated recipe keys are in the intermediateRecipeKeys list.
            return !recipeKeysToCheck.some(key => intermediateRecipeKeys.includes(key));
        });

        console.log('Filtered Croissant Products List (Final Products):', croissantProductsList); // Debugging
        console.log('Croissant Recipes:', croissantRecipes);           // Debugging
        console.log('Intermediate Recipe Keys for Scaler:', intermediateRecipeKeysForScaler); // Debugging

        // Initialize all parts of the application
        initializeCalculator();
        initializeRecipeScaler();
        initializeSettings();
        initializeCroissantCalculator(); // Initialize the croissant calculator

        // Set default department and page after initializations
        selectDepartment('simple-ground');
        showPage('production-calculator', 'simple-ground');
    } catch (error) {
        console.error('Error loading application data:', error);
        // Display an error message to the user
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = '<h1>Error</h1><p>Could not load application data. Please try again later. Check console for details.</p>';
        }
    }
}

// Initialize with calculator page
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();

    // Add event listener for the new department dropdown
    const departmentSelect = document.getElementById('department-select');
    if (departmentSelect) {
        departmentSelect.addEventListener('change', function () {
            selectDepartment(this.value);
        });
    }
});

// Calculator Page Script
function initializeCalculator() {
    const items = [
        "Tiban", "GP", "MTC", "Piayu", "BA"
    ];

    const inputFields = document.getElementById("inputFields");

    // Create input fields for outlets (MTC, BENGKONG, TIBAN, PIAYU)
    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "form-group";
        div.innerHTML = `
                        <label for="${item}">${item.replace(/_/g, ' ')} Outlet:</label>
                        <input type="number" id="${item}" name="${item}" placeholder="0" min="0"/>
                    `;
        inputFields.appendChild(div);
    });

    // Add calculate button event listener
    document.getElementById("calculate").addEventListener("click", function () {
        let outletTotalOrders = {};
        outlets.forEach(outlet => {
            outletTotalOrders[outlet] = parseFloat(document.getElementById(outlet).value) || 0;
        });

        const donutScores = JSON.parse(localStorage.getItem('donutScores')) || {};
        const bomboloniKarakterFixedAmounts = JSON.parse(localStorage.getItem('bomboloniKarakterFixedAmounts')) || {};
        let distributionResults = {};
        let totalDonutsPerOutlet = {};

        outlets.forEach(outlet => {
            distributionResults[outlet] = {};
            totalDonutsPerOutlet[outlet] = 0;

            // 1. Handle Bomboloni Karakter fixed amount first
            const bomboloniKarakterPcs = bomboloniKarakterFixedAmounts[outlet] || 0;
            const bomboloniKarakterBoxes = bomboloniKarakterPcs / DONUTS_PER_BOX; // NO rounding here
            distributionResults[outlet][BOMBOLONI_KARAKTER_PRODUCT_NAME] = bomboloniKarakterBoxes;
            totalDonutsPerOutlet[outlet] += bomboloniKarakterBoxes;

            // 2. Calculate remaining orders for score-based distribution
            let remainingOutletOrdersPcs = Math.max(0, outletTotalOrders[outlet] - bomboloniKarakterPcs);

            let totalScoreForOutlet = 0;
            distributableDonutProducts.forEach(product => {
                totalScoreForOutlet += (donutScores[product] && donutScores[product][outlet]) ? donutScores[product][outlet] : 0;
            });

            if (totalScoreForOutlet > 0) {
                distributableDonutProducts.forEach(product => {
                    const score = (donutScores[product] && donutScores[product][outlet]) ? donutScores[product][outlet] : 0;
                    const proportion = score / totalScoreForOutlet;
                    const distributedPcs = remainingOutletOrdersPcs * proportion;
                    const distributedBoxes = Math.round(distributedPcs / DONUTS_PER_BOX); // Round other donuts
                    distributionResults[outlet][product] = distributedBoxes;
                    totalDonutsPerOutlet[outlet] += distributedBoxes; // Sum of boxes
                });
            } else {
                // If no scores are set for an outlet, distribute remaining evenly or as 0
                const numDistributableDonutProducts = distributableDonutProducts.length;
                if (numDistributableDonutProducts > 0) {
                    const distributedPcs = remainingOutletOrdersPcs / numDistributableDonutProducts;
                    const distributedBoxes = Math.round(distributedPcs / DONUTS_PER_BOX); // Round other donuts
                    distributableDonutProducts.forEach(product => {
                        distributionResults[outlet][product] = distributedBoxes;
                        totalDonutsPerOutlet[outlet] += distributedBoxes; // Sum of boxes
                    });
                }
            }
        });

        // Display results
        let resultHTML = `<h2>Donut Distribution</h2>`;
        resultHTML += `
                    <table>
                        <thead>
                            <tr>
                                <th>Donut Product</th>
                                ${outlets.map(outlet => `<th>${outlet}</th>`).join("")}
                                <th>Ttl</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

        donutProducts.forEach(product => {
            resultHTML += `<tr><td>${product.replace(/_/g, ' ')}</td>`;
            let productTotalBoxes = 0;
            outlets.forEach(outlet => {
                const value = distributionResults[outlet][product] || 0;
                let inputHtml = '';
                if (product === BOMBOLONI_KARAKTER_PRODUCT_NAME) {
                    // Display Bomboloni Karakter in pieces
                    const fixedPcs = (value * DONUTS_PER_BOX).toFixed(0);
                    inputHtml = `<input type="number" class="adjustment-input" data-product="${product}" data-outlet="${outlet}" value="${fixedPcs}" min="0" disabled>`;
                } else {
                    inputHtml = `<input type="number" class="adjustment-input" data-product="${product}" data-outlet="${outlet}" value="${value.toFixed(0)}" min="0">`;
                }
                resultHTML += `<td>${inputHtml}</td>`;
                productTotalBoxes += value;
            });
            resultHTML += `<td class="product-total-boxes" data-product="${product}">${productTotalBoxes.toFixed(0)}</td>`;
            resultHTML += `</tr>`;
        });

        // Calculate Grand Total (in Boxes)
        const grandTotalDonuts = Object.values(totalDonutsPerOutlet).reduce((sum, total) => sum + total, 0);

        // Add a row for total donuts per outlet (in Boxes)
        resultHTML += `
                            <tr style="font-weight: bold;">
                                <td>Total Boxes</td>
                                ${outlets.map(outlet => `<td class="total-donuts-outlet" data-outlet="${outlet}">${totalDonutsPerOutlet[outlet].toFixed(1)}</td>`).join("")}
                            </tr>
                            <tr style="font-weight: bold;">
                                <td>Total PCS</td>
                                ${outlets.map(outlet => `<td class="total-pcs-outlet" data-outlet="${outlet}">${Math.round(totalDonutsPerOutlet[outlet] * DONUTS_PER_BOX).toFixed(0)}</td>`).join("")}
                            </tr>
                            <tr style="font-weight: bold; background: rgba(0, 0, 0, 0.1);">
                                <td>Grand Total Boxes</td>
                                <td colspan="${outlets.length + 1}" style="text-align: right;" id="grand-total-donuts">${grandTotalDonuts.toFixed(1)}</td>
                            </tr>
                            <tr style="font-weight: bold; background: rgba(0, 0, 0, 0.1);">
                                <td>Grand Total PCS</td>
                                <td colspan="${outlets.length + 1}" style="text-align: right;" id="grand-total-pcs">${Math.round(grandTotalDonuts * DONUTS_PER_BOX).toFixed(0)}</td>
                            </tr>
                            <tr style="font-weight: bold; background: rgba(0, 0, 0, 0.1);">
                                <td>Total Adonan</td>
                                <td colspan="${outlets.length + 1}" style="text-align: right;" id="total-adonan-calculator">0 resep</td>
                            </tr>
                            <tr style="font-weight: bold; background: rgba(0, 0, 0, 0.1);">
                                <td>Total Loyang</td>
                                <td colspan="${outlets.length + 1}" style="text-align: right;" id="total-loyang-calculator">0 loyang</td>
                            </tr>
                            <tr style="font-weight: bold; background: rgba(0, 0, 0, 0.1);">
                                <td>Total Trolley</td>
                                <td colspan="${outlets.length + 1}" style="text-align: right;" id="total-trolley-calculator">0 trolley</td>
                            </tr>
                        </tbody>
                    </table>
                `;

        document.getElementById("result").innerHTML = resultHTML;

        // Initial calculation of Total Adonan, Loyang, and Trolley for calculator
        const initialGrandTotalPcs = grandTotalDonuts * DONUTS_PER_BOX; // Re-added this line
        let initialTotalDonutWeight = 0;
        let initialTotalBomboloniWeight = 0;

        donutProducts.forEach(product => {
            const productWeightPerPcs = product.startsWith("Bomboloni") ? BOMBOLONI_WEIGHT_PER_PCS : DONUT_WEIGHT_PER_PCS;
            outlets.forEach(outlet => {
                const boxes = distributionResults[outlet][product] || 0;
                const pcs = boxes * DONUTS_PER_BOX;
                if (product === BOMBOLONI_KARAKTER_PRODUCT_NAME) {
                    initialTotalBomboloniWeight += (bomboloniKarakterFixedAmounts[outlet] || 0) * productWeightPerPcs;
                } else if (product.startsWith("Bomboloni")) {
                    initialTotalBomboloniWeight += pcs * productWeightPerPcs;
                } else {
                    initialTotalDonutWeight += pcs * productWeightPerPcs;
                }
            });
        });
        const initialGrandTotalWeight = initialTotalDonutWeight + initialTotalBomboloniWeight;
        const baseWeightCalculator = recipes.adonan_donut_simple_ground.base_weight;
        let initialTotalAdonan = 0;
        if (initialGrandTotalWeight > 0 && baseWeightCalculator > 0) {
            initialTotalAdonan = initialGrandTotalWeight / baseWeightCalculator;
        }
        document.getElementById("total-adonan-calculator").textContent = `${initialTotalAdonan.toFixed(1)} resep`;

        const initialTotalLoyang = initialGrandTotalPcs / PCS_PER_LOYANG;
        document.getElementById("total-loyang-calculator").textContent = `${initialTotalLoyang.toFixed(1)} loyang`;

        const initialTotalTrolley = initialTotalLoyang / LOYANG_PER_TROLLEY;
        document.getElementById("total-trolley-calculator").textContent = `${initialTotalTrolley.toFixed(1)} trolley`;


        // Add event listeners for dynamic adjustments
        document.querySelectorAll('.adjustment-input').forEach(input => {
            input.addEventListener('input', updateTotals);
        });

        function updateTotals() {
            let newTotalBoxesPerOutlet = {};
            let newGrandTotalBoxes = 0;
            let newTotalPcsPerOutlet = {};
            let newGrandTotalPcs = 0;

            outlets.forEach(outlet => {
                newTotalBoxesPerOutlet[outlet] = 0;
                newTotalPcsPerOutlet[outlet] = 0;
            });

            outlets.forEach(outlet => {
                newTotalBoxesPerOutlet[outlet] = 0;
                newTotalPcsPerOutlet[outlet] = 0;
            });

            donutProducts.forEach(product => {
                outlets.forEach(outlet => {
                    const inputElement = document.querySelector(`.adjustment-input[data-product="${product}"][data-outlet="${outlet}"]`);
                    let adjustedBoxes = 0;
                    if (product === BOMBOLONI_KARAKTER_PRODUCT_NAME) {
                        // For Bomboloni Karakter, use the fixed amount from localStorage (converted to boxes)
                        const bomboloniKarakterFixedAmounts = JSON.parse(localStorage.getItem('bomboloniKarakterFixedAmounts')) || {};
                        adjustedBoxes = (bomboloniKarakterFixedAmounts[outlet] || 0) / DONUTS_PER_BOX; // NO rounding here
                    } else {
                        adjustedBoxes = parseFloat(inputElement.value) || 0;
                    }
                    newTotalBoxesPerOutlet[outlet] += Math.max(0, adjustedBoxes);
                    newTotalPcsPerOutlet[outlet] += Math.max(0, adjustedBoxes) * DONUTS_PER_BOX;
                });
            });

            Object.values(newTotalBoxesPerOutlet).forEach(total => {
                newGrandTotalBoxes += total;
            });
            Object.values(newTotalPcsPerOutlet).forEach(total => {
                newGrandTotalPcs += total;
            });

            // Update displayed total boxes for each product
            donutProducts.forEach(product => {
                let productTotalBoxes = 0;
                outlets.forEach(outlet => {
                    const inputElement = document.querySelector(`.adjustment-input[data-product="${product}"][data-outlet="${outlet}"]`);
                    let value = 0;
                    if (product === BOMBOLONI_KARAKTER_PRODUCT_NAME) {
                        const bomboloniKarakterFixedAmounts = JSON.parse(localStorage.getItem('bomboloniKarakterFixedAmounts')) || {};
                        value = (bomboloniKarakterFixedAmounts[outlet] || 0) / DONUTS_PER_BOX; // NO rounding here
                    } else {
                        value = parseFloat(inputElement.value) || 0;
                    }
                    productTotalBoxes += value;
                });
                document.querySelector(`.product-total-boxes[data-product="${product}"]`).textContent = productTotalBoxes.toFixed(0);
            });

            // Calculate and update Total Adonan dynamically
            let currentTotalDonutWeight = 0;
            let currentTotalBomboloniWeight = 0;

            donutProducts.forEach(product => {
                const productWeightPerPcs = product.startsWith("Bomboloni") ? BOMBOLONI_WEIGHT_PER_PCS : DONUT_WEIGHT_PER_PCS;
                outlets.forEach(outlet => {
                    const inputElement = document.querySelector(`.adjustment-input[data-product="${product}"][data-outlet="${outlet}"]`);
                    let boxes = 0;
                    if (product === BOMBOLONI_KARAKTER_PRODUCT_NAME) {
                        const bomboloniKarakterFixedAmounts = JSON.parse(localStorage.getItem('bomboloniKarakterFixedAmounts')) || {};
                        boxes = (bomboloniKarakterFixedAmounts[outlet] || 0) / DONUTS_PER_BOX; // NO rounding here
                    } else {
                        boxes = parseFloat(inputElement.value) || 0;
                    }
                    const pcs = boxes * DONUTS_PER_BOX;
                    if (product === BOMBOLONI_KARAKTER_PRODUCT_NAME) {
                        currentTotalBomboloniWeight += (bomboloniKarakterFixedAmounts[outlet] || 0) * productWeightPerPcs;
                    } else if (product.startsWith("Bomboloni")) {
                        currentTotalBomboloniWeight += pcs * productWeightPerPcs;
                    } else {
                        currentTotalDonutWeight += pcs * productWeightPerPcs;
                    }
                });
            });
            const currentGrandTotalWeight = currentTotalDonutWeight + currentTotalBomboloniWeight;
            const baseWeightCalculator = recipes.adonan_donut_simple_ground.base_weight;
            let newTotalAdonan = 0;
            if (currentGrandTotalWeight > 0 && baseWeightCalculator > 0) {
                newTotalAdonan = currentGrandTotalWeight / baseWeightCalculator;
            }

            // Update displayed totals for boxes
            outlets.forEach(outlet => {
                document.querySelector(`.total-donuts-outlet[data-outlet="${outlet}"]`).textContent = newTotalBoxesPerOutlet[outlet].toFixed(1);
            });
            document.getElementById("grand-total-donuts").textContent = newGrandTotalBoxes.toFixed(1);

            // Update displayed totals for pcs
            outlets.forEach(outlet => {
                document.querySelector(`.total-pcs-outlet[data-outlet="${outlet}"]`).textContent = Math.round(newTotalPcsPerOutlet[outlet]).toFixed(0);
            });
            document.getElementById("grand-total-pcs").textContent = Math.round(newGrandTotalPcs).toFixed(0);

            // Update displayed Total Adonan
            document.getElementById("total-adonan-calculator").textContent = `${newTotalAdonan.toFixed(1)} resep`;

            const newTotalLoyang = newGrandTotalPcs / PCS_PER_LOYANG;
            document.getElementById("total-loyang-calculator").textContent = `${newTotalLoyang.toFixed(1)} loyang`;

            const newTotalTrolley = newTotalLoyang / LOYANG_PER_TROLLEY;
            document.getElementById("total-trolley-calculator").textContent = `${newTotalTrolley.toFixed(1)} trolley`;
        }
    });
}

// Croissant Calculator Page Script (New Function)
function initializeCroissantCalculator() {
    const croissantInputFieldsDiv = document.getElementById('croissantInputFields');
    const calculateCroissantButton = document.getElementById('calculateCroissant');
    const croissantRecipeOutputDiv = document.getElementById('croissantRecipeOutput');
    const croissantIngredientOutputDiv = document.getElementById('croissantIngredientOutput');

    console.log('Initializing Croissant Calculator...'); // Debugging
    console.log('Croissant Products for inputs:', croissantProductsList); // Debugging

    // Generate input fields for each croissant product
    croissantInputFieldsDiv.innerHTML = ''; // Clear existing content

    // Add a header row for "Baked" and "Frozen"
    const headerRow = document.createElement('div');
    headerRow.className = 'croissant-header-row';
    headerRow.innerHTML = `
                <div class="croissant-product-label-header">Product</div>
                <div class="croissant-input-group-header">Baked</div>
                <div class="croissant-input-group-header">Frozen</div>
            `;
    croissantInputFieldsDiv.appendChild(headerRow);

    // Utility to format product names into valid HTML IDs
    const formatProductNameForId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    croissantProductsList.forEach(productObj => {
        const productContainer = document.createElement('div');
        productContainer.className = 'croissant-product-input-line';

        const formattedName = formatProductNameForId(productObj.name);

        productContainer.innerHTML = `
                    <label class="croissant-product-label">${productObj.name}:</label>
                    <div class="croissant-input-group">
                        <input type="number" id="croissant-${formattedName}-baked" name="croissant-${formattedName}-baked" placeholder="0" min="0"/>
                    </div>
                    <div class="croissant-input-group">
                        <input type="number" id="croissant-${formattedName}-frozen" name="croissant-${formattedName}-frozen" placeholder="0" min="0"/>
                    </div>
                `;
        croissantInputFieldsDiv.appendChild(productContainer);
    });

    calculateCroissantButton.addEventListener('click', function () {
        const croissantProductOutputDiv = document.getElementById('croissantProductOutput');
        let productInputSummary = {}; // Stores total baked and frozen quantities per product

        // Gather input for each product (baked and frozen)
        croissantProductsList.forEach(productObj => {
            const formattedName = formatProductNameForId(productObj.name);
            const inputBakedId = `croissant-${formattedName}-baked`;
            const inputFrozenId = `croissant-${formattedName}-frozen`;

            const inputBakedElement = document.getElementById(inputBakedId);
            const inputFrozenElement = document.getElementById(inputFrozenId);

            const quantityBaked = parseFloat(inputBakedElement.value) || 0;
            const quantityFrozen = parseFloat(inputFrozenElement.value) || 0;

            if (quantityBaked > 0 || quantityFrozen > 0) {
                productInputSummary[productObj.name] = {
                    baked: quantityBaked,
                    frozen: quantityFrozen,
                    total: quantityBaked + quantityFrozen
                };
            }
        });

        // Display Product Input Summary (pcs)
        let productOutputHTML = `<table><thead><tr><th>Product</th><th>Baked (pcs)</th><th>Frozen (pcs)</th><th>Total (pcs)</th></tr></thead><tbody>`;
        for (const productName in productInputSummary) {
            const summary = productInputSummary[productName];
            productOutputHTML += `<tr><td>${productName.replace(/_/g, ' ')}</td><td>${summary.baked.toFixed(0)}</td><td>${summary.frozen.toFixed(0)}</td><td>${summary.total.toFixed(0)}</td></tr>`;
        }
        productOutputHTML += `</tbody></table>`;
        croissantProductOutputDiv.innerHTML = productOutputHTML;

        // Map to store total resep needed for each unique recipe (main or sub-recipe)
        let totalResepMap = {};

        // Function to recursively calculate total resep needed for a recipe and its sub-recipes
        function calculateTotalRecipeResep(recipeKey, resepMultiplier, variantFactor = 1.0) {
            const recipe = croissantRecipes[recipeKey];
            if (!recipe) {
                console.warn(`Recipe "${recipeKey}" not found in croissantRecipes.`);
                return;
            }

            if (!totalResepMap[recipeKey]) {
                totalResepMap[recipeKey] = 0;
            }
            totalResepMap[recipeKey] += resepMultiplier;

            if (recipe.ingredients) {
                for (const ingredientRaw in recipe.ingredients) {
                    const details = recipe.ingredients[ingredientRaw];
                    const ingredientKey = ingredientRaw.replace(/ /g, '_').toLowerCase();

                    if (croissantRecipes[ingredientKey]) { // Check if it's a sub-recipe
                        const subRecipe = croissantRecipes[ingredientKey];
                        const amountNeededInParentRecipe = details.amount;
                        const subRecipeBaseWeight = subRecipe.base_weight;

                        if (details.unit === "pcs") {
                            // If a sub-recipe ingredient is in "pcs", its amount directly represents its "resep" count
                            // Apply variantFactor to the amount if it's a direct piece count for a sub-recipe that represents a final product
                            const effectiveAmount = amountNeededInParentRecipe * (subRecipe.variants ? subRecipe.variants.baked.base_weight_factor : 1.0); // Assuming baked for sub-recipe if not specified
                            const subRecipeResep = effectiveAmount * resepMultiplier; // Multiplier from parent context still applies
                            calculateTotalRecipeResep(ingredientKey, subRecipeResep);
                        } else if (subRecipeBaseWeight && subRecipeBaseWeight > 0) {
                            // Otherwise (e.g., in grams), calculate based on base_weight
                            const subRecipeResep = (amountNeededInParentRecipe / subRecipeBaseWeight) * resepMultiplier;
                            calculateTotalRecipeResep(ingredientKey, subRecipeResep);
                        } else {
                            console.warn(`Sub-recipe "${ingredientKey}" found without base_weight and not in pcs. Cannot calculate resep.`);
                        }
                    }
                }
            }
        }

        // Start calculation for each product variant
        totalResepMap = {}; // Reset for each calculation
        for (const productName in productInputSummary) {
            const productSummary = productInputSummary[productName];
            const productObj = croissantProductsList.find(p => p.name === productName);

            if (!productObj) {
                console.warn(`Product object for "${productName}" not found.`);
                continue;
            }

            // Handle Baked variant
            if (productSummary.baked > 0) {
                let recipeKeyBaked = productObj.recipe_key_baked || productObj.recipe_key;
                const baseWeightFactorBaked = productObj.variants?.baked?.base_weight_factor || 1.0;

                if (recipeKeyBaked) {
                    // The quantity of the final product directly translates to its own 'resep' count.
                    // The base_weight_factor modifies the effective 'resep' multiplier for the recipe.
                    const numberOfResepForBakedProduct = productSummary.baked * baseWeightFactorBaked;
                    calculateTotalRecipeResep(recipeKeyBaked, numberOfResepForBakedProduct, baseWeightFactorBaked);
                } else {
                    console.warn(`Baked recipe key for product "${productName}" not found.`);
                }
            }

            // Handle Frozen variant
            if (productSummary.frozen > 0) {
                let recipeKeyFrozen = productObj.recipe_key_frozen || productObj.recipe_key;
                const baseWeightFactorFrozen = productObj.variants?.frozen?.base_weight_factor || 1.0;

                if (recipeKeyFrozen) {
                    const numberOfResepForFrozenProduct = productSummary.frozen * baseWeightFactorFrozen;
                    calculateTotalRecipeResep(recipeKeyFrozen, numberOfResepForFrozenProduct, baseWeightFactorFrozen);
                } else {
                    console.warn(`Frozen recipe key for product "${productName}" not found.`);
                }
            }
        }

        // Sort the recipe keys based on the desired order: Product -> Filling -> Laminasi -> Adonan
        const sortedRecipeKeys = Object.keys(totalResepMap).sort((a, b) => {
            const getCategoryPriority = (key) => {
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes('adonan')) return 4;
                if (lowerKey.includes('laminasi')) return 3;
                if (lowerKey.includes('filling') || lowerKey.includes('topping') || lowerKey.includes('sauce') || lowerKey.includes('cream')) return 2;
                return 1; // Product (default)
            };

            const priorityA = getCategoryPriority(a);
            const priorityB = getCategoryPriority(b);

            if (priorityA !== priorityB) {
                return priorityA - priorityB; // Ascending order of priority value (1 -> 2 -> 3 -> 4)
            }
            return a.localeCompare(b); // Alphabetical tie-breaker within same category
        });

        // Display Recipe Calculation Results (in resep units)
        let recipeOutputHTML = `<table><thead><tr><th>Recipe</th><th>Amount (resep)</th></tr></thead><tbody>`;
        for (const recipeKey of sortedRecipeKeys) {
            if (totalResepMap[recipeKey] > 0) { // Only show recipes with a calculated amount
                // Find the corresponding product name for display if available
                const product = croissantProductsList.find(p => p.recipe_key === recipeKey || p.recipe_key_baked === recipeKey || p.recipe_key_frozen === recipeKey);
                let displayName = recipeKey.replace(/_/g, ' ');
                if (product) {
                    if (product.recipe_key_baked === recipeKey) {
                        displayName = `${product.name} (Baked)`;
                    } else if (product.recipe_key_frozen === recipeKey) {
                        displayName = `${product.name} (Frozen)`;
                    } else {
                        displayName = product.name; // Generic recipe key for a product
                    }
                }
                recipeOutputHTML += `<tr><td>${displayName}</td><td>${totalResepMap[recipeKey].toFixed(4)}</td></tr>`;
            }
        }
        recipeOutputHTML += `</tbody></table>`;
        croissantRecipeOutputDiv.innerHTML = recipeOutputHTML;

        // Aggregate Ingredients from the accumulated totalResepMap
        let aggregatedIngredients = {};

        // This function now takes a recipe and its *total* resep and adds its base ingredients
        function aggregateBaseIngredients(recipeKey, totalNumberOfResep) {
            const recipe = croissantRecipes[recipeKey];
            if (!recipe || !recipe.ingredients) {
                // Handle recipes that might not have an 'ingredients' property but are base ingredients themselves (e.g., raw doughs)
                // This case is typically handled by direct ingredients in the calling recipe, but good to be explicit.
                return;
            }

            // Iterate through ingredients, only adding truly base ingredients to the final list
            for (const ingredientRaw in recipe.ingredients) {
                const details = recipe.ingredients[ingredientRaw];
                const ingredientKey = ingredientRaw.replace(/ /g, '_').toLowerCase();

                // If the ingredient is NOT itself a recipe (i.e., it's a raw material), aggregate it.
                // Sub-recipes will have their base ingredients aggregated when their own entry in totalResepMap is processed.
                if (!croissantRecipes[ingredientKey]) {
                    const amountForCurrentRecipe = details.amount * totalNumberOfResep;
                    if (!aggregatedIngredients[ingredientRaw]) {
                        aggregatedIngredients[ingredientRaw] = { amount: 0, unit: details.unit };
                    }
                    aggregatedIngredients[ingredientRaw].amount += amountForCurrentRecipe;
                }
            }
        }

        // Now, iterate through the totalResepMap to aggregate ingredients
        // This ensures that all recipes (main products and sub-recipes) for which we have a total 'resep' count
        // have their base ingredients aggregated into the final list.
        for (const recipeKey in totalResepMap) {
            if (totalResepMap[recipeKey] > 0) {
                aggregateBaseIngredients(recipeKey, totalResepMap[recipeKey]);
            }
        }

        // Display Ingredient Summary Results
        let ingredientOutputHTML = `<table><thead><tr><th>Ingredient</th><th>Total Amount</th><th>Unit</th></tr></thead><tbody>`;
        for (const ingredient in aggregatedIngredients) {
            ingredientOutputHTML += `<tr><td>${ingredient.replace(/_/g, ' ')}</td><td>${aggregatedIngredients[ingredient].amount.toFixed(4)}</td><td>${aggregatedIngredients[ingredient].unit}</td></tr>`;
        }
        ingredientOutputHTML += `</tbody></table>`;
        croissantIngredientOutputDiv.innerHTML = ingredientOutputHTML;
    });
    console.log('Croissant Calculator initialized successfully.'); // Debugging

    // WhatsApp Order Parser Logic
    const parseOrderButton = document.getElementById('parseOrderButton');
    const whatsappOrderInput = document.getElementById('whatsappOrderInput');
    const parseStatus = document.getElementById('parseStatus');

    // Product Aliases Map (Lowercase alias -> Standard Product Name)
    const productAliases = {
        "plain": "Plain Croissant",
        "croissant plain": "Plain Croissant",
        "flat croissan": "Plain Croissant", // Assumption based on "Flat"
        "croissant plant": "Plain Croissant",
        "croissant plan": "Plain Croissant",
        "cromboloni": "Cromboloni",
        "stroberi danish": "Danish Strawberry",
        "strawberry danish": "Danish Strawberry",
        "half moon": "Half Moon Croissant",
        "half moon croissant": "Half Moon Croissant",
        "apple croissant": "Apple Chausson",
        "apple chausson": "Apple Chausson",
        "apple chauson": "Apple Chausson",
        "chausson": "Apple Chausson",
        "chaoson": "Apple Chausson",
        "charcoal pain au": "Pain Au Charcoal",
        "pain au charcoal": "Pain Au Charcoal",
        "pain aux charcoal": "Pain Au Charcoal",
        "egg tart": "Eggtart Coffee Town", // Default to CT, logic below might override based on context
        "portuguese egg tart": "Portuguesse Eggtart C T", // Assuming CT default
        "portugis egg tart": "Portuguesse Eggtart C T",
        "hokkaido egg tart": "Hokkaido Eggtart C T",
        "hokkaido": "Hokkaido Eggtart C T",
        "pain au chocolate": "Pain Au Choco",
        "pain aux chocolate": "Pain Au Choco",
        "pain au choco": "Pain Au Choco",
        "pain au": "Pain Au Choco", // Ambiguous, often refers to choco
        "pai au": "Pain Au Choco",
        "ham and cheese": "Ham & Cheese Smith",
        "ham and cheese croissant": "Ham & Cheese Smith",
        "ham & chese": "Ham & Cheese Smith",
        "ham chese": "Ham & Cheese Smith",
        "hamchese": "Ham & Cheese Smith",
        "hamandcheese croissant": "Ham & Cheese Smith",
        "cinamon roll": "Cinnamon Roll",
        "cinnamon roll": "Cinnamon Roll",
        "cinamon": "Cinnamon Roll",
        "plie au": "Plie Au / Peppito",
        "pliau": "Plie Au / Peppito",
        "peppito": "Plie Au / Peppito",
        "crofin": "Croffin",
        "martabak": "Martabak Croissant",
        "martabak croisant": "Martabak Croissant",
        "cream aubulliong": "Creme Au Bullion",
        "creambrule": "Creme Brule",
        "suzateh danish": "Danish Suzette",
        "minicroipop cinamon": "Cinnamon Roll", // Unknown, mapping to Cinnamon Roll for now or warn? Let's check logic. Actually I'll skip unknown.
        "kouign aman": "Kouign Amman",
        "croisant petak": "Square Croissant",
        "smoke beef and cheese": "Smoked Beef Baker museum", // or Smoked Beef Baker Museum? Ambiguous.
        "smoke beef": "Smoked Beef Baker museum",
        "coffe croissant": "Coffee Croissant",
        "danis c. brulle": "Creme Brule", // or Danish?
        "chocolate  mouse": "Choco Mousse Croissant",
        "chocolate mouse": "Choco Mousse Croissant",
        "croissant almond": "Almond Croissant",
        "sourdough choco": "Sourdough Choco", // Not in product list?
        "sourdough ori": "Sourdough Ori",

        "sourdough cheese": "Sourdough Cheese",
        "cheesetart": "Cheesetart", // Maybe Eggtart?
        "ovaltine croisan": "Ovaltine Croissant", // Not in list
        "lotus c": "Lotus Croissant", // Not in list
        "egg curry c": "Egg Curry Croissant", // Not in list
        "melted chese tomat": "Mozzarella Melt Cheese", // Guess
        "melted chese mashrom": "Mozzarella Melt Cheese", // Guess
        "almond croisan": "Almond Croissant",
        "ham & cheese croissant": "Ham & Cheese Smith",
        "ham&cheese": "Ham & Cheese Smith",
        "CROISANT PETAK  SMOKE BEEF": "Mozzarella Smoked Beef",
        "croissant petak ( baked) chess": "Mozzarella Melt Cheese",
        "almond.c": "Almond Croissant",
        "cream brule": "Creme Brule",
        "chocolate mousse": "Choco Mousse Croissant",
        "ham & cheese.c": "Ham & Cheese Smith",
    };

    parseOrderButton.addEventListener('click', function () {
        const text = whatsappOrderInput.value;
        if (!text.trim()) {
            parseStatus.textContent = "Please paste text first.";
            return;
        }

        const lines = text.split('\n');
        let currentMode = 'baked'; // Default mode
        let currentOutlet = 'Unknown Outlet'; // Default outlet context
        let parsedItemsByOutlet = {}; // { "Outlet Name": { "Product Name": { baked: 0, frozen: 0 } } }
        let unknownLines = [];
        let totalQtyFound = 0;

        // Reset currentOutlet if we match a header
        const outletKeywords = {
            "godiva": "Godiva MM",
            "smith": "Smith",
            "baker museum": "Baker Museum",
            "bread social": "Bread Social",
            "coffee town": "Coffee Town",
            "2bakers": "2Bakers",
            "simple ground": "Simple Ground",
            "simple ground reserve": "Simple Ground"
        };

        const addQuantity = (outlet, productName, quantity, mode) => {
            if (!parsedItemsByOutlet[outlet]) parsedItemsByOutlet[outlet] = {};
            if (!parsedItemsByOutlet[outlet][productName]) parsedItemsByOutlet[outlet][productName] = { baked: 0, frozen: 0 };

            parsedItemsByOutlet[outlet][productName][mode] += quantity;
            totalQtyFound += quantity;
        };

        document.querySelectorAll('#croissantInputFields input').forEach(input => input.value = '');

        lines.forEach(line => {
            // Normalize whitespace
            const cleanLine = line.replace(/\s+/g, ' ').trim();
            if (!cleanLine) return;

            const lowerLine = cleanLine.toLowerCase();

            // 1. Detect Context Switches (Timestamp/Sender removal -> Content check)
            // Remove timestamp and sender part i.e. "[date] sender: "
            const plainContent = cleanLine.replace(/^\[.*?\]\s*.*?:/, '').trim();
            const lowerContent = plainContent.toLowerCase();

            // Check if this line is an Outlet Header
            let isHeader = false;
            // Iterate keys to find match
            for (const [key, standardizedName] of Object.entries(outletKeywords)) {
                if (lowerContent.includes(key)) {
                    // Check if it's likely a header line (short-ish or contains explicit header indicators)
                    // Heuristic: If line contains "tanggal" or "orderan" or just the name
                    // But also "Orderan croisan Simple ground reserve" is a header

                    // Avoid matching product names that might contain outlet names if any exist (e.g. "Coffee Town Egg Tart")
                    // We'll assume if it matches an outlet keyword and is NOT a product with quantity, it's a header.

                    // Simple check: does it look like a product line? (Has numbers at end?)
                    const hasQty = /(?:^|\s)(\d+(?:\.\d+)?)\s*(?:pcs|pc|box|bx|pack|pck)?$/i.test(plainContent);
                    if (!hasQty) {
                        currentOutlet = standardizedName;
                        isHeader = true;
                        // Reset mode to baked on new outlet? Usually safest, but sometimes context carries. 
                        // Let's assume Default Baked for new outlet unless specified.
                        currentMode = 'baked';
                        break;
                    }
                }
            }
            if (isHeader) return; // Skip header line processing for products

            // Detect Mode Switch (Baked/Frozen)
            if (lowerLine.includes('baked')) {
                currentMode = 'baked';
            } else if (lowerLine.includes('frozen')) {
                currentMode = 'frozen';
                if (cleanLine.match(/^croissant frozen$/i)) return; // Header line
            }

            // 2. Parse Quantity and Product
            let quantity = 0;
            let productText = plainContent; // Parse from the content part, ignoring sender if still present

            // Remove leading numbering found in content
            productText = productText.replace(/^\d+[\.\),]\s*/, '');

            // Extract quantity
            const qtyMatch = productText.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:pcs|pc|box|bx|pack|pck)?$/i);
            if (qtyMatch) {
                quantity = parseFloat(qtyMatch[1]);
                productText = productText.substring(0, qtyMatch.index).trim();
            } else {
                // Fallback for attached number e.g. "CROISSANT4"
                const attachedQtyMatch = productText.match(/(\d+)$/);
                if (attachedQtyMatch) {
                    quantity = parseFloat(attachedQtyMatch[1]);
                    productText = productText.substring(0, attachedQtyMatch.index).trim();
                } else {
                    // If no quantity but it looks like a valid product line (not just noise), default to 0? 
                    // Or maybe it's just a label. The user example "CROISSANT PLAIN" with no number implies 0 or missing?
                    // In the example: "1. CROISSANT PLAIN" (no number). Usually implies 0 or user forgot. 
                    // Let's assume 0.
                    quantity = 0;
                }
            }

            // Cleanup text
            if (productText.toLowerCase().includes('(baked)')) {
                currentMode = 'baked';
                productText = productText.replace(/[\(\)\[\]]*baked[\(\)\[\]]*/i, '').trim();
            }
            if (productText.toLowerCase().includes('(frozen)')) {
                currentMode = 'frozen';
                productText = productText.replace(/[\(\)\[\]]*frozen[\(\)\[\]]*/i, '').trim();
            }
            productText = productText.replace(/[,.*-]+$/, '').trim();

            if (!productText) return;

            // 3. Match Product
            let matchedProductName = null;
            const lowerProductText = productText.toLowerCase();

            // A. Direct Alias Match
            if (productAliases[lowerProductText]) {
                matchedProductName = productAliases[lowerProductText];
            } else {
                // B. Fuzzy Alias Match
                let bestMatchLength = 0;
                for (const [alias, realName] of Object.entries(productAliases)) {
                    if (lowerProductText.includes(alias) && alias.length > bestMatchLength) {
                        matchedProductName = realName;
                        bestMatchLength = alias.length;
                    }
                }
            }

            // Alias-based Context Overrides (Egg Tarts)
            if (matchedProductName) {
                if (matchedProductName === 'Eggtart Coffee Town' || matchedProductName === 'Eggtart Baker Museum') {
                    // Check outlet context
                    if (currentOutlet === 'Baker Museum') matchedProductName = 'Eggtart Baker Museum';
                    else matchedProductName = 'Eggtart Coffee Town'; // Default
                }
                if (matchedProductName === 'Portuguesse Eggtart C T' || matchedProductName === 'Portuguesse Eggtart B M') {
                    if (currentOutlet === 'Baker Museum') matchedProductName = 'Portuguesse Eggtart B M';
                    // else stays default CT
                }
                if (matchedProductName === 'Hokkaido Eggtart C T' || matchedProductName === 'Hokkaido Eggtart B M') {
                    if (currentOutlet === 'Baker Museum') matchedProductName = 'Hokkaido Eggtart B M';
                }
                // Handle Smoked Beef overrides if needed
                if (matchedProductName === 'Smoked Beef Baker museum' && currentOutlet !== 'Baker Museum') {
                    // Is there another smoked beef? "Smoked Beef & Cheese" -> "Smoked Beef Baker museum" is current mapping. 
                    // If there's a generic one, we'd map here. For now keep as is.
                }
            }

            // C. Exact Match Fallback
            if (!matchedProductName) {
                const exactMatch = croissantProductsList.find(p => p.name.toLowerCase() === lowerProductText);
                if (exactMatch) matchedProductName = exactMatch.name;
            }

            if (matchedProductName) {
                // Check if valid product
                const validProduct = croissantProductsList.find(p => p.name === matchedProductName);
                if (validProduct) {
                    addQuantity(currentOutlet, matchedProductName, quantity, currentMode);
                } else {
                    unknownLines.push(`${cleanLine} (Mapped to ${matchedProductName} but product not found)`);
                }
            } else {
                // Ignore likely non-product lines
                const ignoredKeywords = ["tanggal", "orderan", "date", "filling", "stick croissant"];
                if (!ignoredKeywords.some(k => lowerProductText.includes(k))) {
                    // Check if it's purely symbols
                    if (/[a-zA-Z]/.test(productText)) {
                        unknownLines.push(cleanLine);
                    }
                }
            }
        });

        // 4. Generate Output & Fill Inputs
        const recapDiv = document.getElementById('croissantRecapOutput');
        recapDiv.innerHTML = '';
        let recapHTML = '';
        let aggregatedItems = {}; // { ProductName: { baked: 0, frozen: 0 } }

        // Iterate outlets
        for (const [outlet, products] of Object.entries(parsedItemsByOutlet)) {
            recapHTML += `<div style="margin-bottom: 15px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                            <h4 style="color: #f9e1c0; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px; margin-bottom: 8px;">${outlet}</h4>
                            <table style="width: 100%; font-size: 13px;">`;

            for (const [productName, qtys] of Object.entries(products)) {
                // Add to aggregate
                if (!aggregatedItems[productName]) aggregatedItems[productName] = { baked: 0, frozen: 0 };
                aggregatedItems[productName].baked += qtys.baked;
                aggregatedItems[productName].frozen += qtys.frozen;

                // Display row if any qty
                if (qtys.baked > 0 || qtys.frozen > 0) {
                    let qtyStr = [];
                    if (qtys.baked > 0) qtyStr.push(`${qtys.baked} Baked`);
                    if (qtys.frozen > 0) qtyStr.push(`${qtys.frozen} Frozen`);
                    recapHTML += `<tr>
                                    <td style="color: #ddd;">${productName}</td>
                                    <td style="text-align: right; color: #fff; font-weight: bold;">${qtyStr.join(', ')}</td>
                                  </tr>`;
                }
            }
            recapHTML += `</table></div>`;
        }
        recapDiv.innerHTML = recapHTML || '<p style="font-style:italic; color: #aaa;">No valid orders parsed.</p>';

        // Fill Input Fields
        let filledCount = 0;
        const formatProductNameForId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        for (const [productName, qtys] of Object.entries(aggregatedItems)) {
            const formattedName = formatProductNameForId(productName);
            if (qtys.baked > 0) {
                const input = document.getElementById(`croissant-${formattedName}-baked`);
                if (input) { input.value = qtys.baked; filledCount++; }
            }
            if (qtys.frozen > 0) {
                const input = document.getElementById(`croissant-${formattedName}-frozen`);
                if (input) { input.value = qtys.frozen; filledCount++; }
            }
        }

        // Status Update
        let statusMsg = `✅ Processed orders for ${Object.keys(parsedItemsByOutlet).length} outlets. Filled ${filledCount} input fields.\n`;
        if (unknownLines.length > 0) {
            statusMsg += `⚠️ ${unknownLines.length} lines ignored/unknown:\n- ${unknownLines.join('\n- ')}`;
        }
        parseStatus.textContent = statusMsg;

        if (filledCount > 0) {
            // Optional: Auto-expand the recap section
            document.getElementById('croissantRecapSummary').querySelector('.collapsible-content').classList.add('active');
        }
    });

}

// Global variables for Recipe Scaler
let recipeSelect;
let multiplierInput;
let ingredientsTableBody;
let recipeNameOutput;
let recipeInstructionsDiv;
let instructionsList;
let scaleButton;

// Recipe Scaler Page Script
function initializeRecipeScaler() {
    recipeSelect = document.getElementById("recipes");
    multiplierInput = document.getElementById("multiplier");
    ingredientsTableBody = document.querySelector("#ingredients-table tbody");
    recipeNameOutput = document.getElementById("recipe-name");
    recipeInstructionsDiv = document.getElementById("recipe-instructions");
    instructionsList = document.getElementById("instructions-list");
    scaleButton = document.getElementById("scale-button");

    // Populate recipes for the initial department
    populateRecipes(activeDepartment);

    // Add event listener for the scale button
    scaleButton.addEventListener("click", refreshRecipeScalerContent);

    // Add a change listener to the recipe select to clear previous results for better UX
    recipeSelect.addEventListener("change", () => {
        document.getElementById('initial-output-message').style.display = 'block';
        recipeNameOutput.style.display = 'none';
        document.getElementById('ingredients-table').style.display = 'none';
        ingredientsTableBody.innerHTML = "";
        recipeInstructionsDiv.style.display = "none";
        instructionsList.innerHTML = "";
    });

    // Initial call to refresh content to ensure it's in a clean state
    const initialSelectedRecipeKey = recipeSelect.value;
    if (!initialSelectedRecipeKey) {
        document.getElementById('initial-output-message').style.display = 'block';
        recipeNameOutput.style.display = 'none';
        document.getElementById('ingredients-table').style.display = 'none';
        ingredientsTableBody.innerHTML = "";
        recipeInstructionsDiv.style.display = "none";
        instructionsList.innerHTML = "";
    }
}

function populateRecipes(department) {
    recipeSelect.innerHTML = '<option value="">Select a recipe</option>'; // Clear existing options

    let currentRecipes = {};
    if (department === 'simple-ground') {
        currentRecipes = recipes;
    } else if (department === 'croissant') {
        currentRecipes = croissantRecipes;
    }

    for (const key in currentRecipes) {
        // Exclude instructions and intermediate keys from the dropdown
        if (!key.endsWith('_instructions') && !intermediateRecipeKeysForScaler.includes(key)) {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = key.replace(/_/g, ' '); // Format for display
            option.dataset.department = department; // Store department info
            recipeSelect.appendChild(option);
        }
    }
}

function refreshRecipeScalerContent() {
    const selectedRecipeKey = recipeSelect.value;
    const multiplier = parseFloat(multiplierInput.value);

    if (!selectedRecipeKey || isNaN(multiplier) || multiplier <= 0) {
        document.getElementById('initial-output-message').style.display = 'block';
        recipeNameOutput.style.display = 'none';
        document.getElementById('ingredients-table').style.display = 'none';
        ingredientsTableBody.innerHTML = "";
        recipeInstructionsDiv.style.display = "none";
        instructionsList.innerHTML = "";
        return;
    }

    document.getElementById('initial-output-message').style.display = 'none'; // Hide initial message
    recipeNameOutput.style.display = 'block'; // Show recipe name
    document.getElementById('ingredients-table').style.display = 'table'; // Show ingredients table

    const selectedOption = recipeSelect.options[recipeSelect.selectedIndex];
    const selectedDepartment = selectedOption.dataset.department;

    let currentRecipesContext = {};
    if (selectedDepartment === 'simple-ground') {
        currentRecipesContext = recipes;
    } else if (selectedDepartment === 'croissant') {
        currentRecipesContext = croissantRecipes;
    }

    const recipe = currentRecipesContext[selectedRecipeKey];
    // Display the text content of the selected option (product name)
    recipeNameOutput.textContent = selectedOption.textContent;
    ingredientsTableBody.innerHTML = "";

    if (!recipe) {
        console.error(`Recipe "${selectedRecipeKey}" not found in current department's recipes.`);
        ingredientsTableBody.innerHTML = `<tr><td colspan="3">Recipe not found.</td></tr>`;
        recipeInstructionsDiv.style.display = "none";
        document.getElementById('ingredients-table').style.display = 'table'; // Keep table visible to show error message
        return;
    }

    if (recipe.ingredients) { // Check if the recipe has a sub-object 'ingredients'
        for (const [ingredient, details] of Object.entries(recipe.ingredients)) {
            const row = document.createElement("tr");
            const ingredientCell = document.createElement("td");
            const amountCell = document.createElement("td");
            const unitCell = document.createElement("td");

            ingredientCell.textContent = ingredient.replace(/_/g, " ");
            amountCell.textContent = (details.amount * multiplier).toFixed(0);
            unitCell.textContent = details.unit;

            row.appendChild(ingredientCell);
            row.appendChild(amountCell);
            row.appendChild(unitCell);
            ingredientsTableBody.appendChild(row);
        }
    } else { // Handle recipes that directly list ingredients (like adonan_donut_simple_ground) and might not have a separate 'ingredients' object
        for (const [key, value] of Object.entries(recipe)) {
            // Ensure it's an ingredient entry and not a metadata field like 'base_weight'
            if (key !== "base_weight" && typeof value === 'object' && value !== null && 'amount' in value && 'unit' in value) {
                const row = document.createElement("tr");
                const ingredientCell = document.createElement("td");
                const amountCell = document.createElement("td");
                const unitCell = document.createElement("td");

                ingredientCell.textContent = key.replace(/_/g, " ");
                amountCell.textContent = (value.amount * multiplier).toFixed(0);
                unitCell.textContent = value.unit;

                row.appendChild(ingredientCell);
                row.appendChild(amountCell);
                row.appendChild(unitCell);
                ingredientsTableBody.appendChild(row);
            }
        }
    }

    // Display instructions
    const instructionsKey = selectedRecipeKey + "_instructions";
    const instructions = currentRecipesContext[instructionsKey]; // Use currentRecipesContext for instructions
    instructionsList.innerHTML = ""; // Clear previous instructions

    if (instructions && instructions.length > 0) {
        instructions.forEach(instruction => {
            const listItem = document.createElement("li");
            listItem.textContent = instruction;
            instructionsList.appendChild(listItem);
        });
        recipeInstructionsDiv.style.display = "block"; // Show instructions div
    } else {
        recipeInstructionsDiv.style.display = "none"; // Hide if no instructions
    }
}

// Settings Page Script
function initializeSettings() {
    const donutScoreInputsDiv = document.getElementById("donut-score-inputs");
    const saveDonutScoresButton = document.getElementById("save-donut-scores");
    const settingsMessageDiv = document.getElementById("settings-message");

    // Load existing scores from localStorage
    let donutScores = JSON.parse(localStorage.getItem('donutScores')) || {};

    // Set default scores if none exist or if they are not fully defined
    if (Object.keys(donutScores).length === 0 || !distributableDonutProducts.every(product => donutScores[product] && outlets.every(outlet => donutScores[product][outlet] !== undefined))) {
        donutScores = JSON.parse(JSON.stringify(defaultDonutScores)); // Deep copy default scores
        localStorage.setItem('donutScores', JSON.stringify(donutScores));
    }

    // Generate table header dynamically
    const donutScoreTableHeader = document.getElementById("donut-score-table-header");
    let headerRow = `<tr><th style="text-align: left; color: #f9e1c0;">Donut Product</th>`;
    outlets.forEach(outlet => {
        let displayOutlet = outlet;
        if (outlet === "BENGKONG") {
            displayOutlet = "BENG<br>KONG";
        }
        headerRow += `<th style="text-align: center; color: #f9e1c0;">${displayOutlet}</th>`;
    });
    headerRow += `</tr>`;
    donutScoreTableHeader.innerHTML = headerRow;

    // Generate input fields in a table body
    const donutScoreTableBody = document.getElementById("donut-score-table-body");
    const scoreModeToggle = document.getElementById("score-mode-toggle");
    const scoringExplanation = document.getElementById("scoring-explanation");

    // Load score mode from localStorage
    let isFlexibleScoreMode = JSON.parse(localStorage.getItem('isFlexibleScoreMode')) || true; // Default to flexible scoring
    scoreModeToggle.checked = isFlexibleScoreMode;

    function updateScoreInputs() {
        isFlexibleScoreMode = scoreModeToggle.checked;
        donutProducts.forEach(product => {
            outlets.forEach(outlet => {
                const inputId = `score-${product.replace(/ /g, '-')}-${outlet}`;
                const scoreInput = document.getElementById(inputId);
                if (scoreInput) {
                    scoreInput.min = "0";
                    scoreInput.max = isFlexibleScoreMode ? "" : "5";
                }
            });
        });
        scoringExplanation.innerHTML = isFlexibleScoreMode ?
            `<strong>Scoring System (0-Infinity):</strong><br>Enter any positive numerical value, including 0.` :
            `<strong>Scoring System (0-5):</strong><br>0 = No Demand / Not Available<br>1 = Least Popular / Low Demand<br>2 = Below Average Popularity<br>3 = Average Popularity<br>4 = Above Average Popularity<br>5 = Best Seller / High Demand`;
    }

    distributableDonutProducts.forEach(product => { // Use distributableDonutProducts here
        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";

        const productCell = document.createElement("td");
        productCell.textContent = product.replace(/_/g, ' ');
        productCell.style.fontWeight = "500";
        productCell.style.color = "#f9e1c0";
        row.appendChild(productCell);

        outlets.forEach(outlet => {
            const scoreCell = document.createElement("td");
            scoreCell.style.textAlign = "center";
            const inputId = `score-${product.replace(/ /g, '-')}-${outlet}`;
            const currentScore = donutScores[product] ? (donutScores[product][outlet] || 0) : 0;
            scoreCell.innerHTML = `<input type="number" id="${inputId}" min="0" max="${isFlexibleScoreMode ? '' : '5'}" value="${currentScore}" style="width: 100%; text-align: center;"/>`;
            row.appendChild(scoreCell);
        });
        donutScoreTableBody.appendChild(row);
    });

    // Add a dedicated row for Bomboloni Karakter fixed amounts
    const bomboloniKarakterRow = document.createElement("tr");
    bomboloniKarakterRow.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";

    const bomboloniKarakterProductCell = document.createElement("td");
    bomboloniKarakterProductCell.textContent = BOMBOLONI_KARAKTER_PRODUCT_NAME.replace(/_/g, ' ');
    bomboloniKarakterProductCell.style.fontWeight = "500";
    bomboloniKarakterProductCell.style.color = "#f9e1c0";
    bomboloniKarakterRow.appendChild(bomboloniKarakterProductCell);

    let bomboloniKarakterFixedAmounts = JSON.parse(localStorage.getItem('bomboloniKarakterFixedAmounts')) || {};

    outlets.forEach(outlet => {
        const fixedAmountCell = document.createElement("td");
        fixedAmountCell.style.textAlign = "center";
        const inputId = `fixed-pcs-${BOMBOLONI_KARAKTER_PRODUCT_NAME.replace(/ /g, '-')}-${outlet}`;
        const currentFixedAmount = bomboloniKarakterFixedAmounts[outlet] || 0;
        fixedAmountCell.innerHTML = `<input type="number" id="${inputId}" min="0" value="${currentFixedAmount}" style="width: 100%; text-align: center;"/>`;
        bomboloniKarakterRow.appendChild(fixedAmountCell);
    });
    donutScoreTableBody.appendChild(bomboloniKarakterRow);


    // Add a total row
    const totalRow = document.createElement("tr");
    totalRow.style.borderTop = "2px solid rgba(255, 255, 255, 0.5)";
    totalRow.style.fontWeight = "bold";
    totalRow.style.color = "#f9e1c0";

    const totalLabelCell = document.createElement("td");
    totalLabelCell.textContent = "Total";
    totalLabelCell.style.textAlign = "left";
    totalRow.appendChild(totalLabelCell);

    outlets.forEach(outlet => {
        const totalCell = document.createElement("td");
        totalCell.id = `total-score-${outlet}`;
        totalCell.style.textAlign = "center";
        totalCell.textContent = "0"; // Initial total
        totalRow.appendChild(totalCell);
    });
    donutScoreTableBody.appendChild(totalRow);

    function updateTotalScores() {
        let outletTotals = {};
        outlets.forEach(outlet => {
            outletTotals[outlet] = 0;
        });

        distributableDonutProducts.forEach(product => { // Use distributableDonutProducts here
            outlets.forEach(outlet => {
                const inputId = `score-${product.replace(/ /g, '-')}-${outlet}`;
                const scoreInput = document.getElementById(inputId);
                if (scoreInput) {
                    outletTotals[outlet] += parseFloat(scoreInput.value) || 0;
                }
            });
        });

        // Add Bomboloni Karakter fixed amounts to the total for display in settings
        outlets.forEach(outlet => {
            const inputId = `fixed-pcs-${BOMBOLONI_KARAKTER_PRODUCT_NAME.replace(/ /g, '-')}-${outlet}`;
            const fixedAmountInput = document.getElementById(inputId);
            if (fixedAmountInput) {
                outletTotals[outlet] += parseFloat(fixedAmountInput.value) || 0;
            }
        });


        outlets.forEach(outlet => {
            const totalCell = document.getElementById(`total-score-${outlet}`);
            if (totalCell) {
                totalCell.textContent = outletTotals[outlet].toFixed(0);
            }
        });
    }

    scoreModeToggle.addEventListener('change', function () {
        localStorage.setItem('isFlexibleScoreMode', JSON.stringify(this.checked));
        updateScoreInputs();
        updateTotalScores(); // Recalculate totals when mode changes
    });

    // Initial update of inputs and explanation based on loaded mode
    updateScoreInputs();
    updateTotalScores(); // Initial calculation of totals

    // Add event listeners to all score inputs for real-time total updates
    distributableDonutProducts.forEach(product => { // Use distributableDonutProducts here
        outlets.forEach(outlet => {
            const inputId = `score-${product.replace(/ /g, '-')}-${outlet}`;
            const scoreInput = document.getElementById(inputId);
            if (scoreInput) {
                scoreInput.addEventListener('input', updateTotalScores);
            }
        });
    });

    // Add event listeners for Bomboloni Karakter fixed amount inputs
    outlets.forEach(outlet => {
        const inputId = `fixed-pcs-${BOMBOLONI_KARAKTER_PRODUCT_NAME.replace(/ /g, '-')}-${outlet}`;
        const fixedAmountInput = document.getElementById(inputId);
        if (fixedAmountInput) {
            fixedAmountInput.addEventListener('input', updateTotalScores);
        }
    });


    // Save scores to localStorage
    saveDonutScoresButton.addEventListener("click", function () {
        let newDonutScores = {};
        let newBomboloniKarakterFixedAmounts = {};
        let hasError = false;

        distributableDonutProducts.forEach(product => { // Use distributableDonutProducts here
            newDonutScores[product] = {};
            outlets.forEach(outlet => {
                const inputId = `score-${product.replace(/ /g, '-')}-${outlet}`;
                let scoreInput = document.getElementById(inputId);
                let score = parseFloat(scoreInput.value); // Use parseFloat for flexible scores

                if (isFlexibleScoreMode) {
                    if (isNaN(score) || score < 0) {
                        hasError = true;
                        scoreInput.style.border = "2px solid red";
                        settingsMessageDiv.textContent = "Error: Scores must be 0 or a positive number.";
                        settingsMessageDiv.style.color = "red";
                        settingsMessageDiv.style.display = "block";
                    } else {
                        scoreInput.style.border = "none";
                        newDonutScores[product][outlet] = score;
                    }
                } else { // Limited Score Mode (0-5)
                    if (isNaN(score) || score < 0 || score > 5) {
                        hasError = true;
                        scoreInput.style.border = "2px solid red";
                        settingsMessageDiv.textContent = "Error: Scores must be between 0 and 5.";
                        settingsMessageDiv.style.color = "red";
                        settingsMessageDiv.style.display = "block";
                    } else {
                        scoreInput.style.border = "none";
                        newDonutScores[product][outlet] = score;
                    }
                }
            });
        });

        // Save Bomboloni Karakter fixed amounts
        outlets.forEach(outlet => {
            const inputId = `fixed-pcs-${BOMBOLONI_KARAKTER_PRODUCT_NAME.replace(/ /g, '-')}-${outlet}`;
            let fixedAmountInput = document.getElementById(inputId);
            let fixedAmount = parseFloat(fixedAmountInput.value);

            if (isNaN(fixedAmount) || fixedAmount < 0) {
                hasError = true;
                fixedAmountInput.style.border = "2px solid red";
                settingsMessageDiv.textContent = "Error: Bomboloni Karakter fixed amount must be 0 or a positive number.";
                settingsMessageDiv.style.color = "red";
                settingsMessageDiv.style.display = "block";
            } else {
                fixedAmountInput.style.border = "none";
                newBomboloniKarakterFixedAmounts[outlet] = fixedAmount;
            }
        });


        if (!hasError) {
            localStorage.setItem('donutScores', JSON.stringify(newDonutScores));
            localStorage.setItem('bomboloniKarakterFixedAmounts', JSON.stringify(newBomboloniKarakterFixedAmounts));
            settingsMessageDiv.textContent = "Settings saved successfully!";
            settingsMessageDiv.style.color = "green";
            settingsMessageDiv.style.display = "block";
            setTimeout(() => {
                settingsMessageDiv.style.display = "none";
            }, 3000);
            updateTotalScores(); // Update totals after saving
        }
    });
}

// Toggle Collapse Function
function toggleCollapse(headerElement) {
    headerElement.classList.toggle('collapsed');
    const content = headerElement.nextElementSibling; // The content div is the next sibling
    content.classList.toggle('collapsed');

    // Update the icon
    const icon = headerElement.querySelector('.fas');
    if (icon) {
        if (headerElement.classList.contains('collapsed')) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
        } else {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
        }
    }
}
