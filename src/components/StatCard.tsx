import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../theme';

interface Props {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  bgColor?: string;
  subtitle?: string;
}

export default function StatCard({ label, value, icon, color = colors.primary, bgColor = colors.primaryLight, subtitle }: Props) {
  return (
    <View style={[styles.card, shadow.md]}>
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flex: 1,
    minWidth: 140,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
