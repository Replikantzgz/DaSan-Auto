import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

const LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado',
  disponible: 'Disponible',
  reservado: 'Reservado',
  vendido: 'Vendido',
};

interface Props {
  estado: string;
  size?: 'sm' | 'md';
}

export default function Badge({ estado, size = 'md' }: Props) {
  const bg = (colors as Record<string, string>)[`${estado}Light`] ?? colors.borderLight;
  const fg = (colors as Record<string, string>)[estado] ?? colors.textSecondary;
  const label = LABELS[estado] ?? estado;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color: fg }, size === 'sm' && styles.textSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 11,
  },
});
