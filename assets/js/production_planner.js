/**
 * Professional Production Planner Logic
 */

// Global state for parameters
let plannerSettings = {
    doughDensity: 1.27, // g/cm3 (Current active density)
    manualDensity: 1.27, // Stored manual preference
    blockWeight: 2300,   // g (defaults to input)
    sheetWidth: 166,      // cm
    sheetLength: 42,     // cm
    scrapRate: 0.02,     // 10% default
    initialTrim: 0.05,   // 5% default
    processLoss: 0.02,    // 2% default
    isDensityLocked: false
};

// Placeholder data - initially empty, will be loaded from JSON
let plannerProducts = [];

// Fetch data from external JSON
async function loadPlannerData() {
    try {
        const response = await fetch('data/planner_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        plannerProducts = await response.json();
        console.log('Planner data loaded:', plannerProducts);
        const tableBody = document.getElementById('planner-table-body');
        if (tableBody) {
            isPlannerInitialized = false;
            renderPlannerTable();
        }
    } catch (error) {
        console.error('Could not load planner data:', error);
    }
}

// We need to wait for the DOM to be ready to attach listeners or render
document.addEventListener('DOMContentLoaded', () => {
    loadPlannerData();
});


// Calculation Functions
function calculateArea(shape, width, length) {
    if (shape === 'triangle') {
        return 0.5 * width * length;
    } else if (shape === 'rectangle') {
        return width * length;
    } else if (shape === 'circle') {
        let radius = width / 2;
        return Math.PI * radius * radius;
    }
    else if (shape === 'square') {
        return width * length; // Assuming width is side length, or both provided
    }
    return 0;
}

function calculateRow(product, qty) {
    const areaSqCm = calculateArea(product.shape, product.width, product.length);
    const totalNetAreaSqCm = areaSqCm * qty;

    // Apply scrap rate
    const grossAreaSqCm = totalNetAreaSqCm / (1 - plannerSettings.scrapRate);

    // Weight calculation
    const volumeCm3 = grossAreaSqCm * (product.thickness / 10);
    const weightGrams = volumeCm3 * plannerSettings.doughDensity;

    return {
        grossAreaSqCm,
        weightGrams,
        singleAreaSqCm: areaSqCm
    };
}

let isPlannerInitialized = false;

// 1. Initialize Table Structure (Run Once)
function initializePlannerTable() {
    const tableBody = document.getElementById('planner-table-body');
    if (!tableBody) return;

    if (isPlannerInitialized && tableBody.children.length > 0) return;

    tableBody.innerHTML = '';

    // Create exactly 3 rows
    for (let i = 0; i < 3; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select id="planner-select-${i}" class="planner-input" onchange="updatePlannerCalculations()">
                    <option value="">-- Select Product --</option>
                    ${plannerProducts.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
            </td>
            <td>
                <input type="number" id="planner-qty-${i}" class="planner-input" placeholder="0" oninput="updatePlannerCalculations()">
            </td>
            <td id="planner-dim-${i}">-</td>
            <td id="planner-thick-${i}">-</td>
            <td id="planner-yield-${i}">0</td>
            <td id="planner-area-${i}">0 cm²</td>
            <td id="planner-weight-${i}">0 g</td>
            <td id="planner-net-weight-${i}">0 g</td>
            <td style="text-align: center;">
                <button id="planner-map-btn-${i}" onclick="openLayoutModalForRow(${i})" style="background:none; border:none; cursor:pointer; color:#5a3e2b; font-size: 16px; display:none;" title="View Layout">
                    <i class="fas fa-map"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    }

    isPlannerInitialized = true;
}

// 2. Update Values Only (Run on Input)
function updatePlannerCalculations() {
    let totalWeight = 0;
    let totalArea = 0;
    let totalNetProductArea = 0;
    let totalVolume = 0;

    const sheetAreaSqCm = plannerSettings.sheetWidth * plannerSettings.sheetLength;

    for (let i = 0; i < 3; i++) {
        const select = document.getElementById(`planner-select-${i}`);
        const qtyInput = document.getElementById(`planner-qty-${i}`);
        const productId = select?.value;
        const qty = parseFloat(qtyInput?.value) || 0;

        const product = plannerProducts.find(p => p.id === productId);
        const mapBtn = document.getElementById(`planner-map-btn-${i}`);

        if (product) {
            // Update Row Info
            document.getElementById(`planner-dim-${i}`).textContent = `${product.width} x ${product.length} (${product.shape})`;
            document.getElementById(`planner-thick-${i}`).textContent = `${product.thickness} mm`;
            if (mapBtn) mapBtn.style.display = 'inline-block';

            // Calculations
            const singleNetArea = calculateArea(product.shape, product.width, product.length);
            const netAreaTotal = singleNetArea * qty;
            const grossAreaTotal = netAreaTotal / (1 - plannerSettings.scrapRate);

            const singleWeight = product.weight || 0;
            const netWeightTotal = singleWeight * qty;
            const grossWeightTotal = netWeightTotal / (1 - plannerSettings.scrapRate);

            totalWeight += grossWeightTotal;
            totalArea += grossAreaTotal;
            totalNetProductArea += netAreaTotal;

            const volumeCm3 = grossAreaTotal * (product.thickness / 10);
            totalVolume += volumeCm3;

            let yieldPerSheet = 0;
            if (singleNetArea > 0 && sheetAreaSqCm > 0) {
                yieldPerSheet = (sheetAreaSqCm * (1 - plannerSettings.scrapRate)) / singleNetArea;
            }

            document.getElementById(`planner-yield-${i}`).textContent = yieldPerSheet.toFixed(1);
            document.getElementById(`planner-area-${i}`).textContent = `${Math.round(grossAreaTotal)} cm²`;
            document.getElementById(`planner-weight-${i}`).textContent = `${Math.round(grossWeightTotal)} g`;
            document.getElementById(`planner-net-weight-${i}`).textContent = `${Math.round(netWeightTotal)} g`;
        } else {
            // Reset Row
            document.getElementById(`planner-dim-${i}`).textContent = "-";
            document.getElementById(`planner-thick-${i}`).textContent = "-";
            document.getElementById(`planner-yield-${i}`).textContent = "0";
            document.getElementById(`planner-area-${i}`).textContent = "0 cm²";
            document.getElementById(`planner-weight-${i}`).textContent = "0 g";
            document.getElementById(`planner-net-weight-${i}`).textContent = "0 g";
            if (mapBtn) mapBtn.style.display = 'none';
        }
    }

    // Update Totals
    let totalSheets = 0;
    if (sheetAreaSqCm > 0) {
        totalSheets = totalArea / sheetAreaSqCm;
    }

    // Update Bottom Summary
    document.getElementById('planner-total-area').textContent = `${Math.round(totalArea)} cm²`;
    document.getElementById('planner-total-net-area').textContent = `${Math.round(totalNetProductArea)} cm²`;
    document.getElementById('planner-total-weight').textContent = `${Math.round(totalWeight)} g`;

    // Calculate Recipe Weight (Table Weight + Initial Trim + Process Loss)
    const recipeWeight = totalWeight / (1 - plannerSettings.initialTrim) / (1 - plannerSettings.processLoss);
    document.getElementById('planner-recipe-weight').textContent = `${Math.round(recipeWeight)} g`;

    document.getElementById('planner-total-blocks').textContent = `${totalSheets.toFixed(3)} sheets`;

    // Update Top Displays (Calculated Fields)
    const topDisplayWeight = document.getElementById('display-total-weight');
    if (topDisplayWeight) {
        topDisplayWeight.value = Math.round(totalWeight);
    }

    const topDisplayDensity = document.getElementById('setting-density');
    if (topDisplayDensity) {
        if (plannerSettings.isDensityLocked) {
            topDisplayDensity.value = plannerSettings.manualDensity.toFixed(2);
            plannerSettings.doughDensity = plannerSettings.manualDensity;

            // Locked Mode: Clear alerts since user is manually overriding
            const warningIcon = document.getElementById('density-warning-icon');
            if (warningIcon) warningIcon.style.display = "none";
            topDisplayDensity.style.border = "";
            topDisplayDensity.style.backgroundColor = "";
        } else {
            // Avg Density = Total Weight / Total Volume
            if (totalVolume > 0) {
                const avgDensity = totalWeight / totalVolume;
                topDisplayDensity.value = avgDensity.toFixed(2);
                plannerSettings.doughDensity = avgDensity;

                // CD: Data Inconsistency Alert
                const warningIcon = document.getElementById('density-warning-icon');
                const deviation = Math.abs(avgDensity - plannerSettings.manualDensity) / plannerSettings.manualDensity;

                if (deviation > 0.2) {
                    topDisplayDensity.style.border = "2px solid #d32f2f";
                    topDisplayDensity.style.backgroundColor = "#ffebee";
                    if (warningIcon) warningIcon.style.display = "block";
                } else {
                    topDisplayDensity.style.border = "";
                    topDisplayDensity.style.backgroundColor = "";
                    if (warningIcon) warningIcon.style.display = "none";
                }
            } else {
                topDisplayDensity.value = "0.00";
                const warningIcon = document.getElementById('density-warning-icon');
                if (warningIcon) warningIcon.style.display = "none";
                topDisplayDensity.style.border = "";
                topDisplayDensity.style.backgroundColor = "";
            }
        }
    }
}

// 3. Initialize Settings Listeners
function initializeSettingsListeners() {
    ['setting-sheet-width', 'setting-sheet-length', 'setting-scrap-rate', 'setting-process-loss', 'setting-initial-trim', 'setting-density'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                // Update global settings
                updateSettingsFromInputs();
                updatePlannerCalculations();
            });
        }
    });

    // Density Lock Listener
    const lockBtn = document.getElementById('btn-lock-density');
    if (lockBtn) {
        lockBtn.addEventListener('click', () => {
            plannerSettings.isDensityLocked = !plannerSettings.isDensityLocked;
            const densityInput = document.getElementById('setting-density');
            const lockIcon = document.getElementById('density-lock-icon');

            if (plannerSettings.isDensityLocked) {
                densityInput.removeAttribute('readonly');
                densityInput.style.backgroundColor = '#fff';
                densityInput.value = plannerSettings.manualDensity.toFixed(2); // Show the stored manual value
                lockIcon.classList.remove('fa-unlock');
                lockIcon.classList.add('fa-lock');
            } else {
                densityInput.setAttribute('readonly', true);
                densityInput.style.backgroundColor = '';
                lockIcon.classList.remove('fa-lock');
                lockIcon.classList.add('fa-unlock');
                updatePlannerCalculations(); // Return to auto density display
            }
        });
    }
}

