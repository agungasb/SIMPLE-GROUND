import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { DataContext } from '../context/DataContext';
import { parseWhatsAppOrder } from '../utils/parser';
import { calculateCroissantProduction } from '../utils/calculator';
import { Ionicons } from '@expo/vector-icons';

const CroissantCalc = () => {
    const { data } = useContext(DataContext);
    const [whatsappText, setWhatsappText] = useState('');
    const [parsedData, setParsedData] = useState(null); // { parsedItemsByOutlet, unknownLines, totalFilled }
    const [calculationResult, setCalculationResult] = useState(null);

    // Manual inputs state could be complex if we want full editability. 
    // For now, we drive the calculator primarily from the parser output + manual tweaks if we implement that UI.
    // The web app fills inputs then calculates from inputs.
    // In mobile, we'll store the "Product Input Summary" state effectively.
    // Let's store: { ProductName: { baked: 0, frozen: 0 } }
    const [productInputs, setProductInputs] = useState({});

    if (!data) return <Text>Loading...</Text>;

    const { croissantProductsList, croissantRecipes } = data.croissant_department.product_management ?
        {
            croissantProductsList: data.croissant_department.product_management.croissantProducts,
            croissantRecipes: data.croissant_department.recipe_management
        } :
        { // Fallback if data structure slightly different (checked app.js, it extracted these)
            croissantProductsList: data.croissant_department.product_management.croissantProducts,
            croissantRecipes: data.croissant_department.recipe_management
        };

    // Using filtered list if needed, similar to app.js which filters intermediate products
    // app.js line 134: filters rawCroissantProducts to remove intermediate ones.
    // This logic is important to replicate for the "ProductsList" we pass to parser.
    const intermediateRecipeKeys = [
        "adonan_original", "adonan_charcoal", "adonan_brioche", "adonan_puff_pastry",
        "laminasi_original", "laminasi_charcoal", "laminasi_kouign_amann", "laminasi_puff_pastry"
    ];

    const finalCroissantProducts = croissantProductsList.filter(productObj => {
        const recipeKeysToCheck = [];
        if (productObj.recipe_key) recipeKeysToCheck.push(productObj.recipe_key);
        if (productObj.recipe_key_baked) recipeKeysToCheck.push(productObj.recipe_key_baked);
        if (productObj.recipe_key_frozen) recipeKeysToCheck.push(productObj.recipe_key_frozen);
        return !recipeKeysToCheck.some(key => intermediateRecipeKeys.includes(key));
    });

    const handleParse = () => {
        const result = parseWhatsAppOrder(whatsappText, finalCroissantProducts);
        setParsedData(result);
        if (result.totalFilled > 0) {
            // Aggregate totals for the inputs
            let newInputs = {};
            for (const outlet in result.parsedItemsByOutlet) {
                for (const product in result.parsedItemsByOutlet[outlet]) {
                    if (!newInputs[product]) newInputs[product] = { baked: 0, frozen: 0 };
                    newInputs[product].baked += result.parsedItemsByOutlet[outlet][product].baked;
                    newInputs[product].frozen += result.parsedItemsByOutlet[outlet][product].frozen;
                }
            }
            setProductInputs(newInputs);
            Alert.alert("Success", `Parsed ${result.totalFilled} items from text.`);
        } else {
            Alert.alert("Info", "No valid items found.");
        }
    };

    const handleCalculate = () => {
        // Calculate based on productInputs
        // Transform productInputs to format expected by calc: { "ProductName": { baked, frozen } }
        // It is already in that format mostly.
        const res = calculateCroissantProduction(productInputs, finalCroissantProducts, croissantRecipes);
        setCalculationResult(res);
    };

    const handleInteractWithProduct = (product) => {
        // Maybe open modal to edit qty? Skipping for MVP
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Dept. Croissant</Text>
                <Text style={styles.subtitle}>Jer Basuki Mawa Beya.</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}><Ionicons name="logo-whatsapp" size={16} /> Paste Order</Text>
                <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={6}
                    placeholder="Paste WhatsApp order text here..."
                    value={whatsappText}
                    onChangeText={setWhatsappText}
                />
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.button, styles.parseButton]} onPress={handleParse}>
                        <Text style={styles.buttonText}>Parse & Fill</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={() => { setWhatsappText(''); setParsedData(null); }}>
                        <Text style={styles.buttonText}>Clear</Text>
                    </TouchableOpacity>
                </View>
                {parsedData && parsedData.unknownLines.length > 0 && (
                    <Text style={styles.warningText}>{parsedData.unknownLines.length} unknown lines found.</Text>
                )}
            </View>

            {/* Inputs Section (Read Only Summary for now, or edit support if easy) */}
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Input Summary (Pcs)</Text>
                {Object.keys(productInputs).length === 0 ? (
                    <Text style={{ fontStyle: 'italic', color: '#aaa' }}>No inputs filled.</Text>
                ) : (
                    Object.entries(productInputs).map(([name, qtys]) => (
                        (qtys.baked > 0 || qtys.frozen > 0) && (
                            <View key={name} style={styles.row}>
                                <Text style={{ flex: 1 }}>{name}</Text>
                                <Text style={{ width: 60, textAlign: 'center' }}>B: {qtys.baked}</Text>
                                <Text style={{ width: 60, textAlign: 'center' }}>F: {qtys.frozen}</Text>
                            </View>
                        )
                    ))
                )}
            </View>

            <TouchableOpacity style={styles.calcButton} onPress={handleCalculate}>
                <Text style={styles.calcButtonText}>CALCULATE PRODUCTION</Text>
            </TouchableOpacity>

            {calculationResult && (
                <View style={[styles.section, { backgroundColor: '#eefcf5', borderColor: '#25D366', borderWidth: 1 }]}>
                    <Text style={[styles.sectionHeader, { color: '#128C7E' }]}>Production List</Text>

                    <Text style={styles.subHeader}>Recipes to Bake/Prepare:</Text>
                    <View style={styles.table}>
                        {calculationResult.recipeResults.map((item, idx) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { flex: 2 }]}>{item.displayName}</Text>
                                <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold', textAlign: 'right' }]}>{item.amount.toFixed(2)} Resep</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={[styles.subHeader, { marginTop: 15 }]}>Total Ingredients:</Text>
                    <View style={styles.table}>
                        {calculationResult.ingredientResults.map((item, idx) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { flex: 2 }]}>{item.name.replace(/_/g, ' ')}</Text>
                                <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{item.amount.toFixed(0)}</Text>
                                <Text style={[styles.tableCell, { width: 40, textAlign: 'right', fontSize: 10 }]}>{item.unit}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    header: { marginBottom: 15 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#5a3e2b' },
    subtitle: { fontSize: 14, color: '#888' },
    card: { backgroundColor: '#fff', borderRadius: 8, padding: 10, elevation: 2, marginBottom: 15 },
    cardTitle: { fontWeight: 'bold', marginBottom: 5, color: '#5a3e2b' },
    textArea: { height: 100, borderColor: '#ddd', borderWidth: 1, borderRadius: 5, padding: 8, textAlignVertical: 'top' },
    buttonRow: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
    button: { flex: 1, padding: 10, borderRadius: 5, alignItems: 'center', marginHorizontal: 2 },
    parseButton: { backgroundColor: '#25D366' },
    clearButton: { backgroundColor: '#d9534f' },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    warningText: { color: 'orange', fontSize: 12, marginTop: 5 },
    section: { marginBottom: 20, backgroundColor: '#fff', padding: 10, borderRadius: 8 },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 5, marginBottom: 5, color: '#5a3e2b' },
    subHeader: { fontSize: 15, fontWeight: '600', marginTop: 5, marginBottom: 5, color: '#5a3e2b' },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#f0f0f0', paddingVertical: 8 },
    calcButton: { backgroundColor: '#5a3e2b', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
    calcButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    table: { marginTop: 5 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6 },
    tableCell: { fontSize: 13, color: '#333' }
});

export default CroissantCalc;
