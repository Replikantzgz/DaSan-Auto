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
import { CocheDisponible, Encargo } from '../../types';
import { AcuerdosStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<AcuerdosStackParamList>;
type Route = RouteProp<AcuerdosStackParamList, 'AcuerdoForm'>;

interface FormData {
  coche_id: string;
  encargo_id: string;
  coche_marca: string;
  coche_modelo: string;
  coche_anio: string;
  cliente_nombre: string;
  cliente_telefono: string;
  precio_compra: string;
  coste_total: string;
  precio_final: string;
  gastos_adicionales: string;
  fecha_acuerdo: string;
  notas: string;
}

const today = new Date().toISOString().split('T')[0];

const EMPTY: FormData = {
  coche_id: '',
  encargo_id: '',
  coche_marca: '',
  coche_modelo: '',
  coche_anio: '',
  cliente_nombre: '',
  cliente_telefono: '',
  precio_compra: '',
  coste_total: '',
  precio_final: '',
  gastos_adicionales: '0',
  fecha_acuerdo: today,
  notas: '',
};

export default function AcuerdoFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const id = route.params?.id;

  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [coches, setCoches] = useState<CocheDisponible[]>([]);
  const [encargos, setEncargos] = useState<Encargo[]>([]);
  const [showCocheSelector, setShowCocheSelector] = useState(false);
  const [showEncargoSelector, setShowEncargoSelector] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('coches_disponibles').select('*').in('estado', ['disponible', 'reservado']).order('marca'),
      supabase.from('encargos').select('*').eq('estado', 'pendiente').order('created_at', { ascending: false }),
    ]).then(([cochesRes, encargosRes]) => {
      setCoches((cochesRes.data ?? []) as CocheDisponible[]);
      setEncargos((encargosRes.data ?? []) as Encargo[]);
    });

    if (!id) { setInitialLoading(false); return; }
    supabase.from('acuerdos_cerrados').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          coche_id: data.coche_id ?? '',
          encargo_id: data.encargo_id ?? '',
          coche_marca: data.coche_marca ?? '',
          coche_modelo: data.coche_modelo ?? '',
          coche_anio: data.coche_anio ? String(data.coche_anio) : '',
          cliente_nombre: data.cliente_nombre ?? '',
          cliente_telefono: data.cliente_telefono ?? '',
          precio_compra: String(data.precio_compra ?? ''),
          coste_total: String(data.coste_total ?? ''),
          precio_final: String(data.precio_final ?? ''),
          gastos_adicionales: String(data.gastos_adicionales ?? 0),
          fecha_acuerdo: data.fecha_acuerdo ?? today,
          notas: data.notas ?? '',
        });
      }
      setInitialLoading(false);
    });
  }, [id]);

  const set = (key: keyof FormData, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const selectCoche = (c: CocheDisponible) => {
    const costeTotal = c.precio_compra + (c.costes_extra ?? []).reduce((s, ce) => s + ce.importe, 0);
    setForm((f) => ({
      ...f,
      coche_id: c.id,
      coche_marca: c.marca,
      coche_modelo: c.modelo,
      coche_anio: c.anio ? String(c.anio) : '',
      precio_compra: String(c.precio_compra),
      coste_total: String(costeTotal),
    }));
    setShowCocheSelector(false);
  };

  const selectEncargo = (e: Encargo) => {
    setForm((f) => ({
      ...f,
      encargo_id: e.id,
      cliente_nombre: e.cliente_nombre,
      cliente_telefono: e.cliente_telefono ?? '',
    }));
    setShowEncargoSelector(false);
  };

  const costeTotalNum = parseFloat(form.coste_total) || 0;
  const precioFinalNum = parseFloat(form.precio_final) || 0;
  const gastosNum = parseFloat(form.gastos_adicionales) || 0;
  const beneficio = precioFinalNum - costeTotalNum - gastosNum;

  const fmtEur = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const handleSave = async () => {
    if (!form.coche_marca || !form.coche_modelo) return Alert.alert('Error', 'Selecciona o indica el coche');
    if (!form.cliente_nombre.trim()) return Alert.alert('Error', 'El nombre del cliente es obligatorio');
    if (!form.precio_final) return Alert.alert('Error', 'El precio final es obligatorio');

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      coche_id: form.coche_id || null,
      encargo_id: form.encargo_id || null,
      coche_marca: form.coche_marca.trim(),
      coche_modelo: form.coche_modelo.trim(),
      coche_anio: form.coche_anio ? parseInt(form.coche_anio) : null,
      cliente_nombre: form.cliente_nombre.trim(),
      cliente_telefono: form.cliente_telefono.trim() || null,
      precio_compra: parseFloat(form.precio_compra) || 0,
      costes_extra: [],
      coste_total: costeTotalNum,
      precio_final: precioFinalNum,
      gastos_adicionales: gastosNum,
      beneficio,
      fecha_acuerdo: form.fecha_acuerdo,
      notas: form.notas.trim() || null,
      created_by: user?.id,
    };

    const { error } = id
      ? await supabase.from('acuerdos_cerrados').update(payload).eq('id', id)
      : await supabase.from('acuerdos_cerrados').insert(payload);

    if (!error && form.coche_id) {
      await supabase.from('coches_disponibles').update({ estado: 'vendido' }).eq('id', form.coche_id);
      if (form.encargo_id) {
        await supabase.from('encargos').update({ estado: 'completado' }).eq('id', form.encargo_id);
      }
    }

    setLoading(false);
    if (error) {
      Alert.alert('Error', 'No se pudo guardar el acuerdo');
    } else {
      navigation.goBack();
    }
  };

  if (initialLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Seleccionar coche */}
        <Section title="Coche vendido">
          <TouchableOpacity
            style={styles.selectorBtn}
            onPress={() => setShowCocheSelector(!showCocheSelector)}
          >
            <Ionicons name="car-outline" size={18} color={colors.primary} />
            <Text style={styles.selectorBtnText}>
              {form.coche_marca ? `${form.coche_marca} ${form.coche_modelo}${form.coche_anio ? ` (${form.coche_anio})` : ''}` : 'Seleccionar de cartera'}
            </Text>
            <Ionicons name={showCocheSelector ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          {showCocheSelector && (
            <View style={styles.selectorList}>
              {coches.length === 0 && <Text style={styles.selectorEmpty}>Sin coches disponibles</Text>}
              {coches.map((c) => (
                <TouchableOpacity key={c.id} style={styles.selectorItem} onPress={() => selectCoche(c)}>
                  <Text style={styles.selectorItemTitle}>{c.marca} {c.modelo} {c.anio ?? ''}</Text>
                  <Text style={styles.selectorItemSub}>{c.matricula ?? c.estado}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {!form.coche_id && (
            <View style={styles.manualCocheRow}>
              <View style={{ flex: 1 }}>
                <Field label="Marca" value={form.coche_marca} onChange={(v) => set('coche_marca', v)} placeholder="Toyota" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Modelo" value={form.coche_modelo} onChange={(v) => set('coche_modelo', v)} placeholder="Corolla" />
              </View>
            </View>
          )}
        </Section>

        {/* Seleccionar encargo (opcional) */}
        <Section title="Encargo vinculado (opcional)">
          <TouchableOpacity
            style={styles.selectorBtn}
            onPress={() => setShowEncargoSelector(!showEncargoSelector)}
          >
            <Ionicons name="clipboard-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.selectorBtnText, { color: colors.textSecondary }]}>
              {form.encargo_id
                ? encargos.find((e) => e.id === form.encargo_id)
                  ? `${encargos.find((e) => e.id === form.encargo_id)!.cliente_nombre}`
                  : 'Encargo seleccionado'
                : 'Vincular encargo pendiente'}
            </Text>
            <Ionicons name={showEncargoSelector ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          {showEncargoSelector && (
            <View style={styles.selectorList}>
              <TouchableOpacity style={styles.selectorItem} onPress={() => { setForm((f) => ({ ...f, encargo_id: '' })); setShowEncargoSelector(false); }}>
                <Text style={[styles.selectorItemTitle, { color: colors.textMuted }]}>Sin vincular</Text>
              </TouchableOpacity>
              {encargos.map((e) => (
                <TouchableOpacity key={e.id} style={styles.selectorItem} onPress={() => selectEncargo(e)}>
                  <Text style={styles.selectorItemTitle}>{e.cliente_nombre}</Text>
                  <Text style={styles.selectorItemSub}>{e.marca} {e.modelo}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>

        {/* Cliente */}
        <Section title="Cliente">
          <Field label="Nombre *" value={form.cliente_nombre} onChange={(v) => set('cliente_nombre', v)} placeholder="Nombre del comprador" />
          <Field label="Teléfono" value={form.cliente_telefono} onChange={(v) => set('cliente_telefono', v)} placeholder="600 000 000" keyboardType="phone-pad" />
        </Section>

        {/* Financiero */}
        <View style={[styles.finCard, shadow.md]}>
          <View style={styles.finTitleRow}>
            <Ionicons name="calculator-outline" size={20} color={colors.success} />
            <Text style={styles.finTitle}>Resumen financiero</Text>
          </View>

          <Field label="Coste total del coche (€)" value={form.coste_total} onChange={(v) => set('coste_total', v)} placeholder="0" keyboardType="decimal-pad" />
          <Field label="Precio final de venta (€) *" value={form.precio_final} onChange={(v) => set('precio_final', v)} placeholder="0" keyboardType="decimal-pad" />
          <Field label="Gastos adicionales (€)" value={form.gastos_adicionales} onChange={(v) => set('gastos_adicionales', v)} placeholder="0" keyboardType="decimal-pad" />

          {/* Resultado */}
          <View style={[styles.resultWrap, { backgroundColor: beneficio >= 0 ? colors.successLight : colors.dangerLight }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Coste total</Text>
              <Text style={{ fontSize: 13 }}>{fmtEur(costeTotalNum)}</Text>
            </View>
            {gastosNum > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Gastos adicionales</Text>
                <Text style={{ fontSize: 13, color: colors.danger }}>- {fmtEur(gastosNum)}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>Precio venta</Text>
              <Text style={{ fontSize: 13, color: colors.primary }}>{fmtEur(precioFinalNum)}</Text>
            </View>
            <View style={[styles.sep, { borderTopColor: colors.border }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: beneficio >= 0 ? colors.success : colors.danger }}>
                BENEFICIO
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: beneficio >= 0 ? colors.success : colors.danger }}>
                {beneficio >= 0 ? '+' : ''}{fmtEur(beneficio)}
              </Text>
            </View>
          </View>
        </View>

        {/* Fecha */}
        <Section title="Fecha del acuerdo">
          <Field label="Fecha (AAAA-MM-DD)" value={form.fecha_acuerdo} onChange={(v) => set('fecha_acuerdo', v)} placeholder={today} />
        </Section>

        {/* Notas */}
        <Section title="Notas">
          <TextInput
            style={[styles.inputBase, styles.textArea]}
            value={form.notas}
            onChangeText={(v) => set('notas', v)}
            placeholder="Condiciones, observaciones..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </Section>

        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={colors.white} /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>Cerrar acuerdo</Text>
            </>
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
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'decimal-pad' | 'number-pad';
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
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.sm,
  },
  selectorBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.primary },
  selectorList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  selectorEmpty: { padding: spacing.md, color: colors.textMuted, fontSize: 14 },
  selectorItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectorItemTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  selectorItemSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  manualCocheRow: { flexDirection: 'row', gap: spacing.sm },
  finCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md },
  finTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  finTitle: { ...typography.h4, color: colors.success },
  resultWrap: { borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, gap: 6 },
  sep: { borderTopWidth: 1, marginVertical: 6 },
  inputBase: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: 15, color: colors.text },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.success, borderRadius: radius.md, paddingVertical: 16, marginTop: spacing.md },
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
