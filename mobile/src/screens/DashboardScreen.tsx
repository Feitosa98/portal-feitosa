import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Receipt, Package, FileCheck, HardDrive, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';

export default function DashboardScreen() {
    const { user, signOut } = useAuth();
    const navigation = useNavigation<any>();
    const [stats, setStats] = useState({
        invoices: 0,
        receipts: 0,
        documents: 0,
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [invoicesRes, receiptsRes, documentsRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/receipts'),
                api.get('/documents'),
            ]);
            setStats({
                invoices: invoicesRes.data.length,
                receipts: receiptsRes.data.length,
                documents: documentsRes.data.length,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const menuItems = [
        { title: 'Notas Fiscais', icon: FileText, color: '#2563EB', route: 'Invoices', count: stats.invoices },
        { title: 'Recibos', icon: Receipt, color: '#10B981', route: 'Receipts', count: stats.receipts },
        { title: 'Inventários', icon: Package, color: '#F59E0B', route: 'Inventory', count: null },
        { title: 'Certificados', icon: FileCheck, color: '#8B5CF6', route: 'Certificates', count: null },
        { title: 'Drive', icon: HardDrive, color: '#EC4899', route: 'Drive', count: null },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá,</Text>
                    <Text style={styles.name}>{user?.name}</Text>
                </View>
                <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
                    <LogOut size={24} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Acesso Rápido</Text>

                <View style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.card}
                            onPress={() => navigation.navigate(item.route)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                                <item.icon size={28} color={item.color} />
                            </View>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            {item.count !== null && (
                                <Text style={styles.count}>{item.count} item(s)</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    greeting: {
        fontSize: 14,
        color: '#6B7280',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    logoutButton: {
        padding: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    card: {
        width: '47%',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    count: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});
