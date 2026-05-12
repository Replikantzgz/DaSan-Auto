import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { CocheDisponible, EstadoEncargo } from '../../types';
import { EncargosStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<EncargosStackParamList>;
type Route = RouteProp<EncargosStackParamList, 'EncargoForm'>;

const ESTADOS: EstadoEncargo[] = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
const ESTADO_LABELS: Record<EstadoEncargo, string> = {
  pendiente: 'Pendiente', en_proceso: 'En proceso',
  completado: 'Completado', cancelado: 'Cancelado',
};

interface FormData {
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email: string;
  resumen: string;
  anio_min: string;
  anio_max: string;
  presupuesto: string;
  caracteristicas: string;
  notas: string;
  estado: EstadoEncargo;
  coche_id: string;
}

const EMPTY: FormData = {
  cliente_nombre: '', cliente_telefono: '', cliente_email: '',
  resumen: '', anio_min: '', anio_max: '',
  presupuesto: '', caracteristicas: '', notas: '',
  estado: 'pendiente', coche_id: '',
};

export default function EncargoFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const id = route.params?.id;

  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [cochesCompatibles, setCochesCompatibles] = useState<CocheDisponible[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from('encargos').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          cliente_nombre: data.cliente_nombre ?? '',
          cliente_telefono: data.cliente_telefono ?? '',
          cliente_email: data.cliente_email ?? '',
          resumen: data.marca ?? '',
          anio_min: data.anio_min ? String(data.anio_min) : '',
          anio_max: data.anio_max ? String(data.anio_max) : '',
          presupuesto: data.presupuesto ? String(data.presupuesto) : '',
          caracteristicas: data.caracteristicas ?? '',
          notas: data.notas ?? '',
          estado: data.estado ?? 'pendiente',
          coche_id: data.coche_id ?? '',
        });
        if (data.presupuesto) loadCochesCompatibles(data.presupuesto);
      }
      setInitialLoading(false);
    });
  }, [id]);

  const loadCochesCompatibles = async (presupuesto: number) => {
    const { data } = await supabase
      .from('coches_disponibles')
      .select('*')
      .eq('estado', 'disponible')
      .lte('precio_venta', presupuesto)
      .order('precio_venta', { ascending: false })
      .limit(5);
    setCochesCompatibles((data ?? []) as CocheDisponible[]);
  };

  const set = (key: keyof FormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      cliente_nombre: form.cliente_nombre.trim() || null,
      cliente_telefono: form.cliente_telefono.trim() || null,
      cliente_email: form.cliente_email.trim() || null,
      marca: form.resumen.trim() || null,
      modelo: null,
      anio_min: form.anio_min ? parseInt(form.anio_min) : null,
      anio_max: form.anio_max ? parseInt(form.anio_max) : null,
      presupuesto: form.presupuesto ? parseFloat(form.presupuesto) : null,
      caracteristicas: form.caracteristicas.trim() || null,
      notas: form.notas.trim() || null,
      estado: form.estado,
      coche_id: form.coche_id || null,
    };

    const { error } = id
      ? await supabase.from('encargos').update(payload).eq('id', id)
      : await supabase.from('encargos').insert(payload);

    setLoading(false);
    if (error) Alert.alert('Error', 'No se pudo guardar el encargo');
    else navigation.goBack();
  };

  const fmtEur = (n?: number) =>
    n ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : '—';

  if (initialLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Section title="Cliente">
          <Field label="Nombre" value={form.cliente_nombre} onChange={(v) => set('cliente_nombre', v)} placeholder="Nombre del cliente" />
          <Field label="Teléfono" value={form.cliente_telefono} onChange={(v) => set('cliente_telefono', v)} placeholder="600 000 000" keyboardType="phone-pad" />
          <Field label="Email" value={form.cliente_email} onChange={(v) => set('cliente_email', v)} placeholder="correo@ejemplo.com" keyboardType="email-address" />
        </Section>

        <Section title="¿Qué busca?">
          <Field
            label="Resumen"
            value={form.resumen}
            onChange={(v) => set('resumen', v)}
            placeholder="Ej: SUV Diésel, Furgoneta plazas, 4x4 gasolina..."
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Año desde" value={form.anio_min} onChange={(v) => set('anio_min', v)} placeholder="2018" keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Año hasta" value={form.anio_max} onChange={(v) => set('anio_max', v)} placeholder="2023" keyboardType="number-pad" />
            </View>
          </View>
          <Field label="Presupuesto (€)" value={form.presupuesto} onChange={(v) => set('presupuesto', v)} placeholder="15000" keyboardType="decimal-pad" />
        </Section>

        <Section title="Características buscadas">
          <TextInput
            style={[styles.inputBase, styles.textArea]}
            value={form.caracteristicas}
            onChangeText={(v) => set('caracteristicas', v)}
            placeholder="Ej: 7 plazas, automático, techo panorámico, pocos km..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </Section>

        <Section title="Estado del encargo">
          <View style={styles.estadoRow}>
            {ESTADOS.map((e) => (
              <TouchableOpacity key={e} style={[styles.estadoChip, form.estado === e && styles.estadoChipActive]} onPress={() => set('estado', e)}>
                <Text style={[styles.estadoText, form.estado === e && styles.estadoTextActive]}>{ESTADO_LABELS[e]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Vincular coche */}
        {cochesCompatibles.length > 0 && (
          <Section title="Coches disponibles compatibles">
            {cochesCompatibles.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.cocheRow, form.coche_id === c.id && styles.cocheRowActive]}
                onPress={() => set('coche_id', form.coche_id === c.id ? '' : c.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cocheNombre}>{[c.marca, c.modelo].filter(Boolean).join(' ') || 'Sin nombre'}</Text>
                  {c.tipo ? <Text style={styles.cocheSub}>{c.tipo}{c.combustible ? ` · ${c.combustible}` : ''}</Text> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cochePrecio}>{fmtEur(c.precio_venta)}</Text>
                  {form.coche_id === c.id && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                </View>
              </TouchableOpacity>
            ))}
            {form.coche_id && (
              <TouchableOpacity onPress={() => set('coche_id', '')} style={styles.desvincularBtn}>
                <Text style={styles.desvincularText}>Quitar vinculación</Text>
              </TouchableOpacity>
            )}
          </Section>
        )}

        <Section title="Notas internas">
          <TextInput
            style={[styles.inputBase, styles.textArea]}
            value={form.notas}
            onChangeText={(v) => set('notas', v)}
            placeholder="Observaciones, seguimiento..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </Section>

        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color={colors.white} /> : (
            <><Ionicons name="checkmark-circle-outline" size={20} color={colors.white} /><Text style={styles.saveBtnText}>Guardar encargo</Text></>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={[sectionStyles.wrap, shadow.sm]}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType = 'default' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'decimal-pad' | 'number-pad';
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: spacing.sm },
  estadoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  estadoChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
  estadoChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  estadoText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  estadoTextActive: { color: colors.primary },
  inputBase: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: 15, color: colors.text },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  cocheRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, marginBottom: spacing.sm, backgroundColor: colors.surfaceAlt },
  cocheRowActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  cocheNombre: { fontSize: 14, fontWeight: '700', color: colors.text },
  cocheSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cochePrecio: { fontSize: 14, fontWeight: '700', color: colors.primary },
  desvincularBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  desvincularText: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, marginTop: spacing.md },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

const sectionStyles = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  title: { ...typography.h4, marginBottom: spacing.md, color: colors.primary },
});

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: { ...typography.label, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: 15, color: colors.text },
});