function updateSettingsFromInputs() {
    const sheetWidth = parseFloat(document.getElementById('setting-sheet-width').value) || 40;
    const sheetLength = parseFloat(document.getElementById('setting-sheet-length').value) || 60;
    const scrapRate = parseFloat(document.getElementById('setting-scrap-rate').value) || 10;
    const processLoss = parseFloat(document.getElementById('setting-process-loss').value) || 0;
    const initialTrim = parseFloat(document.getElementById('setting-initial-trim').value) || 0;
    const manualDensity = parseFloat(document.getElementById('setting-density').value) || 1.1;

    plannerSettings.blockWeight = plannerSettings.blockWeight; // Keep existing value or default if not set elsewhere
    plannerSettings.sheetWidth = sheetWidth;
    plannerSettings.sheetLength = sheetLength;
    plannerSettings.scrapRate = scrapRate / 100; // Convert to decimal
    plannerSettings.processLoss = processLoss / 100; // Convert to decimal
    plannerSettings.initialTrim = initialTrim / 100; // Convert to decimal

    if (plannerSettings.isDensityLocked) {
        plannerSettings.manualDensity = manualDensity;
        plannerSettings.doughDensity = manualDensity;
    }
}

// Main entry point called by app.js
function renderPlannerTable() {
    if (!isPlannerInitialized) {
        initializePlannerTable();
        initializeSettingsListeners();
    }
    // Ensure settings are up to date with default inputs
    updateSettingsFromInputs();
    updatePlannerCalculations();
}

