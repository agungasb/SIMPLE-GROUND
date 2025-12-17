import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { DataContext } from '../context/DataContext';

const SettingsScreen = () => {
    const { data, settings, saveSettings } = useContext(DataContext);
    const [isFlexible, setIsFlexible] = useState(true);
    const [localScores, setLocalScores] = useState({});
    const [localFixedPcs, setLocalFixedPcs] = useState({});
    const [loading, setLoading] = useState(true);

    if (!data) return <Text>Loading...</Text>;

    const { outlets, donutProducts, distributableDonutProducts, BOMBOLONI_KARAKTER_PRODUCT_NAME } = data;
    // Note: distributableDonutProducts was computed in app.js, in data.json it might not be explicit. 
    // We compute it here.
    const distributables = donutProducts.filter(p => p !== BOMBOLONI_KARAKTER_PRODUCT_NAME);

    useEffect(() => {
        if (settings) {
            setIsFlexible(settings.isFlexibleScoreMode !== false); // Default true
            setLocalScores(settings.donutScores || data.defaultDonutScores || {});
            setLocalFixedPcs(settings.bomboloniFixedAmounts || {});
            setLoading(false);
        }
    }, [settings]);

    const handleSave = async () => {
        const newSettings = {
            isFlexibleScoreMode: isFlexible,
            donutScores: localScores,
            bomboloniFixedAmounts: localFixedPcs
        };
        await saveSettings(newSettings);
        Alert.alert("Success", "Settings saved!");
    };

    const updateScore = (product, outlet, val) => {
        let num = parseFloat(val);
        if (isNaN(num) || num < 0) num = 0;
        if (!isFlexible && num > 5) num = 5;

        setLocalScores(prev => ({
            ...prev,
            [product]: {
                ...(prev[product] || {}),
                [outlet]: num
            }
        }));
    };

    const updateFixed = (outlet, val) => {
        let num = parseFloat(val);
        if (isNaN(num) || num < 0) num = 0;
        setLocalFixedPcs(prev => ({
            ...prev,
            [outlet]: num
        }));
    };

    if (loading) return <ActivityIndicator />;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Settings</Text>

            <View style={styles.settingRow}>
                <Text style={styles.label}>Flexible Scoring (0-Infinity)</Text>
                <Switch value={isFlexible} onValueChange={setIsFlexible} />
            </View>
            <Text style={styles.hint}>
                {isFlexible ? "Enter any positive number." : "Enter 0-5 (0=Low, 5=High)."}
            </Text>

            <Text style={styles.sectionTitle}>Donut Scores</Text>

            <ScrollView horizontal style={{ marginBottom: 20 }}>
                <View>
                    {/* Header */}
                    <View style={styles.row}>
                        <Text style={[styles.cell, styles.headCell, { width: 120 }]}>Product</Text>
                        {outlets.map(out => (
                            <Text key={out} style={[styles.cell, styles.headCell]}>{out.substring(0, 4)}</Text>
                        ))}
                    </View>

                    {distributables.map(prod => (
                        <View key={prod} style={styles.row}>
                            <Text style={[styles.cell, { width: 120, fontSize: 12 }]}>{prod.replace(/_/g, ' ')}</Text>
                            {outlets.map(out => {
                                const val = localScores[prod] && localScores[prod][out] !== undefined ? localScores[prod][out] : 0;
                                return (
                                    <TextInput
                                        key={out}
                                        style={styles.inputCell}
                                        keyboardType="numeric"
                                        value={String(val)}
                                        onChangeText={txt => updateScore(prod, out, txt)}
                                    />
                                );
                            })}
                        </View>
                    ))}

                    {/* Bomboloni Fixed Row */}
                    <View style={[styles.row, { borderTopWidth: 2, marginTop: 5 }]}>
                        <Text style={[styles.cell, { width: 120, fontSize: 12, fontWeight: 'bold' }]}>
                            {BOMBOLONI_KARAKTER_PRODUCT_NAME.replace(/_/g, ' ')} (Fixed Pcs)
                        </Text>
                        {outlets.map(out => {
                            const val = localFixedPcs[out] || 0;
                            return (
                                <TextInput
                                    key={out}
                                    style={[styles.inputCell, { backgroundColor: '#eef' }]}
                                    keyboardType="numeric"
                                    value={String(val)}
                                    onChangeText={txt => updateFixed(out, txt)}
                                />
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save Settings</Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#fff' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#5a3e2b' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    label: { fontSize: 16 },
    hint: { fontSize: 12, color: '#888', marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10, color: '#5a3e2b' },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    cell: { padding: 5 },
    headCell: { fontWeight: 'bold', width: 60, textAlign: 'center' },
    inputCell: {
        width: 60, borderWidth: 1, borderColor: '#ccc', borderRadius: 4,
        textAlign: 'center', padding: 5, marginHorizontal: 2
    },
    saveButton: { backgroundColor: '#5a3e2b', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default SettingsScreen;
