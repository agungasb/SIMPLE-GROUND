import React, { useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native';
import { DataContext } from '../context/DataContext';
import { scaleRecipe } from '../utils/recipes';
import { Ionicons } from '@expo/vector-icons';

const RecipeScreen = () => {
    const { data, department } = useContext(DataContext);
    const [selectedRecipeKey, setSelectedRecipeKey] = useState(null);
    const [multiplier, setMultiplier] = useState('1');
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    if (!data) return <Text>Loading...</Text>;

    const recipes = department === 'simple-ground' ? data.recipes : data.croissant_department.recipe_management;

    // Filterable list for modal
    const recipeList = useMemo(() => {
        return Object.keys(recipes)
            .filter(key => !key.endsWith('_instructions'))
            .map(key => ({ key, name: key.replace(/_/g, ' ') }))
            .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [recipes, searchQuery]);

    const handleSelect = (key) => {
        setSelectedRecipeKey(key);
        setModalVisible(false);
    };

    const scaledResult = useMemo(() => {
        if (!selectedRecipeKey) return null;
        const mul = parseFloat(multiplier);
        if (isNaN(mul) || mul <= 0) return null;
        return scaleRecipe(selectedRecipeKey, mul, recipes);
    }, [selectedRecipeKey, multiplier, recipes]);

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Choose Recipe:</Text>
                <TouchableOpacity style={styles.pickerTrigger} onPress={() => setModalVisible(true)}>
                    <Text style={styles.pickerText}>
                        {selectedRecipeKey ? selectedRecipeKey.replace(/_/g, ' ') : "Select a recipe..."}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#555" />
                </TouchableOpacity>

                <Text style={styles.label}>Scale Factor:</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={multiplier}
                    onChangeText={setMultiplier}
                    placeholder="1.0"
                />
            </View>

            <ScrollView style={styles.resultContainer}>
                {scaledResult ? (
                    <>
                        <Text style={styles.recipeTitle}>
                            {selectedRecipeKey.replace(/_/g, ' ')} (x{multiplier})
                        </Text>

                        <View style={styles.table}>
                            <View style={[styles.tableRow, { backgroundColor: '#f0f0f0' }]}>
                                <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>Ingredient</Text>
                                <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Amount</Text>
                                <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Unit</Text>
                            </View>
                            {scaledResult.ingredients.map((ing, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { flex: 2 }]}>{ing.name}</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{ing.amount.toFixed(0)}</Text>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{ing.unit}</Text>
                                </View>
                            ))}
                        </View>

                        {scaledResult.instructions && scaledResult.instructions.length > 0 && (
                            <View style={styles.instructions}>
                                <Text style={styles.subHeader}>Instructions:</Text>
                                {scaledResult.instructions.map((inst, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', marginBottom: 4 }}>
                                        <Text style={{ fontWeight: 'bold', width: 20 }}>{idx + 1}.</Text>
                                        <Text style={{ flex: 1 }}>{inst}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                ) : (
                    <Text style={styles.placeholderText}>Select a recipe and scale factor to view ingredients.</Text>
                )}
                <View style={{ height: 50 }} />
            </ScrollView>

            {/* Modal for Recipe Selection */}
            <Modal visible={modalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select Recipe</Text>
                        <View style={{ width: 24 }} />
                    </View>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search recipe..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <FlatList
                        data={recipeList}
                        keyExtractor={item => item.key}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => handleSelect(item.key)}>
                                <Text style={styles.modalItemText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5, color: '#5a3e2b' },
    pickerTrigger: {
        borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 5,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    pickerText: { fontSize: 16, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, fontSize: 16 },
    resultContainer: { flex: 1 },
    recipeTitle: { fontSize: 22, fontWeight: 'bold', color: '#5a3e2b', marginBottom: 15, textAlign: 'center' },
    table: { borderWidth: 1, borderColor: '#eee', marginBottom: 20 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#eee', padding: 10 },
    tableCell: { fontSize: 14 },
    instructions: { marginTop: 10 },
    subHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#5a3e2b' },
    modalContainer: { flex: 1, paddingTop: 50, paddingHorizontal: 20, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    searchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10 },
    modalItem: { padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
    modalItemText: { fontSize: 16 },
    placeholderText: { textAlign: 'center', color: '#888', marginTop: 50 }
});

export default RecipeScreen;
