
// Product Aliases Map (Ported from app.js)
const productAliases = {
    "plain": "Plain Croissant",
    "croissant plain": "Plain Croissant",
    "flat croissan": "Plain Croissant",
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
    "egg tart": "Eggtart Coffee Town",
    "portuguese egg tart": "Portuguesse Eggtart C T",
    "portugis egg tart": "Portuguesse Eggtart C T",
    "hokkaido egg tart": "Hokkaido Eggtart C T",
    "hokkaido": "Hokkaido Eggtart C T",
    "pain au chocolate": "Pain Au Choco",
    "pain aux chocolate": "Pain Au Choco",
    "pain au choco": "Pain Au Choco",
    "pain au": "Pain Au Choco",
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
    "minicroipop cinamon": "Cinnamon Roll",
    "kouign aman": "Kouign Amman",
    "croisant petak": "Square Croissant",
    "smoke beef and cheese": "Smoked Beef Baker museum",
    "smoke beef": "Smoked Beef Baker museum",
    "coffe croissant": "Coffee Croissant",
    "danis c. brulle": "Creme Brule",
    "chocolate  mouse": "Choco Mousse Croissant",
    "chocolate mouse": "Choco Mousse Croissant",
    "croissant almond": "Almond Croissant",
    "sourdough choco": "Sourdough Choco",
    "sourdough ori": "Sourdough Ori",
    "sourdough cheese": "Sourdough Cheese",
    "cheesetart": "Cheesetart",
    "ovaltine croisan": "Ovaltine Croissant",
    "lotus c": "Lotus Croissant",
    "melted chese tomat": "Mozzarella Melt Cheese",
    "melted chese mashrom": "Mozzarella Melt Cheese",
    "almond croisan": "Almond Croissant",
    "ham & cheese croissant": "Ham & Cheese Smith",
    "ham&cheese": "Ham & Cheese Smith",
    "CROISANT PETAK  SMOKE BEEF": "Mozzarella Smoked Beef",
    "croissant petak ( baked) chess": "Mozzarella Melt Cheese",
    "almond.c": "Almond Croissant",
    "cream brule": "Creme Brule",
    "chocolate mousse": "Choco Mousse Croissant",
    "ham & cheese.c": "Ham & Cheese Smith",
    "egg curry c": "Croissant Eggcurry SG"
};

const outletKeywords = {
    "godiva": "Godiva MM",
    "smith": "Smith",
    "baker museum": "Baker Museum",
    "bread social": "Bread Social",
    "coffee town": "Coffee Town",
    "2bakers": "2Bakers",
    "simple ground": "Simple Ground",
    "simple ground reserve": "Simple Ground",
    "tobys": "Toby's"
};

