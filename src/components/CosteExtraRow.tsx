import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CosteExtra } from '../types';
import { colors, radius, spacing } from '../theme';

interface Props {
  item: CosteExtra;
  index: number;
  onChange: (index: number, field: keyof CosteExtra, value: string) => void;
  onRemove: (index: number) => void;
}

export default function CosteExtraRow({ item, index, onChange, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <TextInput
        style={[styles.input, styles.inputNombre]}
        value={item.nombre}
        onChangeText={(v) => onChange(index, 'nombre', v)}
        placeholder="Concepto (ej: ITV)"
        placeholderTextColor={colors.textMuted}
      />
      <TextInput
        style={[styles.input, styles.inputImporte]}
        value={item.importe === 0 ? '' : String(item.importe)}
        onChangeText={(v) => onChange(index, 'importe', v)}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
      />
      <Text style={styles.euro}>€</Text>
      <TouchableOpacity onPress={() => onRemove(index)} style={styles.removeBtn}>
        <Ionicons name="close-circle" size={22} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  inputNombre: {
    flex: 1,
  },
  inputImporte: {
    width: 80,
    textAlign: 'right',
  },
  euro: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  removeBtn: {
    padding: 2,
  },
});
