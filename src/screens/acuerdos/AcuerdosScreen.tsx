import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { AcuerdoCerrado } from '../../types';
import { AcuerdosStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<AcuerdosStackParamList, 'AcuerdosList'>;

type Periodo = 'mes' | 'todo';

export default function AcuerdosScreen() {
  const navigation = useNavigation<Nav>();
  const [acuerdos, setAcuerdos] = useState<AcuerdoCerrado[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    let q = supabase.from('acuerdos_cerrados').select('*').order('fecha_acuerdo', { ascending: false });
    if (periodo === 'mes') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      q = q.gte('fecha_acuerdo', start);
    }
    const { data } = await q;
    setAcuerdos((data ?? []) as AcuerdoCerrado[]);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [periodo])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = (id: string, label: string) => {
    Alert.alert('Eliminar acuerdo', `¿Eliminar el acuerdo de ${label}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('acuerdos_cerrados').delete().eq('id', id);
          setAcuerdos((prev) => prev.filter((a) => a.id !== id));
        },
      },
    ]);
  };

  const fmtEur = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const totalBeneficio = acuerdos.reduce((s, a) => s + a.beneficio, 0);

  const renderItem = ({ item }: { item: AcuerdoCerrado }) => (
    <TouchableOpacity
      style={[styles.card, shadow.md]}
      onPress={() => navigation.navigate('AcuerdoForm', { id: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={20} color={colors.white} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.coche_marca} {item.coche_modelo}</Text>
          <Text style={styles.cardSub}>{item.coche_anio ? `${item.coche_anio} · ` : ''}{item.cliente_nombre}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.beneficioVal}>+{fmtEur(item.beneficio)}</Text>
          <Text style={styles.fechaText}>
            {new Date(item.fecha_acuerdo).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={styles.financialsWrap}>
        <FinRow label="Coste total" value={fmtEur(item.coste_total)} />
        {item.gastos_adicionales > 0 && (
          <FinRow label="Gastos adicionales" value={`- ${fmtEur(item.gastos_adicionales)}`} muted />
        )}
        <FinRow label="Precio final de venta" value={fmtEur(item.precio_final)} highlight />
        <View style={styles.sep} />
        <FinRow label="BENEFICIO" value={`+${fmtEur(item.beneficio)}`} green />
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id, `${item.coche_marca} ${item.coche_modelo}`)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Filtro periodo */}
      <View style={styles.periodoWrap}>
        {(['mes', 'todo'] as Periodo[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodoChip, periodo === p && styles.periodoChipActive]}
            onPress={() => setPeriodo(p)}
          >
            <Text style={[styles.periodoText, periodo === p && styles.periodoTextActive]}>
              {p === 'mes' ? 'Este mes' : 'Historial'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Banner total */}
      {!loading && acuerdos.length > 0 && (
        <View style={styles.totalBanner}>
          <Ionicons name="trophy-outline" size={18} color={colors.primary} />
          <Text style={styles.totalBannerText}>
            {acuerdos.length} acuerdo{acuerdos.length !== 1 ? 's' : ''} · Beneficio: <Text style={{ fontWeight: '800' }}>{fmtEur(totalBeneficio)}</Text>
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={acuerdos}
          keyExtractor={(a) => a.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>Sin acuerdos {periodo === 'mes' ? 'este mes' : 'registrados'}</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, shadow.lg]}
        onPress={() => navigation.navigate('AcuerdoForm', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

function FinRow({ label, value, highlight, green, muted }: { label: string; value: string; highlight?: boolean; green?: boolean; muted?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
      <Text style={{ fontSize: 12, color: muted ? colors.textMuted : colors.textSecondary }}>{label}</Text>
      <Text style={{
        fontSize: 12,
        fontWeight: green ? '700' : '500',
        color: green ? colors.success : highlight ? colors.primary : muted ? colors.textMuted : colors.text,
      }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  periodoWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  periodoChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodoChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodoText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  periodoTextActive: { color: colors.white },
  totalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalBannerText: { fontSize: 14, color: colors.primary },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    position: 'relative',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  cardTitle: { ...typography.h4, fontSize: 15 },
  cardSub: { ...typography.bodySmall, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  beneficioVal: { fontSize: 16, fontWeight: '800', color: colors.success },
  fechaText: { ...typography.caption, marginTop: 2 },
  financialsWrap: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  sep: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  deleteBtn: { position: 'absolute', top: spacing.md, right: spacing.md },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { ...typography.bodySmall, color: colors.textMuted },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
