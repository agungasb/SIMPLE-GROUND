/**
 * QC Auditor Logic for Coffee Town Bakery
 */

const STANDARDS = {
    DOUGH_DENSITY: 1.27, // g/cm³
    DOUGH_TEMP_MIN: 22.0, // °C
    DOUGH_TEMP_MAX: 24.5,
    SPECIFIC_VOLUME_MIN: 4.0, // cm³/g
    SPECIFIC_VOLUME_MAX: 6.0,
    MOISTURE_LOSS_MIN: 15.0, // %
    MOISTURE_LOSS_MAX: 20.0
};

/**
 * 1. Mixing & Bulk Audit Logic (STAGE 1)
 */
window.calculateMixingAudit = function () {
    const temp = parseFloat(document.getElementById('audit-mix-temp').value);
    const weight = parseFloat(document.getElementById('audit-mix-weight').value);
    const width = parseFloat(document.getElementById('audit-mix-width').value);
    const length = parseFloat(document.getElementById('audit-mix-length').value);
    const thickness = parseFloat(document.getElementById('audit-mix-thick').value);

    const resTemp = document.getElementById('res-mix-temp-val');
    const resDensity = document.getElementById('res-mix-density');
    const resStatus = document.getElementById('res-mix-status');
    const resAdvice = document.getElementById('res-mix-advice');

    if (isNaN(temp) || !weight || !width || !length || !thickness) {
        resTemp.textContent = "--";
        resDensity.textContent = "0.00";
        resStatus.textContent = "Waiting for Input";
        resStatus.className = "result-badge status-neutral";
        resAdvice.textContent = "Cek suhu dan densitas adonan awal.";
        return;
    }

    // 1. Temperature Evaluation
    let tempStatus = "Optimal";
    if (temp < STANDARDS.DOUGH_TEMP_MIN) tempStatus = "Cold";
    else if (temp > STANDARDS.DOUGH_TEMP_MAX) tempStatus = "Warm";
    resTemp.textContent = tempStatus;

    // 2. Density Evaluation
    const area = width * length;
    const volume = area * thickness; // Thickness is in cm here
    const density = weight / volume;
    resDensity.textContent = density.toFixed(2);

    const devDensity = Math.abs(density - STANDARDS.DOUGH_DENSITY) / STANDARDS.DOUGH_DENSITY;

    // 3. Overall Combined Status
    let statusClass = "status-good";
    let statusText = "✅ PASSED";
    let advice = "Dough temperature and density are correct.";

    if (temp > 26) {
        statusClass = "status-danger";
        statusText = "❌ REJECT / COOL DOWN";
        advice = "Suhu terlalu tinggi! Risiko mentega bocor sangat besar.";
    } else if (devDensity > 0.15) {
        statusClass = "status-danger";
        statusText = "❌ ADJUST HYDRATION";
        advice = "Densitas melenceng jauh. Cek takaran air/tepung.";
    } else if (tempStatus !== "Optimal" || devDensity > 0.05) {
        statusClass = "status-warning";
        statusText = "⚠️ MARGINAL";
        advice = "Perhatikan suhu/densitas sebelum lamination.";
    }

    resStatus.className = `result-badge ${statusClass}`;
    resStatus.textContent = statusText;
    resAdvice.textContent = advice;
};

/**
 * 2. Sheeter Audit Logic (STAGE 2)
 */
