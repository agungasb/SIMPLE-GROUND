import React, { createContext, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
// We import data directly since it is a local asset for now.
// In a real app we might fetch it or fs.read it, but require is easiest for static bundler.
import localData from '../../assets/data.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [data, setData] = useState(null);
    const [department, setDepartment] = useState('simple-ground'); // 'simple-ground' or 'croissant'
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({});

    useEffect(() => {
        const loadInit = async () => {
            // Simulate async load if we were fetching
            setData(localData);

            // Load settings from storage
            try {
                const storedSettings = await AsyncStorage.getItem('settings');
                if (storedSettings) {
                    setSettings(JSON.parse(storedSettings));
                }
            } catch (e) {
                console.error("Failed to load settings", e);
            }
            setLoading(false);
        };
        loadInit();
    }, []);

    const saveSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (e) {
            console.error("Failed to save settings", e);
        }
    };

    if (loading) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading Data...</Text></View>;
    }

    return (
        <DataContext.Provider value={{
            data,
            department,
            setDepartment,
            settings,
            saveSettings
        }}>
            {children}
        </DataContext.Provider>
    );
};
