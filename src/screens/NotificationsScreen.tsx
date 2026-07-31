import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { fetchNovedades, markSeen, Novedad } from '../lib/novedades';
import { colors, radius, shadow, spacing, typography } from '../theme';

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ayer';
  if (d < 7) return `hace ${d} días`;
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) return;
      setLoading(true);
      fetchNovedades(user.nombre).then((data) => {
        if (!active) return;
        setNovedades(data);
        setLoading(false);
        // marcar como visto al entrar
        markSeen(user.nombre);
      });
      return () => {
        active = false;
      };
    }, [user])
  );

  const renderItem = ({ item }: { item: Novedad }) => (
    <View style={[styles.card, shadow.sm, item.nueva && styles.cardNueva]}>
      <View style={[styles.iconWrap, { backgroundColor: item.tipo === 'coche' ? colors.primaryLight : colors.successLight }]}>
        <Ionicons
          name={item.tipo === 'coche' ? 'car-sport' : 'person'}
          size={20}
          color={item.tipo === 'coche' ? colors.primary : colors.success}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{item.titulo}</Text>
        {item.subtitulo ? <Text style={styles.cardSub}>{item.subtitulo}</Text> : null}
        <Text style={styles.cardMeta}>
          {item.tipo === 'coche' ? 'Coche añadido' : 'Encargo añadido'} por {item.creado_por} · {tiempoRelativo(item.created_at)}
        </Text>
      </View>
      {item.nueva && <View style={styles.dot} />}
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;

  return (
    <View style={styles.root}>
      <FlatList
        data={novedades}
        keyExtractor={(n) => `${n.tipo}_${n.id}`}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>Sin novedades</Text>
            <Text style={styles.emptySub}>Aquí verás lo que añada el otro socio</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  cardNueva: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { ...typography.h4, fontSize: 15 },
  cardSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 1 },
  cardMeta: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  empty: { alignItems: 'center', paddingTop: 100, gap: spacing.sm },
  emptyText: { ...typography.h4, color: colors.textMuted },
  emptySub: { ...typography.bodySmall, color: colors.textMuted },
});
