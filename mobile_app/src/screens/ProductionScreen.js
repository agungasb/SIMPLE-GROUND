import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DataContext } from '../context/DataContext';
import SimpleGroundCalc from '../components/SimpleGroundCalc';
import CroissantCalc from '../components/CroissantCalc';

const ProductionScreen = () => {
    const { department } = useContext(DataContext);

    return (
        <View style={styles.container}>
            {department === 'simple-ground' ? (
                <SimpleGroundCalc />
            ) : (
                <CroissantCalc />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});

export default ProductionScreen;
