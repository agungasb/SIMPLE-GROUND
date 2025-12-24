/**
 * Professional Hydration Scaler
 * Advanced consistency control for dough recipes
 */

const FLOUR_KEYWORDS = ['tepung', 'premix', 'flour', 'chakra', 'segitiga'];
const LIQUID_KEYWORDS = ['air', 'milk', 'susu', 'telur', 'egg', 'ice', 'es batu', 'liquid'];

let currentHydrationRecipe = null;
let baseLiquids = [];
let baseFlours = [];
let otherIngredients = [];

/**
 * Initialize the Hydration Scaler options
 */
function initHydrationOptions() {
    const select = document.getElementById('hydration-recipe-select');
    if (!select) return;

    // We only want dough recipes (those containing flour)
    const allRecipes = { ...recipes, ...croissantRecipes };
    const doughRecipes = [];

    for (const key in allRecipes) {
        const recipe = allRecipes[key];
        if (key.endsWith('_instructions')) continue;

        const ingredients = recipe.ingredients || recipe;
        if (typeof ingredients !== 'object') continue;

        let hasFlour = false;
        for (const ing in ingredients) {
            if (FLOUR_KEYWORDS.some(k => ing.toLowerCase().includes(k))) {
                hasFlour = true;
                break;
            }
        }

        if (hasFlour) {
            doughRecipes.push({ key, name: key.replace(/_/g, ' ') });
        }
    }

    // Populate dropdown
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Choose Recipe --</option>';
    doughRecipes.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.key;
        opt.textContent = r.name;
        select.appendChild(opt);
    });

    if (currentValue && doughRecipes.find(r => r.key === currentValue)) {
        select.value = currentValue;
    }
}

/**
 * Initialize the selected recipe data
 */
function initHydrationScaler() {
    const key = document.getElementById('hydration-recipe-select').value;
    if (!key) return resetHydrationUI();

    const allRecipes = { ...recipes, ...croissantRecipes };
    const recipe = allRecipes[key];
    const ingredients = recipe.ingredients || recipe;

    baseLiquids = [];
    baseFlours = [];
    otherIngredients = [];

    let totalFlour = 0;
    let totalLiquid = 0;

    for (const ing in ingredients) {
        const details = ingredients[ing];
        if (typeof details !== 'object' || !('amount' in details)) continue;

        const item = { name: ing, amount: details.amount, unit: details.unit };

        if (FLOUR_KEYWORDS.some(k => ing.toLowerCase().includes(k))) {
            baseFlours.push(item);
            totalFlour += details.amount;
        } else if (LIQUID_KEYWORDS.some(k => ing.toLowerCase().includes(k))) {
            baseLiquids.push(item);
            totalLiquid += details.amount;
        } else {
            otherIngredients.push(item);
        }
    }

    if (totalFlour === 0) {
        alert("This recipe has no detectable flour baseline.");
        return resetHydrationUI();
    }

    const baselineHydration = (totalLiquid / totalFlour) * 100;
    document.getElementById('hydration-baseline-display').textContent = baselineHydration.toFixed(1) + '%';

    // Set slider and input to baseline initially
    const targetInput = document.getElementById('hydration-target-input');
    const targetSlider = document.getElementById('hydration-slider');
    targetInput.value = baselineHydration.toFixed(1);
    targetSlider.value = baselineHydration;

    calculateHydrationScaling();
}

function syncHydrationInput() {
    document.getElementById('hydration-target-input').value = document.getElementById('hydration-slider').value;
    calculateHydrationScaling();
}

function syncHydrationSlider() {
    document.getElementById('hydration-slider').value = document.getElementById('hydration-target-input').value;
    calculateHydrationScaling();
}

/**
 * Perform the scaling calculation
 */