// 4. Layout Visualization Logic
const modal = document.getElementById('layout-modal');
const closeModal = document.querySelector('.close-modal');
const canvas = document.getElementById('layout-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

if (closeModal) {
    closeModal.onclick = function () {
        if (modal) modal.style.display = "none";
    }
}

window.onclick = function (event) {
    if (event.target == modal) {
        if (modal) modal.style.display = "none";
    }
}

function openLayoutModalForRow(rowIndex) {
    const select = document.getElementById(`planner-select-${rowIndex}`);
    const productId = select?.value;
    const product = plannerProducts.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('layout-modal');
    const canvas = document.getElementById('layout-canvas');
    if (!modal || !canvas) return;
    const ctx = canvas.getContext('2d');

    updateSettingsFromInputs();

    document.getElementById('modal-product-title').textContent = `${product.name} Layout`;
    document.getElementById('modal-product-details').textContent =
        `Sheet: ${plannerSettings.sheetWidth}x${plannerSettings.sheetLength}cm | Product: ${product.width}x${product.length}cm (${product.shape})`;

    modal.style.display = "block";
    drawLayout(product, canvas, ctx);
}

function openMergedLayoutModal() {
    const activeItems = [];
    for (let i = 0; i < 3; i++) {
        const select = document.getElementById(`planner-select-${i}`);
        const qtyInput = document.getElementById(`planner-qty-${i}`);
        const productId = select?.value;
        const qty = parseFloat(qtyInput?.value) || 0;
        const product = plannerProducts.find(p => p.id === productId);
        if (product && qty > 0) {
            activeItems.push({ product, qty });
        }
    }

    if (activeItems.length === 0) {
        alert("Pilih produk dan masukkan jumlah terlebih dahulu!");
        return;
    }

    const modal = document.getElementById('layout-modal');
    const canvas = document.getElementById('layout-canvas');
    if (!modal || !canvas) return;
    const ctx = canvas.getContext('2d');

    updateSettingsFromInputs();

    document.getElementById('modal-product-title').textContent = `Merged Production Layout`;
    document.getElementById('modal-product-details').textContent =
        `Sheet: ${plannerSettings.sheetWidth}x${plannerSettings.sheetLength}cm | Combined Products: ${activeItems.length}`;

    modal.style.display = "block";
    drawMergedLayout(activeItems, canvas, ctx);
}

function drawMergedLayout(activeItems, canvas, ctx) {
    const scale = 10;
    const margin = 20;
    const sheetW = plannerSettings.sheetWidth;
    const sheetL = plannerSettings.sheetLength;

    canvas.width = (sheetW * scale) + (margin * 2);
    canvas.height = (sheetL * scale) + (margin * 2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.fillRect(margin, margin, sheetW * scale, sheetL * scale);
    ctx.strokeRect(margin, margin, sheetW * scale, sheetL * scale);

    // Initial free space: the whole sheet
    let freeRects = [{ x: 0, y: 0, w: sheetW, h: sheetL }];

    let colors = ["rgba(100, 200, 100, 0.5)", "rgba(100, 150, 250, 0.5)", "rgba(250, 150, 100, 0.5)", "rgba(250, 250, 100, 0.5)"];
    let borderColors = ["#4CAF50", "#2196F3", "#FF9800", "#FBC02D"];

    let productYieldsData = activeItems.map(item => ({ name: item.product.name, yield: 0 }));
    let totalUsedAreaSqCm = 0;

    // Standard Guillotine: Sort items by height descending
    const sortedItems = [...activeItems].sort((a, b) => b.product.length - a.product.length);

    sortedItems.forEach((item) => {
        const p = item.product;
        const color = colors[activeItems.indexOf(item) % colors.length];
        const borderColor = borderColors[activeItems.indexOf(item) % borderColors.length];
        const yieldData = productYieldsData.find(d => d.name === p.name);

        ctx.fillStyle = color;
        ctx.strokeStyle = borderColor;

        let piecesToPlace = item.qty;

        while (piecesToPlace > 0) {
            // Find best-fit freeRect (Best Area Fit)
            let bestRectIdx = -1;
            let minArea = Infinity;

            for (let i = 0; i < freeRects.length; i++) {
                const fr = freeRects[i];
                if (fr.w >= p.width && fr.h >= p.length) {
                    const area = fr.w * fr.h;
                    if (area < minArea) {
                        minArea = area;
                        bestRectIdx = i;
                    }
                }
            }

            if (bestRectIdx === -1) break; // No room in any free rectangle

            const rect = freeRects.splice(bestRectIdx, 1)[0];
            let placedW = 0;
            let placedH = p.length;

            if (p.shape === 'triangle') {
                let i = 0;
                while (piecesToPlace > 0) {
                    const startX = (i * p.width / 2);
                    if (startX + p.width > rect.w) break;

                    drawSingleShape(ctx, p, margin + ((rect.x + startX) * scale), margin + (rect.y * scale), p.width * scale, p.length * scale, (i % 2 === 0));
                    piecesToPlace--;
                    i++;
                    placedW = startX + p.width;
                    yieldData.yield++;
                }
            } else {
                while (piecesToPlace > 0) {
                    if (placedW + p.width > rect.w) break;
                    drawSingleShape(ctx, p, margin + ((rect.x + placedW) * scale), margin + (rect.y * scale), p.width * scale, p.length * scale);
                    piecesToPlace--;
                    placedW += p.width;
                    yieldData.yield++;
                }
            }

            if (placedW > 0) {
                // Split rect: Right and Bottom
                if (rect.w - placedW > 0) {
                    freeRects.push({
                        x: rect.x + placedW,
                        y: rect.y,
                        w: rect.w - placedW,
                        h: placedH
                    });
                }
                if (rect.h - placedH > 0) {
                    freeRects.push({
                        x: rect.x,
                        y: rect.y + placedH,
                        w: rect.w,
                        h: rect.h - placedH
                    });
                }
            }
        }

        const singleArea = calculateArea(p.shape, p.width, p.length);
        totalUsedAreaSqCm += (singleArea * yieldData.yield);
    });

    const totalSheetArea = sheetW * sheetL;
    const layoutScrapPercent = totalSheetArea > 0 ? ((totalSheetArea - totalUsedAreaSqCm) / totalSheetArea) * 100 : 0;
    const trimPercent = plannerSettings.initialTrim * 100;

    // Total Waste = (1 - (Net Area / Target Area)) * 100
    // Target Area = Total Sheet Area / (1 - initialTrim)
    const netAreaRatio = totalUsedAreaSqCm / (totalSheetArea / (1 - plannerSettings.initialTrim));
    const totalWastePercent = (1 - netAreaRatio) * 100;

    document.getElementById('modal-layout-stats').innerHTML = `
        <div style="flex: 2; text-align: left; padding-left: 10px; font-size: 12px;">${productYieldsData.map(d => `${d.name}: ${d.yield} pcs`).join(' | ')}</div>
        <div style="flex: 1;">Layout Scrap: ${layoutScrapPercent.toFixed(1)}%</div>
        <div style="flex: 1;">Trim: ${trimPercent.toFixed(1)}%</div>
        <div style="flex: 1; color: #d32f2f;">Total Waste: ${totalWastePercent.toFixed(1)}%</div>
    `;
}

function drawSingleShape(ctx, p, x, y, w, h, isTriangleUp = true) {
    if (p.shape === 'triangle') {
        ctx.beginPath();
        if (isTriangleUp) {
            ctx.moveTo(x, y + h);
            ctx.lineTo(x + w / 2, y);
            ctx.lineTo(x + w, y + h);
        } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x + w / 2, y + h);
            ctx.lineTo(x + w, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, w / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
    }
}

function drawLayout(product, canvas, ctx) {
    // Canvas Settings
    const scale = 10; // 1cm = 10px (Scale factor)
    const margin = 20;

    // Sheet Dimensions (cm)
    const sheetW = plannerSettings.sheetWidth;
    const sheetL = plannerSettings.sheetLength;

    // Canvas Size
    canvas.width = (sheetW * scale) + (margin * 2);
    canvas.height = (sheetL * scale) + (margin * 2);

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Sheet
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.fillRect(margin, margin, sheetW * scale, sheetL * scale);
    ctx.strokeRect(margin, margin, sheetW * scale, sheetL * scale);

    // Draw Products based on shape
    if (product.shape === 'rectangle' || product.shape === 'square') {
        drawRectLayout(product, sheetW, sheetL, scale, margin, ctx);
    } else if (product.shape === 'triangle') {
        drawTriangleLayout(product, sheetW, sheetL, scale, margin, ctx);
    } else if (product.shape === 'circle') {
        drawCircleLayout(product, sheetW, sheetL, scale, margin, ctx);
    }
}

function drawRectLayout(product, sheetW, sheetL, scale, margin, ctx) {
    // Try normal orientation
    const cols = Math.floor(sheetW / product.width);
    const rows = Math.floor(sheetL / product.length);
    const countNormal = cols * rows;

    // Try rotated orientation
    const colsRot = Math.floor(sheetW / product.length);
    const rowsRot = Math.floor(sheetL / product.width);
    const countRot = colsRot * rowsRot;

    let useRotated = countRot > countNormal;

    // Logic to choose best fit
    const itemW = useRotated ? product.length : product.width;
    const itemH = useRotated ? product.width : product.length;
    const numCols = useRotated ? colsRot : cols;
    const numRows = useRotated ? rowsRot : rows;

    ctx.fillStyle = "rgba(100, 200, 100, 0.5)";
    ctx.strokeStyle = "#4CAF50";
    ctx.lineWidth = 1;

    for (let i = 0; i < numCols; i++) {
        for (let j = 0; j < numRows; j++) {
            const x = margin + (i * itemW * scale);
            const y = margin + (j * itemH * scale);
            const w = itemW * scale;
            const h = itemH * scale;

            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
        }
    }

    // Update HTML Stats Bar
    const usedArea = (useRotated ? countRot : countNormal) * (product.width * product.length);
    const totalSheetArea = sheetW * sheetL;
    const layoutScrap = ((totalSheetArea - usedArea) / totalSheetArea) * 100;
    const yieldCount = useRotated ? countRot : countNormal;
    const trimPercent = plannerSettings.initialTrim * 100;

    const netAreaRatio = usedArea / (totalSheetArea / (1 - plannerSettings.initialTrim));
    const totalWaste = (1 - netAreaRatio) * 100;

    document.getElementById('modal-layout-stats').innerHTML = `
        <div>Yield: ${yieldCount} pcs</div>
        <div>Layout Scrap: ${layoutScrap.toFixed(1)}%</div>
        <div>Trim: ${trimPercent.toFixed(1)}%</div>
        <div style="color: #d32f2f;">Total Waste: ${totalWaste.toFixed(1)}%</div>
    `;
}

function drawCircleLayout(product, sheetW, sheetL, scale, margin, ctx) {
    // Simple grid packing for circles
    const diameter = product.width; // Assuming width is diameter
    const cols = Math.floor(sheetW / diameter);
    const rows = Math.floor(sheetL / diameter);
    const totalCount = cols * rows;

    ctx.fillStyle = "rgba(100, 200, 100, 0.5)";
    ctx.strokeStyle = "#4CAF50";

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const cx = margin + (i * diameter * scale) + (diameter * scale / 2);
            const cy = margin + (j * diameter * scale) + (diameter * scale / 2);
            const r = (diameter * scale / 2);

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    }

    // Update HTML Stats Bar
    const radius = diameter / 2;
    const singleArea = Math.PI * radius * radius;
    const usedArea = totalCount * singleArea;
    const totalSheetArea = sheetW * sheetL;
    const layoutScrap = ((totalSheetArea - usedArea) / totalSheetArea) * 100;
    const trimPercent = plannerSettings.initialTrim * 100;

    const netAreaRatio = usedArea / (totalSheetArea / (1 - plannerSettings.initialTrim));
    const totalWaste = (1 - netAreaRatio) * 100;

    document.getElementById('modal-layout-stats').innerHTML = `
        <div>Yield: ${totalCount} pcs</div>
        <div>Layout Scrap: ${layoutScrap.toFixed(1)}%</div>
        <div>Trim: ${trimPercent.toFixed(1)}%</div>
        <div style="color: #d32f2f;">Total Waste: ${totalWaste.toFixed(1)}%</div>
    `;
}

function drawTriangleLayout(product, sheetW, sheetL, scale, margin, ctx) {
    const base = product.width;
    const height = product.length;

    const numStrips = Math.floor(sheetL / height);

    ctx.fillStyle = "rgba(100, 200, 100, 0.5)";
    ctx.strokeStyle = "#4CAF50";
    ctx.lineWidth = 1;

    let totalCount = 0;

    for (let s = 0; s < numStrips; s++) {
        const yBase = margin + (s * height * scale);

        let i = 0;
        while (true) {
            const isUp = (i % 2 === 0);
            const startX = (i * base / 2);

            if (startX + base > sheetW) break;

            let x1, y1, x2, y2, x3, y3;
            if (isUp) {
                x1 = margin + (startX * scale);
                y1 = yBase + (height * scale);

                x2 = margin + ((startX + (base / 2)) * scale);
                y2 = yBase;

                x3 = margin + ((startX + base) * scale);
                y3 = yBase + (height * scale);
            } else {
                x1 = margin + (startX * scale);
                y1 = yBase;

                x2 = margin + ((startX + (base / 2)) * scale);
                y2 = yBase + (height * scale);

                x3 = margin + ((startX + base) * scale);
                y3 = yBase;
            }

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            totalCount++;
            i++;
        }
    }

    const singleArea = 0.5 * base * height;
    const usedArea = totalCount * singleArea;
    const totalSheetArea = sheetW * sheetL;
    const layoutScrap = ((totalSheetArea - usedArea) / totalSheetArea) * 100;
    const trimPercent = plannerSettings.initialTrim * 100;

    const netAreaRatio = usedArea / (totalSheetArea / (1 - plannerSettings.initialTrim));
    const totalWaste = (1 - netAreaRatio) * 100;

    document.getElementById('modal-layout-stats').innerHTML = `
        <div>Yield: ${totalCount} pcs</div>
        <div>Layout Scrap: ${layoutScrap.toFixed(1)}%</div>
        <div>Trim: ${trimPercent.toFixed(1)}%</div>
        <div style="color: #d32f2f;">Total Waste: ${totalWaste.toFixed(1)}%</div>
    `;
}

// Auto-Adjust Helper (Global Scope)
window.autoAdjustDimension = function (target) {
    let totalGrossWeight = 0;
    let totalGrossArea = 0;
    let totalVolume = 0;

    for (let i = 0; i < 3; i++) {
        const select = document.getElementById(`planner-select-${i}`);
        const qtyInput = document.getElementById(`planner-qty-${i}`);
        const productId = select?.value;
        const qty = parseFloat(qtyInput?.value) || 0;
        const product = plannerProducts.find(p => p.id === productId);

        if (product) {
            const singleNetArea = calculateArea(product.shape, product.width, product.length);
            const netAreaTotal = singleNetArea * qty;
            const grossAreaTotal = netAreaTotal / (1 - plannerSettings.scrapRate);

            const singleWeight = product.weight || 0;
            const netWeightTotal = singleWeight * qty;
            const grossWeightTotal = netWeightTotal / (1 - plannerSettings.scrapRate);

            totalGrossWeight += grossWeightTotal;
            totalGrossArea += grossAreaTotal;
            totalVolume += grossAreaTotal * (product.thickness / 10);
        }
    }

    if (totalGrossWeight <= 0 || totalGrossArea <= 0) {
        alert("Ikuti petunjuk penggunaan yang diberikan, jika ingin mendapatkan hasil yang maksimal!");
        return;
    }

    // Get current density from setting
    const density = parseFloat(document.getElementById('setting-density')?.value) || plannerSettings.doughDensity;
    const avgThickness = totalVolume / totalGrossArea; // in cm

    // Formula: Area = Weight / (Density * Thick)
    const targetArea = totalGrossWeight / (density * avgThickness);

    // Physical constraint: Width/Length must fit at least one piece of the largest product
    let maxProductWidth = 0;
    let maxProductLength = 0;
    for (let i = 0; i < 3; i++) {
        const select = document.getElementById(`planner-select-${i}`);
        const productId = select?.value;
        const product = plannerProducts.find(p => p.id === productId);
        if (product) {
            maxProductWidth = Math.max(maxProductWidth, product.width);
            maxProductLength = Math.max(maxProductLength, product.length);
        }
    }

    if (target === 'width') {
        const currentLength = parseFloat(document.getElementById('setting-sheet-length').value) || 1;
        let idealWidth = targetArea / currentLength;

        // Ensure width is at least the largest product dimension if only one piece
        idealWidth = Math.max(idealWidth, maxProductWidth);

        document.getElementById('setting-sheet-width').value = Math.round(idealWidth);
    } else if (target === 'length') {
        const currentWidth = parseFloat(document.getElementById('setting-sheet-width').value) || 1;
        let idealLength = targetArea / currentWidth;

        // Ensure length is at least the largest product dimension if only one piece
        idealLength = Math.max(idealLength, maxProductLength);

        document.getElementById('setting-sheet-length').value = Math.round(idealLength);
    }

    updateSettingsFromInputs();
    updatePlannerCalculations();
}
