import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { DataProvider, DataContext } from './src/context/DataContext';
import ProductionScreen from './src/screens/ProductionScreen';
import RecipeScreen from './src/screens/RecipeScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const HeaderTitle = () => {
    const { department, setDepartment } = useContext(DataContext);
    const isSimpleGround = department === 'simple-ground';

    return (
        <TouchableOpacity
            onPress={() => setDepartment(isSimpleGround ? 'croissant' : 'simple-ground')}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 20
            }}
        >
            <Ionicons name={isSimpleGround ? "cafe" : "croissant"} size={20} color="#5a3e2b" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#5a3e2b' }}>
                {isSimpleGround ? "Simple Ground" : "Dept. Croissant"}
            </Text>
            <Ionicons name="caret-down" size={16} color="#5a3e2b" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
    );
};

const NavigationParams = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Production') {
                        iconName = focused ? 'calculator' : 'calculator-outline';
                    } else if (route.name === 'Recipe') {
                        iconName = focused ? 'book' : 'book-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#5a3e2b',
                tabBarInactiveTintColor: 'gray',
                headerTitle: (props) => <HeaderTitle {...props} />,
                headerStyle: {
                    backgroundColor: '#f9e1c0',
                },
                headerTitleAlign: 'center',
            })}
        >
            <Tab.Screen name="Production" component={ProductionScreen} />
            <Tab.Screen name="Recipe" component={RecipeScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
};

export default function App() {
    return (
        <DataProvider>
            <NavigationContainer>
                <NavigationParams />
                <StatusBar style="auto" />
            </NavigationContainer>
        </DataProvider>
    );
}
