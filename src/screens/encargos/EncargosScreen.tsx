import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import Badge from '../../components/Badge';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { Encargo, EstadoEncargo } from '../../types';
import { EncargosStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<EncargosStackParamList, 'EncargosList'>;

const FILTROS: { key: EstadoEncargo | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'completado', label: 'Completados' },
  { key: 'cancelado', label: 'Cancelados' },
];

export default function EncargosScreen() {
  const navigation = useNavigation<Nav>();
  const [encargos, setEncargos] = useState<Encargo[]>([]);
  const [filtro, setFiltro] = useState<EstadoEncargo | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    let q = supabase.from('encargos').select('*').order('created_at', { ascending: false });
    if (filtro !== 'todos') q = q.eq('estado', filtro);
    const { data } = await q;
    setEncargos((data ?? []) as Encargo[]);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [filtro])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = (id: string, nombre: string) => {
    Alert.alert('Eliminar encargo', `¿Eliminar el encargo de ${nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('encargos').delete().eq('id', id);
          setEncargos((prev) => prev.filter((e) => e.id !== id));
        },
      },
    ]);
  };

  const fmtEur = (n?: number) =>
    n ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : '—';

  const filtered = encargos.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.cliente_nombre.toLowerCase().includes(q) ||
      (e.cliente_telefono ?? '').includes(q) ||
      (e.marca ?? '').toLowerCase().includes(q) ||
      (e.modelo ?? '').toLowerCase().includes(q) ||
      (e.caracteristicas ?? '').toLowerCase().includes(q)
    );
  });

  const renderItem = ({ item }: { item: Encargo }) => (
    <TouchableOpacity
      style={[styles.card, shadow.sm]}
      onPress={() => navigation.navigate('EncargoForm', { id: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle}>{item.cliente_nombre}</Text>
          {(item.marca || item.modelo) ? (
            <Text style={styles.cardCoche}>{[item.marca, item.modelo].filter(Boolean).join(' ')}</Text>
          ) : null}
        </View>
        <Badge estado={item.estado} />
      </View>

      <View style={styles.cardDetails}>
        {item.presupuesto ? (
          <View style={styles.detail}>
            <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>{fmtEur(item.presupuesto)}</Text>
          </View>
        ) : null}
        {(item.anio_min || item.anio_max) ? (
          <View style={styles.detail}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>
              {item.anio_min && item.anio_max ? `${item.anio_min}–${item.anio_max}` : (item.anio_min ?? item.anio_max)}
            </Text>
          </View>
        ) : null}
        {item.cliente_telefono ? (
          <View style={styles.detail}>
            <Ionicons name="call-outline" size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>{item.cliente_telefono}</Text>
          </View>
        ) : null}
      </View>

      {item.caracteristicas ? (
        <View style={styles.caracteristicasWrap}>
          <Ionicons name="list-outline" size={13} color={colors.textMuted} />
          <Text style={styles.caracteristicasText} numberOfLines={2}>{item.caracteristicas}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id, item.cliente_nombre)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Búsqueda */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, coche, características..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <FlatList
        data={FILTROS}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtroList}
        contentContainerStyle={styles.filtroContent}
        keyExtractor={(f) => f.key}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.filtroChip, filtro === f.key && styles.filtroChipActive]}
            onPress={() => setFiltro(f.key)}
          >
            <Text style={[styles.filtroText, filtro === f.key && styles.filtroTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>{search ? 'Sin resultados' : 'Sin encargos'}</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, shadow.lg]}
        onPress={() => navigation.navigate('EncargoForm', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    marginBottom: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  filtroList: { backgroundColor: colors.surface, maxHeight: 56, borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: spacing.sm },
  filtroContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  filtroChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  filtroChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filtroText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filtroTextActive: { color: colors.white },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, position: 'relative' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardLeft: { flex: 1, marginRight: spacing.sm },
  cardTitle: { ...typography.h4 },
  cardCoche: { ...typography.bodySmall, marginTop: 2, color: colors.primary, fontWeight: '600' },
  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: 4 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: colors.textSecondary },
  caracteristicasWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 4 },
  caracteristicasText: { flex: 1, fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  deleteBtn: { position: 'absolute', top: spacing.md, right: spacing.md },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { ...typography.bodySmall, color: colors.textMuted },
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
});