export function parseWhatsAppOrder(text, productsList) {
    if (!text || !text.trim()) {
        return { parsedItemsByOutlet: {}, unknownLines: [], totalFilled: 0 };
    }

    const lines = text.split('\n');
    let currentMode = 'baked'; // Default mode
    let currentOutlet = 'Unknown Outlet'; // Default outlet context
    let parsedItemsByOutlet = {}; // { "Outlet Name": { "Product Name": { baked: 0, frozen: 0 } } }
    let unknownLines = [];
    let totalQtyFound = 0;

    const addQuantity = (outlet, productName, quantity, mode) => {
        if (!parsedItemsByOutlet[outlet]) parsedItemsByOutlet[outlet] = {};
        if (!parsedItemsByOutlet[outlet][productName]) parsedItemsByOutlet[outlet][productName] = { baked: 0, frozen: 0 };

        parsedItemsByOutlet[outlet][productName][mode] += quantity;
        totalQtyFound += quantity;
    };

    lines.forEach(line => {
        // Normalize whitespace
        const cleanLine = line.replace(/\s+/g, ' ').trim();
        if (!cleanLine) return;

        const lowerLine = cleanLine.toLowerCase();

        // 1. Detect Context Switches
        const plainContent = cleanLine.replace(/^\[.*?\]\s*.*?:/, '').trim();
        const lowerContent = plainContent.toLowerCase();

        // Check if this line is an Outlet Header
        let isHeader = false;
        for (const [key, standardizedName] of Object.entries(outletKeywords)) {
            if (lowerContent.includes(key)) {
                // Heuristic: If line contains "tanggal" or "orderan" or just the name, and NO quantity
                const hasQty = /(?:^|\s)(\d+(?:\.\d+)?)\s*(?:pcs|pc|box|bx|pack|pck)?$/i.test(plainContent);
                if (!hasQty) {
                    currentOutlet = standardizedName;
                    isHeader = true;
                    currentMode = 'baked'; // Reset mode for new outlet
                    break;
                }
            }
        }
        if (isHeader) return;

        // Detect Mode Switch
        if (lowerLine.includes('baked')) {
            currentMode = 'baked';
        } else if (lowerLine.includes('frozen')) {
            currentMode = 'frozen';
            if (cleanLine.match(/^croissant frozen$/i)) return; // Header line
        }

        // 2. Parse Quantity and Product
        let quantity = 0;
        let productText = plainContent;

        // Remove leading numbering
        productText = productText.replace(/^\d+[\.\),]\s*/, '');

        // Extract quantity
        const qtyMatch = productText.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:pcs|pc|box|bx|pack|pck)?$/i);
        if (qtyMatch) {
            quantity = parseFloat(qtyMatch[1]);
            productText = productText.substring(0, qtyMatch.index).trim();
        } else {
            const attachedQtyMatch = productText.match(/(\d+)$/);
            if (attachedQtyMatch) {
                quantity = parseFloat(attachedQtyMatch[1]);
                productText = productText.substring(0, attachedQtyMatch.index).trim();
            } else {
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

        // Alias-based Context Overrides
        if (matchedProductName) {
            if (matchedProductName === 'Eggtart Coffee Town' || matchedProductName === 'Eggtart Baker Museum') {
                if (currentOutlet === 'Baker Museum') matchedProductName = 'Eggtart Baker Museum';
                else matchedProductName = 'Eggtart Coffee Town';
            }
            if (matchedProductName === 'Portuguesse Eggtart C T' || matchedProductName === 'Portuguesse Eggtart B M') {
                if (currentOutlet === 'Baker Museum') matchedProductName = 'Portuguesse Eggtart B M';
            }
            if (matchedProductName === 'Hokkaido Eggtart C T' || matchedProductName === 'Hokkaido Eggtart B M') {
                if (currentOutlet === 'Baker Museum') matchedProductName = 'Hokkaido Eggtart B M';
            }
        }

        // C. Exact Match Fallback
        if (!matchedProductName) {
            const exactMatch = productsList.find(p => p.name.toLowerCase() === lowerProductText);
            if (exactMatch) matchedProductName = exactMatch.name;
        }

        if (matchedProductName) {
            const validProduct = productsList.find(p => p.name === matchedProductName);
            if (validProduct) {
                addQuantity(currentOutlet, matchedProductName, quantity, currentMode);
            } else {
                unknownLines.push(`${cleanLine} (Mapped to ${matchedProductName} but product not found)`);
            }
        } else {
            const ignoredKeywords = ["tanggal", "orderan", "date", "filling", "stick croissant"];
            if (!ignoredKeywords.some(k => lowerProductText.includes(k))) {
                if (/[a-zA-Z]/.test(productText)) {
                    unknownLines.push(cleanLine);
                }
            }
        }
    });

    let filledCount = 0;
    // Calculate filled count (sum of all items)
    for (const outlet in parsedItemsByOutlet) {
        for (const product in parsedItemsByOutlet[outlet]) {
            if (parsedItemsByOutlet[outlet][product].baked > 0) filledCount++;
            if (parsedItemsByOutlet[outlet][product].frozen > 0) filledCount++;
        }
    }

    return {
        parsedItemsByOutlet,
        unknownLines,
        totalFilled: filledCount
    };
}