window.calculateSheeterAudit = function () {
    const weight = parseFloat(document.getElementById('audit-sheet-weight').value);
    const width = parseFloat(document.getElementById('audit-sheet-width').value);
    const length = parseFloat(document.getElementById('audit-sheet-length').value);
    const thickness = parseFloat(document.getElementById('audit-sheet-thick').value);

    const resDensity = document.getElementById('res-sheet-density');
    const resStatus = document.getElementById('res-sheet-status');
    const resAdvice = document.getElementById('res-sheet-advice');

    if (!weight || !width || !length || !thickness) {
        resDensity.textContent = "0.00";
        resStatus.textContent = "Waiting for Input";
        resStatus.className = "result-badge status-neutral";
        resAdvice.textContent = "Masukkan data sample trim untuk audit.";
        return;
    }

    const area = width * length;
    // Formula: Density = Weight / Volume
    // Volume = Area * (Thickness in cm)
    const volume = area * (thickness / 10);
    const density = weight / volume;

    resDensity.textContent = density.toFixed(2);

    // Evaluate Deviation
    const deviation = Math.abs(density - STANDARDS.DOUGH_DENSITY) / STANDARDS.DOUGH_DENSITY;

    if (deviation <= 0.05) {
        resStatus.textContent = "✅ PASSED (Optimal)";
        resStatus.className = "result-badge status-good";
        resAdvice.textContent = "Presisi sempurna. Tekstur adonan sesuai standar.";
    } else if (deviation <= 0.15) {
        resStatus.textContent = "⚠️ MARGINAL";
        resStatus.className = "result-badge status-warning";
        resAdvice.textContent = density < STANDARDS.DOUGH_DENSITY
            ? "Adonan sedikit terlalu ringan (puffy). Cek fermentasi."
            : "Adonan sedikit terlalu padat. Cek elastisitas.";
    } else {
        resStatus.textContent = "❌ REJECT / ADJUST";
        resStatus.className = "result-badge status-danger";
        resAdvice.textContent = "Penyimpangan tinggi! Kalibrasi sheeter atau cek berat block adonan.";
    }
};

/**
 * 2. Baked Audit Logic
 */
window.calculateBakedAudit = function () {
    const rawWeight = parseFloat(document.getElementById('audit-baked-raw').value);
    const bakedWeight = parseFloat(document.getElementById('audit-baked-finish').value);
    const volume = parseFloat(document.getElementById('audit-baked-vol').value);

    const resSpecVol = document.getElementById('res-baked-specvol');
    const resLoss = document.getElementById('res-baked-loss');
    const resStatus = document.getElementById('res-baked-status');
    const resAdvice = document.getElementById('res-baked-advice');

    if (!rawWeight || !bakedWeight || !volume) {
        resSpecVol.textContent = "0.0";
        resLoss.textContent = "0.0";
        resStatus.textContent = "Waiting for Input";
        resStatus.className = "result-badge status-neutral";
        resAdvice.textContent = "Input data kematangan produk.";
        return;
    }

    // Formula: Specific Volume = Volume / BakedWeight
    const specVol = volume / bakedWeight;
    // Formula: Moisture Loss % = (diff / raw) * 100
    const loss = ((rawWeight - bakedWeight) / rawWeight) * 100;

    resSpecVol.textContent = specVol.toFixed(1);
    resLoss.textContent = loss.toFixed(1);

    // Evaluate Quality
    let status = "status-good";
    let statusText = "✅ EXCELLENT";
    let advice = "Produk sangat ringan dan matang sempurna.";

    if (specVol < STANDARDS.SPECIFIC_VOLUME_MIN) {
        statusText = "❌ DENSE (Heavy)";
        status = "status-danger";
        advice = "Sarang lebah (honeycomb) mungkin tidak terbentuk sempurna.";
    } else if (loss > STANDARDS.MOISTURE_LOSS_MAX) {
        statusText = "⚠️ DRY (Overbaked)";
        status = "status-warning";
        advice = "Kehilangan cairan terlalu tinggi. Produk mungkin terlalu rapuh.";
    } else if (loss < STANDARDS.MOISTURE_LOSS_MIN) {
        statusText = "⚠️ UNDERBAKED";
        status = "status-warning";
        advice = "Bagian tengah mungkin masih basah. Tambah waktu panggang.";
    }

    resStatus.textContent = statusText;
    resStatus.className = `result-badge ${status}`;
    resAdvice.textContent = advice;
};
