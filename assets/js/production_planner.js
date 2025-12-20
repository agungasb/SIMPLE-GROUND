/**
 * Professional Production Planner Logic
 */

// Global state for parameters
let plannerSettings = {
    doughDensity: 1.1, // g/cm3
    blockWeight: 4000, // g (defaults to input)
    sheetWidth: 40,    // cm
    sheetLength: 60,   // cm
    scrapRate: 0.10    // 10% default
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

    // Headers are now managed in index.html to prevent duplication/misalignment
    // const headerRow = document.querySelector('#planner-table thead tr'); ... (Removed)

    tableBody.innerHTML = '';

    plannerProducts.forEach((product, index) => {
        const qtyInputId = `planner-qty-${index}`;
        const yieldOutputId = `planner-yield-${index}`; // New
        const areaOutputId = `planner-area-${index}`;
        const weightOutputId = `planner-weight-${index}`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>
                <input type="number" id="${qtyInputId}" class="planner-input" placeholder="0" oninput="updatePlannerCalculations()">
            </td>
            <td class="desktop-only">${product.width} x ${product.length} (${product.shape})</td>
            <td class="desktop-only">${product.thickness} mm</td>
            <td id="${yieldOutputId}">0</td> <!-- New Yield Column -->
            <td id="${areaOutputId}">0 cm²</td>
            <td id="${weightOutputId}">0 g</td>
            <td style="text-align: center;">
                <button onclick="openLayoutModal(${index})" style="background:none; border:none; cursor:pointer; color:#5a3e2b; font-size: 16px;" title="View Layout">
                    <i class="fas fa-map"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    isPlannerInitialized = true;
}

// 2. Update Values Only (Run on Input)
function updatePlannerCalculations() {
    let totalWeight = 0;
    let totalArea = 0;

    // Calculate Sheet Area once
    const sheetAreaSqCm = plannerSettings.sheetWidth * plannerSettings.sheetLength;

    plannerProducts.forEach((product, index) => {
        const qtyInputId = `planner-qty-${index}`;
        const yieldOutputId = `planner-yield-${index}`;
        const areaOutputId = `planner-area-${index}`;
        const weightOutputId = `planner-weight-${index}`;

        const qtyInput = document.getElementById(qtyInputId);
        const qty = parseFloat(qtyInput?.value) || 0;

        const result = calculateRow(product, qty);
        totalWeight += result.weightGrams;
        totalArea += result.grossAreaSqCm;

        // Calculate Yield per Sheet
        // Yield = (Sheet Area * (1 - Scrap)) / Single Product Area
        // This is strictly simpler: How many full products fit?
        // Actually, professional yield is usually: How many products can I cut from this sheet?
        // Yield = (Sheet Area * (1 - ScrapRate)) / Product Area
        let yieldPerSheet = 0;
        if (result.singleAreaSqCm > 0 && sheetAreaSqCm > 0) {
            yieldPerSheet = (sheetAreaSqCm * (1 - plannerSettings.scrapRate)) / result.singleAreaSqCm;
        }

        // Update row outputs
        document.getElementById(yieldOutputId).textContent = yieldPerSheet.toFixed(1);
        document.getElementById(areaOutputId).textContent = `${Math.round(result.grossAreaSqCm)} cm²`;
        document.getElementById(weightOutputId).textContent = `${Math.round(result.weightGrams)} g`;
    });

    // Update Totals
    // Total Sheets = Total Gross Area / Sheet Area
    // (Note: This is mathematically equivalent to Weight / BlockWeight if consistency is 100%, but we calculate from Area now)
    let totalSheets = 0;
    if (sheetAreaSqCm > 0) {
        totalSheets = totalArea / sheetAreaSqCm;
    }

    document.getElementById('planner-total-area').textContent = `${Math.round(totalArea)} cm²`;
    document.getElementById('planner-total-weight').textContent = `${Math.round(totalWeight)} g`;
    document.getElementById('planner-total-blocks').textContent = `${totalSheets.toFixed(3)} sheets`;
}

// 3. Initialize Settings Listeners
function initializeSettingsListeners() {
    ['setting-sheet-width', 'setting-sheet-length', 'setting-scrap-rate', 'setting-density'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                // Update global settings
                updateSettingsFromInputs();
                updatePlannerCalculations();
            });
        }
    });
}

