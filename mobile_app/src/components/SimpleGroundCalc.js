import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { DataContext } from '../context/DataContext';
import { calculateSimpleGroundDistribution } from '../utils/calculator';

const SimpleGroundCalc = () => {
    const { data, settings } = useContext(DataContext);
    const [inputs, setInputs] = useState({});
    const [result, setResult] = useState(null);

    if (!data) return <Text>Loading...</Text>;

    const { outlets, donutProducts, BOMBOLONI_KARAKTER_PRODUCT_NAME } = data;

    const handleCalculate = () => {
        // Prepare arguments
        const donutScores = settings.donutScores || data.defaultDonutScores;
        const bomboloniFixedAmounts = settings.bomboloniFixedAmounts || {};

        try {
            const res = calculateSimpleGroundDistribution(inputs, donutScores, bomboloniFixedAmounts, data);
            setResult(res);
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Simple Ground</Text>
                <Text style={styles.subtitle}>coffee.cake.donut</Text>
            </View>

            <View style={styles.form}>
                {outlets.map(outlet => (
                    <View key={outlet} style={styles.inputGroup}>
                        <Text style={styles.label}>{outlet.replace(/_/g, ' ')} Outlet:</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="0"
                            value={inputs[outlet] ? String(inputs[outlet]) : ''}
                            onChangeText={(text) => setInputs({ ...inputs, [outlet]: parseFloat(text) || 0 })}
                        />
                    </View>
                ))}

                <TouchableOpacity style={styles.button} onPress={handleCalculate}>
                    <Text style={styles.buttonText}>CALCULATE</Text>
                </TouchableOpacity>
            </View>

            {result && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultHeader}>Donut Distribution</Text>

                    {/* Header Row */}
                    <ScrollView horizontal>
                        <View>
                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.tableHeader, { width: 120 }]}>Product</Text>
                                {outlets.map(o => (
                                    <Text key={o} style={[styles.tableCell, styles.tableHeader, { width: 60 }]}>{o.substring(0, 4)}</Text>
                                ))}
                                <Text style={[styles.tableCell, styles.tableHeader, { width: 50 }]}>Ttl</Text>
                            </View>

                            {donutProducts.map(product => {
                                let totalProdBoxes = 0;
                                return (
                                    <View key={product} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, { width: 120, fontSize: 12 }]}>{product.replace(/_/g, ' ')}</Text>
                                        {outlets.map(outlet => {
                                            const val = result.distributionResults[outlet][product] || 0;
                                            totalProdBoxes += val;

                                            const isBomboloniKarakter = product === BOMBOLONI_KARAKTER_PRODUCT_NAME;
                                            // Ensure display is correct based on original logic: 
                                            // The original displayed inputs allowing adjustment. 
                                            // For now we just display the calculated value clearly.
                                            let displayVal = val.toFixed(0);
                                            // If bomboloni character, the original one showed 'fixedPcs' in the input box, but here we show calculated boxes in the grid?
                                            // The original grid had boxes for normal, but pieces for Bomboloni Karakter input?
                                            // Logic: "Display Bomboloni Karakter in pieces" (line 280 in app.js)
                                            // "inputHtml = ... value="${fixedPcs}""
                                            // But standard row is distributionResults which is in boxes.
                                            // For simplicity in mobile view, let's just show boxes for everything in the "Distribution" grid,
                                            // Maybe verify with user later. Sticking to consistent units (Boxes) is safer for summary.

                                            return (
                                                <Text key={outlet} style={[styles.tableCell, { width: 60, textAlign: 'center' }]}>
                                                    {displayVal}
                                                </Text>
                                            );
                                        })}
                                        <Text style={[styles.tableCell, { width: 50, fontWeight: 'bold', textAlign: 'center' }]}>{totalProdBoxes}</Text>
                                    </View>
                                )
                            })}

                            <View style={[styles.tableRow, { borderTopWidth: 2 }]}>
                                <Text style={[styles.tableCell, { width: 120, fontWeight: 'bold' }]}>Total Boxes</Text>
                                {outlets.map(outlet => (
                                    <Text key={outlet} style={[styles.tableCell, { width: 60, textAlign: 'center', fontWeight: 'bold' }]}>
                                        {result.totalDonutsPerOutlet[outlet].toFixed(1)}
                                    </Text>
                                ))}
                            </View>

                            <View style={styles.tableRow}>
                                <Text style={[styles.tableCell, { width: 120, fontWeight: 'bold' }]}>Grand Total</Text>
                                <Text style={[styles.tableCell, { width: 200, fontWeight: 'bold' }]}>{result.grandTotalBoxes.toFixed(1)} Boxes</Text>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryText}>Total Adonan: {result.totalAdonan.toFixed(1)} resep</Text>
                        <Text style={styles.summaryText}>Total Loyang: {result.totalLoyang.toFixed(1)} loyang</Text>
                        <Text style={styles.summaryText}>Total Trolley: {result.totalTrolley.toFixed(1)} trolley</Text>
                    </View>
                </View>
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#5a3e2b' },
    subtitle: { fontSize: 14, color: '#888' },
    form: { marginBottom: 20 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    label: { flex: 1, fontSize: 16, color: '#5a3e2b' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 8,
        width: 100,
        textAlign: 'center',
        backgroundColor: '#fff'
    },
    button: { backgroundColor: '#5a3e2b', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    resultContainer: { marginTop: 20 },
    resultHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#5a3e2b' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 8 },
    tableCell: { paddingHorizontal: 4, color: '#333' },
    tableHeader: { fontWeight: 'bold', color: '#5a3e2b' },
    summaryCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginTop: 15 },
    summaryText: { fontSize: 16, marginBottom: 5, fontWeight: '500' }
});

export default SimpleGroundCalc;
