import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Alert,
    TextInput,
    Modal,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getBeneficiaries, updateBeneficiary, deleteBeneficiary, Beneficiary } from '@/app/utils/beneficiary';

const CATEGORIES = ['ALL', 'AIRTIME', 'DATA', 'ELECTRICITY', 'CABLE', 'EDUCATION'];

export default function BeneficiariesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [activeCategory, setActiveCategory] = useState('ALL');
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [loading, setLoading] = useState(true);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingBen, setEditingBen] = useState<Beneficiary | null>(null);
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchBeneficiaries();
    }, [activeCategory]);

    const fetchBeneficiaries = async () => {
        setLoading(true);
        const categoryQuery = activeCategory === 'ALL' ? undefined : activeCategory;
        const res = await getBeneficiaries(categoryQuery as any);
        if (res.success) {
            setBeneficiaries(res.data);
        } else {
            Alert.alert('Error', res.error || 'Failed to load beneficiaries.');
        }
        setLoading(false);
    };

    const handleEdit = (ben: Beneficiary) => {
        setEditingBen(ben);
        setEditName(ben.name);
        setEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editingBen) return;
        setIsSaving(true);
        const res = await updateBeneficiary(editingBen.id, editName);
        setIsSaving(false);

        if (res.success) {
            setEditModalVisible(false);
            fetchBeneficiaries();
        } else {
            Alert.alert('Error', res.error || 'Failed to update beneficiary.');
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete Beneficiary', 'Are you sure you want to delete this beneficiary?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const res = await deleteBeneficiary(id);
                    if (res.success) {
                        fetchBeneficiaries();
                    } else {
                        Alert.alert('Error', res.error || 'Failed to delete beneficiary.');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: Beneficiary }) => {
        return (
            <View style={styles.card}>
                <View style={styles.iconBox}>
                    <Ionicons name="person-outline" size={24} color="#2563EB" />
                </View>
                <View style={styles.cardContent}>
                    <Text style={styles.cardName}>{item.name || item.identifier}</Text>
                    <Text style={styles.cardId}>{item.identifier}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.type}</Text>
                    </View>
                </View>
                <View style={styles.actionsBox}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                        <Ionicons name="pencil" size={18} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { marginLeft: 12 }]}>
                        <Ionicons name="trash" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Beneficiaries</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabsContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={CATEGORIES}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.tabBtn, activeCategory === item && styles.tabBtnActive]}
                            onPress={() => setActiveCategory(item)}
                        >
                            <Text style={[styles.tabText, activeCategory === item && styles.tabTextActive]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : beneficiaries.length === 0 ? (
                <View style={styles.centerBox}>
                    <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No saved beneficiaries found.</Text>
                </View>
            ) : (
                <FlatList
                    data={beneficiaries}
                    renderItem={renderItem}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                />
            )}

            <Modal visible={editModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Beneficiary</Text>
                        <Text style={styles.modalSub}>{editingBen?.identifier}</Text>

                        <TextInput
                            style={styles.modalInput}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Alias / Name"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setEditModalVisible(false)}>
                                <Text style={styles.modalCloseText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveEdit} disabled={isSaving}>
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.modalSaveText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backBtn: { width: 40, alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    tabsContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 12 },
    tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 10 },
    tabBtnActive: { backgroundColor: '#111827' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    tabTextActive: { color: '#FFFFFF' },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 16, color: '#9CA3AF', fontSize: 15 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
    iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardContent: { flex: 1 },
    cardName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
    cardId: { fontSize: 14, color: '#6B7280', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 8 },
    badge: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '700', color: '#4B5563', letterSpacing: 0.5 },
    actionsBox: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 8, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
    modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 20, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    modalInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 16, marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCloseBtn: { flex: 1, height: 48, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    modalCloseText: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
    modalSaveBtn: { flex: 1, height: 48, backgroundColor: '#2563EB', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    modalSaveText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
