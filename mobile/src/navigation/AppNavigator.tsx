import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';

import InvoicesScreen from '../screens/InvoicesScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import InventoryScreen from '../screens/InventoryScreen';
import CertificatesScreen from '../screens/CertificatesScreen';
import DriveScreen from '../screens/DriveScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { signed, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {signed ? (
                    <>
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="Invoices" component={InvoicesScreen} />
                        <Stack.Screen name="Receipts" component={ReceiptsScreen} />
                        <Stack.Screen name="Inventory" component={InventoryScreen} />
                        <Stack.Screen name="Certificates" component={CertificatesScreen} />
                        <Stack.Screen name="Drive" component={DriveScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