function updateSettingsFromInputs() {
    const sheetWidth = parseFloat(document.getElementById('setting-sheet-width').value) || 40;
    const sheetLength = parseFloat(document.getElementById('setting-sheet-length').value) || 60;
    const scrapRate = parseFloat(document.getElementById('setting-scrap-rate').value) || 10;
    const density = parseFloat(document.getElementById('setting-density').value) || 1.1;

    plannerSettings.blockWeight = plannerSettings.blockWeight; // Keep existing value or default if not set elsewhere
    plannerSettings.sheetWidth = sheetWidth;
    plannerSettings.sheetLength = sheetLength;
    plannerSettings.scrapRate = scrapRate / 100; // Convert to decimal
    plannerSettings.doughDensity = density;
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

function openLayoutModal(index) {
    const modal = document.getElementById('layout-modal');
    const canvas = document.getElementById('layout-canvas');
    if (!modal || !canvas) return;
    const ctx = canvas.getContext('2d');

    // Refresh settings before drawing
    updateSettingsFromInputs();

    const product = plannerProducts[index];
    document.getElementById('modal-product-title').textContent = `${product.name} Layout`;
    document.getElementById('modal-product-details').textContent =
        `Sheet: ${plannerSettings.sheetWidth}x${plannerSettings.sheetLength}cm | Product: ${product.width}x${product.length}cm (${product.shape})`;

    modal.style.display = "block";

    drawLayout(product, canvas, ctx);
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

    // Add text info
    const usedArea = (useRotated ? countRot : countNormal) * (product.width * product.length);
    const totalArea = sheetW * sheetL;
    const actualScrap = ((totalArea - usedArea) / totalArea) * 100;

    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText(`Best Fit: ${useRotated ? "Rotated" : "Normal"}`, margin, margin - 5);
    ctx.fillText(`Yield: ${useRotated ? countRot : countNormal} pcs`, margin + 180, margin - 5);
    ctx.fillText(`Scrap: ${actualScrap.toFixed(1)}%`, margin + 300, margin - 5);
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

    const radius = diameter / 2;
    const singleArea = Math.PI * radius * radius;
    const usedArea = totalCount * singleArea;
    const totalArea = sheetW * sheetL;
    const actualScrap = ((totalArea - usedArea) / totalArea) * 100;

    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText(`Yield: ${totalCount} pcs`, margin, margin - 5);
    ctx.fillText(`Scrap: ${actualScrap.toFixed(1)}%`, margin + 120, margin - 5);
}

function drawTriangleLayout(product, sheetW, sheetL, scale, margin, ctx) {
    // Visualization for triangles (Strip method with Nesting)
    // We assume cutting in strips of specific height (product.length)
    // And alternating triangles (Up/Down) along the strip.

    // Dimensions
    const base = product.width;   // Base of triangle
    const height = product.length; // Height of triangle

    const numStrips = Math.floor(sheetL / height); // Strips along width

    ctx.fillStyle = "rgba(100, 200, 100, 0.5)";
    ctx.strokeStyle = "#4CAF50";
    ctx.lineWidth = 1;

    let totalCount = 0;

    for (let s = 0; s < numStrips; s++) {
        const yBase = margin + (s * height * scale);

        // x tracks the left-most point of the current triangle's bounding box logic
        let currentX = 0;

        // Unlike rectangles, triangles nest.
        // Triangle 1 (UP):   (0, H) -> (B/2, 0) -> (B, H)
        // Triangle 2 (DOWN): (B/2, 0) -> (B, H) -> (1.5B, 0)
        // Triangle 3 (UP):   (B, H) -> (1.5B, 0) -> (2B, H)
        // Notice the pattern: Each new triangle advances by B/2.

        let i = 0;
        while (true) {
            const isUp = (i % 2 === 0);

            // Calculate coordinates for the 3 points
            let x1, y1, x2, y2, x3, y3;

            // The "start" X for this triangle index
            // i=0: start 0. i=1: start 0.5B. i=2: start 1.0B
            const startX = (i * base / 2);

            // Check if this triangle fits in the sheet width
            if (startX + base > sheetW) break;

            if (isUp) {
                // Point Up (Base at bottom) (Visual invert because canvas Y connects top-down)
                // Actually: "Point Up" usually means tip at top, base at bottom.
                // In Canvas Y: Top is 0. 
                // Let's draw: Base at yBase + H, Tip at yBase.
                x1 = margin + (startX * scale);
                y1 = yBase + (height * scale); // Bottom Left

                x2 = margin + ((startX + (base / 2)) * scale);
                y2 = yBase; // Top Tip

                x3 = margin + ((startX + base) * scale);
                y3 = yBase + (height * scale); // Bottom Right
            } else {
                // Point Down (Tip at bottom, Base at top)
                x1 = margin + (startX * scale);
                y1 = yBase; // Top Left

                x2 = margin + ((startX + (base / 2)) * scale);
                y2 = yBase + (height * scale); // Bottom Tip

                x3 = margin + ((startX + base) * scale);
                y3 = yBase; // Top Right
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
    const totalArea = sheetW * sheetL;
    const actualScrap = ((totalArea - usedArea) / totalArea) * 100;

    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText(`View: Nested Strip Layout`, margin, margin - 5);
    ctx.fillText(`Yield: ${totalCount} pcs`, margin + 200, margin - 5);
    ctx.fillText(`Scrap: ${actualScrap.toFixed(1)}%`, margin + 320, margin - 5);
}
