import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/StatCard';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { AcuerdoCerrado, Encargo } from '../types';

interface Stats {
  encargos_pendientes: number;
  encargos_en_proceso: number;
  coches_disponibles: number;
  coches_reservados: number;
  acuerdos_mes: number;
  beneficio_mes: number;
  beneficio_total: number;
}

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [ultimosAcuerdos, setUltimosAcuerdos] = useState<AcuerdoCerrado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const nombre = user?.nombre ?? 'Socio';

  const loadData = async () => {
    const [encRes, cochesRes, acuerdosRes, acuerdosUltRes] = await Promise.all([
      supabase.from('encargos').select('estado'),
      supabase.from('coches_disponibles').select('estado'),
      supabase.from('acuerdos_cerrados').select('beneficio, fecha_acuerdo').order('fecha_acuerdo', { ascending: false }),
      supabase.from('acuerdos_cerrados').select('*').order('created_at', { ascending: false }).limit(3),
    ]);

    const encargos = (encRes.data ?? []) as Pick<Encargo, 'estado'>[];
    const coches = (cochesRes.data ?? []) as { estado: string }[];
    const acuerdos = (acuerdosRes.data ?? []) as Pick<AcuerdoCerrado, 'beneficio' | 'fecha_acuerdo'>[];

    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const acuerdosMes = acuerdos.filter((a) => a.fecha_acuerdo?.startsWith(mesActual));

    setStats({
      encargos_pendientes: encargos.filter((e) => e.estado === 'pendiente').length,
      encargos_en_proceso: encargos.filter((e) => e.estado === 'en_proceso').length,
      coches_disponibles: coches.filter((c) => c.estado === 'disponible').length,
      coches_reservados: coches.filter((c) => c.estado === 'reservado').length,
      acuerdos_mes: acuerdosMes.length,
      beneficio_mes: acuerdosMes.reduce((sum, a) => sum + (a.beneficio ?? 0), 0),
      beneficio_total: acuerdos.reduce((sum, a) => sum + (a.beneficio ?? 0), 0),
    });

    setUltimosAcuerdos((acuerdosUltRes.data ?? []) as AcuerdoCerrado[]);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const fmtEur = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Hola, {nombre} 👋</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading || !stats ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Beneficio mes — hero */}
          <View style={[styles.heroCard, shadow.lg]}>
            <View style={styles.heroIcon}>
              <Ionicons name="trending-up" size={24} color={colors.white} />
            </View>
            <View>
              <Text style={styles.heroLabel}>Beneficio este mes</Text>
              <Text style={styles.heroValue}>{fmtEur(stats.beneficio_mes)}</Text>
              <Text style={styles.heroSub}>{stats.acuerdos_mes} acuerdo{stats.acuerdos_mes !== 1 ? 's' : ''} cerrado{stats.acuerdos_mes !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Stats grid */}
          <Text style={styles.sectionTitle}>Encargos</Text>
          <View style={styles.statsRow}>
            <StatCard
              label="Pendientes"
              value={stats.encargos_pendientes}
              icon="time-outline"
              color={colors.warning}
              bgColor={colors.warningLight}
            />
            <StatCard
              label="En proceso"
              value={stats.encargos_en_proceso}
              icon="sync-outline"
              color={colors.info}
              bgColor={colors.infoLight}
            />
          </View>

          <Text style={styles.sectionTitle}>Cartera de coches</Text>
          <View style={styles.statsRow}>
            <StatCard
              label="Disponibles"
              value={stats.coches_disponibles}
              icon="car-outline"
              color={colors.success}
              bgColor={colors.successLight}
            />
            <StatCard
              label="Reservados"
              value={stats.coches_reservados}
              icon="bookmark-outline"
              color={colors.warning}
              bgColor={colors.warningLight}
            />
          </View>

          {/* Total acumulado */}
          <View style={[styles.totalCard, shadow.sm]}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            <Text style={styles.totalText}>Beneficio total acumulado</Text>
            <Text style={styles.totalValue}>{fmtEur(stats.beneficio_total)}</Text>
          </View>

          {/* Últimos acuerdos */}
          {ultimosAcuerdos.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Últimos acuerdos</Text>
              {ultimosAcuerdos.map((a) => (
                <View key={a.id} style={[styles.acuerdoRow, shadow.sm]}>
                  <View style={styles.acuerdoIcon}>
                    <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                  </View>
                  <View style={styles.acuerdoInfo}>
                    <Text style={styles.acuerdoCoche}>{a.coche_marca} {a.coche_modelo}</Text>
                    <Text style={styles.acuerdoCliente}>{a.cliente_nombre}</Text>
                  </View>
                  <View style={styles.acuerdoBeneficio}>
                    <Text style={styles.acuerdoBeneficioVal}>+{fmtEur(a.beneficio)}</Text>
                    <Text style={styles.acuerdoFecha}>{new Date(a.fecha_acuerdo).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: { ...typography.h2, fontSize: 24 },
  date: { ...typography.bodySmall, marginTop: 2, textTransform: 'capitalize' },
  logoutBtn: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    ...shadow.sm,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  heroValue: { color: colors.white, fontSize: 32, fontWeight: '800', marginVertical: 2 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  sectionTitle: { ...typography.h4, marginBottom: spacing.sm, marginTop: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  totalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  totalText: { flex: 1, ...typography.body, color: colors.textSecondary },
  totalValue: { ...typography.h3, color: colors.primary },
  acuerdoRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  acuerdoIcon: {},
  acuerdoInfo: { flex: 1 },
  acuerdoCoche: { ...typography.h4, fontSize: 15 },
  acuerdoCliente: { ...typography.bodySmall },
  acuerdoBeneficio: { alignItems: 'flex-end' },
  acuerdoBeneficioVal: { fontSize: 15, fontWeight: '700', color: colors.success },
  acuerdoFecha: { ...typography.caption, marginTop: 2 },
});
