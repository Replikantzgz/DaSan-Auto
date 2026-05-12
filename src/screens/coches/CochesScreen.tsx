import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import { CocheDisponible, EstadoCoche } from '../../types';
import { CochesStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<CochesStackParamList, 'CochesList'>;

const FILTROS: { key: EstadoCoche | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'disponible', label: 'Disponibles' },
  { key: 'reservado', label: 'Reservados' },
  { key: 'vendido', label: 'Vendidos' },
];

const COMBUSTIBLE_LABEL: Record<string, string> = {
  gasolina: '⛽ Gasolina',
  diesel: '🛢️ Diésel',
  hibrido: '🔋 Híbrido',
  electrico: '⚡ Eléctrico',
  hibrido_enchufable: '🔌 Híbrido E.',
};

export default function CochesScreen() {
  const navigation = useNavigation<Nav>();
  const [coches, setCoches] = useState<CocheDisponible[]>([]);
  const [filtro, setFiltro] = useState<EstadoCoche | 'todos'>('disponible');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    let q = supabase.from('coches_disponibles').select('*').order('created_at', { ascending: false });
    if (filtro !== 'todos') q = q.eq('estado', filtro);
    const { data } = await q;
    setCoches((data ?? []) as CocheDisponible[]);
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
    Alert.alert('Eliminar coche', `¿Eliminar ${nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('coches_disponibles').delete().eq('id', id);
          setCoches((prev) => prev.filter((c) => c.id !== id));
        },
      },
    ]);
  };

  const fmtEur = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const getCosteTotal = (c: CocheDisponible) =>
    c.precio_compra + (c.costes_extra ?? []).reduce((s, ce) => s + ce.importe, 0);

  const filtered = coches.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.marca.toLowerCase().includes(q) ||
      c.modelo.toLowerCase().includes(q) ||
      (c.matricula ?? '').toLowerCase().includes(q) ||
      (c.color ?? '').toLowerCase().includes(q) ||
      (c.tipo ?? '').toLowerCase().includes(q)
    );
  });

  const renderItem = ({ item }: { item: CocheDisponible }) => {
    const costeTotal = getCosteTotal(item);
    const margen = item.precio_venta - costeTotal;
    const margenPct = costeTotal > 0 ? (margen / costeTotal) * 100 : 0;
    const portada = item.fotos?.[0];

    return (
      <TouchableOpacity
        style={[styles.card, shadow.md]}
        onPress={() => navigation.navigate('CocheForm', { id: item.id })}
        activeOpacity={0.85}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          {portada ? (
            <Image source={{ uri: portada }} style={styles.carImage} />
          ) : (
            <View style={styles.carIcon}>
              <Ionicons name="car-sport" size={24} color={colors.primary} />
            </View>
          )}
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle}>{item.marca} {item.modelo}</Text>
            <Text style={styles.cardSub}>
              {[item.anio, item.version].filter(Boolean).join(' · ')}
            </Text>
            <View style={styles.tagsRow}>
              {item.tipo ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.tipo}</Text>
                </View>
              ) : null}
              {item.combustible ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{COMBUSTIBLE_LABEL[item.combustible] ?? item.combustible}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Badge estado={item.estado} size="sm" />
        </View>

        {/* Matrícula + km */}
        {(item.matricula || item.km) ? (
          <View style={styles.extraRow}>
            {item.matricula ? (
              <View style={styles.plateChip}>
                <Text style={styles.plateText}>{item.matricula}</Text>
              </View>
            ) : null}
            {item.km ? (
              <View style={styles.detail}>
                <Ionicons name="speedometer-outline" size={13} color={colors.textMuted} />
                <Text style={styles.detailText}>{item.km.toLocaleString('es-ES')} km</Text>
              </View>
            ) : null}
            {item.color ? (
              <View style={styles.detail}>
                <Ionicons name="color-palette-outline" size={13} color={colors.textMuted} />
                <Text style={styles.detailText}>{item.color}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Desglose financiero */}
        <View style={styles.financials}>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Compra</Text>
            <Text style={styles.finValue}>{fmtEur(item.precio_compra)}</Text>
          </View>
          {(item.costes_extra ?? []).length > 0 && (
            <>
              {item.costes_extra.map((ce, i) => (
                <View key={i} style={styles.finRow}>
                  <Text style={styles.finLabelExtra}>+ {ce.nombre}</Text>
                  <Text style={styles.finValueExtra}>{fmtEur(ce.importe)}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.finRow}>
                <Text style={styles.finLabelTotal}>Coste total</Text>
                <Text style={styles.finValueTotal}>{fmtEur(costeTotal)}</Text>
              </View>
            </>
          )}
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Venta</Text>
            <Text style={[styles.finValue, { color: colors.primary }]}>{fmtEur(item.precio_venta)}</Text>
          </View>
        </View>

        {/* Margen */}
        <View style={[styles.margenWrap, { backgroundColor: margen >= 0 ? colors.successLight : colors.dangerLight }]}>
          <Ionicons
            name={margen >= 0 ? 'trending-up' : 'trending-down'}
            size={16}
            color={margen >= 0 ? colors.success : colors.danger}
          />
          <Text style={[styles.margenText, { color: margen >= 0 ? colors.success : colors.danger }]}>
            Margen: {fmtEur(margen)} ({margenPct.toFixed(1)}%)
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.fechaText}>
            {new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            onPress={() => handleDelete(item.id, `${item.marca ?? ''} ${item.modelo ?? ''}`.trim() || 'este coche')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Búsqueda */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por marca, modelo, matrícula..."
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
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>{search ? 'Sin resultados' : 'Sin coches en cartera'}</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, shadow.lg]}
        onPress={() => navigation.navigate('CocheForm', {})}
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
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md, position: 'relative' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  carImage: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.border },
  carIcon: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  cardTitleWrap: { flex: 1 },
  cardTitle: { ...typography.h4 },
  cardSub: { ...typography.bodySmall, marginTop: 2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: { backgroundColor: colors.background, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.border },
  tagText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  extraRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  plateChip: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border },
  plateText: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: colors.text },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: colors.textSecondary },
  financials: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm, gap: 4 },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  finLabel: { fontSize: 13, color: colors.textSecondary },
  finValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  finLabelExtra: { fontSize: 12, color: colors.textMuted, paddingLeft: spacing.sm },
  finValueExtra: { fontSize: 12, color: colors.textMuted },
  finLabelTotal: { fontSize: 14, fontWeight: '700', color: colors.text },
  finValueTotal: { fontSize: 14, fontWeight: '700', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  margenWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  margenText: { fontSize: 13, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  fechaText: { fontSize: 11, color: colors.textMuted },
  deleteBtn: { position: 'absolute', top: spacing.md, right: spacing.md },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { ...typography.bodySmall, color: colors.textMuted },
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
});