function calculateHydrationScaling() {
    const key = document.getElementById('hydration-recipe-select').value;
    if (!key) return;

    const multiplier = parseFloat(document.getElementById('hydration-multiplier').value) || 1;
    const targetHydration = parseFloat(document.getElementById('hydration-target-input').value) || 0;

    let totalFlour = baseFlours.reduce((sum, f) => sum + f.amount, 0);
    let currentLiquid = baseLiquids.reduce((sum, l) => sum + l.amount, 0);

    const targetLiquidWeight = totalFlour * (targetHydration / 100);
    const liquidAdjustmentMultiplier = currentLiquid > 0 ? (targetLiquidWeight / currentLiquid) : 0;

    const tbody = document.getElementById('hydration-table-body');
    tbody.innerHTML = '';

    let finalLiquidsTotal = 0;
    let finalFloursTotal = 0;
    let finalOthersTotal = 0;

    // Render Flours
    baseFlours.forEach(f => {
        const adjusted = f.amount * multiplier;
        finalFloursTotal += adjusted;
        appendRow(tbody, f.name, f.amount * multiplier, adjusted, 'flour');
    });

    // Render Liquids
    baseLiquids.forEach(l => {
        const standard = l.amount * multiplier;
        const adjusted = l.amount * multiplier * liquidAdjustmentMultiplier;
        finalLiquidsTotal += adjusted;
        appendRow(tbody, l.name, standard, adjusted, 'liquid');
    });

    // Render Others
    otherIngredients.forEach(o => {
        const adjusted = o.amount * multiplier;
        finalOthersTotal += adjusted;
        appendRow(tbody, o.name, adjusted, adjusted, 'other');
    });

    // Update Dashboard
    document.getElementById('stat-total-flour').textContent = Math.round(finalFloursTotal) + 'g';
    document.getElementById('stat-total-liquids').textContent = Math.round(finalLiquidsTotal) + 'g';
    document.getElementById('stat-final-weight').textContent = Math.round(finalFloursTotal + finalLiquidsTotal + finalOthersTotal) + 'g';

    // Show guidelines
    updateHydrationGuidelines(targetHydration);
}

function appendRow(tbody, name, standard, adjusted, type) {
    const row = document.createElement('tr');
    const diff = adjusted - standard;
    const diffText = diff === 0 ? '-' : (diff > 0 ? '+' : '') + diff.toFixed(0) + 'g';
    const diffColor = diff === 0 ? '#aaa' : (diff > 0 ? '#00ff08ff' : '#ff1100ff');

    row.innerHTML = `
        <td style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); color: ${type === 'liquid' ? '#00d2ff' : (type === 'flour' ? '#f9e1c0' : '#ddd')}">
            ${name.replace(/_/g, ' ')}
        </td>
        <td style="text-align: right; color: #f8f8f8ff;">${standard.toFixed(0)}g</td>
        <td style="text-align: center; font-weight: bold; background: rgba(255,255,255,0.02);">${adjusted.toFixed(0)}g</td>
        <td style="text-align: right; color: ${diffColor}; font-size: 11px;">${diffText}</td>
    `;
    tbody.appendChild(row);
}

function updateHydrationGuidelines(hydration) {
    const list = document.getElementById('hydration-guidance-list');
    const box = document.getElementById('hydration-instructions');
    list.innerHTML = '';
    box.style.display = 'block';

    if (hydration < 45) {
        list.innerHTML += '<li>⚠️ <strong>Low Hydration:</strong> Dough will be stiff. Requires longer mixing and potentially warmer water to activate gluten.</li>';
    } else if (hydration > 65) {
        list.innerHTML += '<li>⚠️ <strong>High Hydration:</strong> Dough will be sticky. Use "Autolyse" method (rest 30m before salt) for better handling.</li>';
    }
    list.innerHTML += '<li>💧 Always add liquid gradually to ensure even absorption.</li>';
    list.innerHTML += '<li>❄️ For target hydration over 50%, ensure liquids are below 4°C to prevent premature fermentation.</li>';
}

function resetHydrationUI() {
    document.getElementById('hydration-baseline-display').textContent = '0%';
    document.getElementById('stat-total-flour').textContent = '0g';
    document.getElementById('stat-total-liquids').textContent = '0g';
    document.getElementById('stat-final-weight').textContent = '0g';
    document.getElementById('hydration-table-body').innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #666;">Select a recipe to start balancing</td></tr>';
    document.getElementById('hydration-instructions').style.display = 'none';
}
