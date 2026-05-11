import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import CosteExtraRow from '../../components/CosteExtraRow';
import { colors, radius, shadow, spacing, typography } from '../../theme';
import { Combustible, CosteExtra, EstadoCoche } from '../../types';
import { CochesStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<CochesStackParamList>;
type Route = RouteProp<CochesStackParamList, 'CocheForm'>;

const ESTADOS: EstadoCoche[] = ['disponible', 'reservado', 'vendido'];
const ESTADO_LABELS: Record<EstadoCoche, string> = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  vendido: 'Vendido',
};

const COMBUSTIBLES: { key: Combustible; label: string; emoji: string }[] = [
  { key: 'gasolina', label: 'Gasolina', emoji: '⛽' },
  { key: 'diesel', label: 'Diésel', emoji: '🛢️' },
  { key: 'hibrido', label: 'Híbrido', emoji: '🔋' },
  { key: 'electrico', label: 'Eléctrico', emoji: '⚡' },
  { key: 'hibrido_enchufable', label: 'Híbrido E.', emoji: '🔌' },
];

const TIPOS = ['SUV', 'Berlina', 'Familiar', 'Monovolumen', 'Cabrio', 'Pickup', 'Furgoneta', 'Otro'];

interface FormData {
  marca: string;
  modelo: string;
  anio: string;
  version: string;
  color: string;
  km: string;
  matricula: string;
  combustible: Combustible | '';
  tipo: string;
  precio_compra: string;
  costes_extra: CosteExtra[];
  precio_venta: string;
  estado: EstadoCoche;
  notas: string;
  fotos: string[];
}

const EMPTY: FormData = {
  marca: '', modelo: '', anio: '', version: '', color: '', km: '',
  matricula: '', combustible: '', tipo: '', precio_compra: '',
  costes_extra: [], precio_venta: '', estado: 'disponible', notas: '', fotos: [],
};

export default function CocheFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const id = route.params?.id;

  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('coches_disponibles').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          marca: data.marca ?? '',
          modelo: data.modelo ?? '',
          anio: data.anio ? String(data.anio) : '',
          version: data.version ?? '',
          color: data.color ?? '',
          km: data.km ? String(data.km) : '',
          matricula: data.matricula ?? '',
          combustible: data.combustible ?? '',
          tipo: data.tipo ?? '',
          precio_compra: data.precio_compra ? String(data.precio_compra) : '',
          costes_extra: Array.isArray(data.costes_extra) ? data.costes_extra : [],
          precio_venta: data.precio_venta ? String(data.precio_venta) : '',
          estado: data.estado ?? 'disponible',
          notas: data.notas ?? '',
          fotos: Array.isArray(data.fotos) ? data.fotos : [],
        });
      }
      setInitialLoading(false);
    });
  }, [id]);

  const set = (key: keyof FormData, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const addCoste = () =>
    setForm((f) => ({ ...f, costes_extra: [...f.costes_extra, { nombre: '', importe: 0 }] }));

  const removeCoste = (i: number) =>
    setForm((f) => ({ ...f, costes_extra: f.costes_extra.filter((_, idx) => idx !== i) }));

  const changeCoste = (i: number, field: keyof CosteExtra, val: string) =>
    setForm((f) => ({
      ...f,
      costes_extra: f.costes_extra.map((ce, idx) =>
        idx === i ? { ...ce, [field]: field === 'importe' ? (parseFloat(val) || 0) : val } : ce
      ),
    }));

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso para añadir fotos.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7, allowsMultipleSelection: true });

    if (result.canceled) return;

    setUploadingPhoto(true);
    try {
      const uploadedUrls: string[] = [];
      for (const asset of result.assets) {
        const ext = asset.uri.split('.').pop() ?? 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const { error } = await supabase.storage.from('coches').upload(fileName, blob, {
          contentType: asset.mimeType ?? 'image/jpeg',
        });
        if (!error) {
          const { data } = supabase.storage.from('coches').getPublicUrl(fileName);
          uploadedUrls.push(data.publicUrl);
        }
      }
      if (uploadedUrls.length > 0) {
        setForm((f) => ({ ...f, fotos: [...f.fotos, ...uploadedUrls] }));
      }
    } catch {
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (url: string) =>
    setForm((f) => ({ ...f, fotos: f.fotos.filter((u) => u !== url) }));

  const precioCompra = parseFloat(form.precio_compra) || 0;
  const sumaCostes = form.costes_extra.reduce((s, ce) => s + ce.importe, 0);
  const costeTotal = precioCompra + sumaCostes;
  const precioVenta = parseFloat(form.precio_venta) || 0;
  const margen = precioVenta - costeTotal;
  const margenPct = costeTotal > 0 ? (margen / costeTotal) * 100 : 0;

  const fmtEur = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const handleSave = async () => {
    if (!form.marca.trim() || !form.modelo.trim()) return Alert.alert('Error', 'Marca y modelo son obligatorios');
    if (!form.precio_compra) return Alert.alert('Error', 'El precio de compra es obligatorio');

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      anio: form.anio ? parseInt(form.anio) : null,
      version: form.version.trim() || null,
      color: form.color.trim() || null,
      km: form.km ? parseInt(form.km) : null,
      matricula: form.matricula.trim().toUpperCase() || null,
      combustible: form.combustible || null,
      tipo: form.tipo || null,
      precio_compra: precioCompra,
      costes_extra: form.costes_extra.filter((ce) => ce.nombre.trim()),
      precio_venta: precioVenta,
      estado: form.estado,
      notas: form.notas.trim() || null,
      fotos: form.fotos,
      created_by: user?.id,
    };

    const { error } = id
      ? await supabase.from('coches_disponibles').update(payload).eq('id', id)
      : await supabase.from('coches_disponibles').insert(payload);

    setLoading(false);
    if (error) {
      Alert.alert('Error', 'No se pudo guardar el coche');
    } else {
      navigation.goBack();
    }
  };

  if (initialLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Section title="Identificación">
          <RowFields>
            <Field label="Marca *" value={form.marca} onChange={(v) => set('marca', v)} placeholder="Toyota" />
            <Field label="Modelo *" value={form.modelo} onChange={(v) => set('modelo', v)} placeholder="Corolla" />
          </RowFields>
          <RowFields>
            <Field label="Año" value={form.anio} onChange={(v) => set('anio', v)} placeholder="2021" keyboardType="number-pad" />
            <Field label="Versión" value={form.version} onChange={(v) => set('version', v)} placeholder="Advance" />
          </RowFields>
          <RowFields>
            <Field label="Color" value={form.color} onChange={(v) => set('color', v)} placeholder="Blanco" />
            <Field label="Km" value={form.km} onChange={(v) => set('km', v)} placeholder="45000" keyboardType="number-pad" />
          </RowFields>
          <Field label="Matrícula" value={form.matricula} onChange={(v) => set('matricula', v.toUpperCase())} placeholder="1234 ABC" />
        </Section>

        <Section title="Combustible">
          <View style={styles.pillRow}>
            {COMBUSTIBLES.map(({ key, label, emoji }) => (
              <TouchableOpacity
                key={key}
                style={[styles.pill, form.combustible === key && styles.pillActive]}
                onPress={() => set('combustible', form.combustible === key ? '' : key)}
              >
                <Text style={styles.pillEmoji}>{emoji}</Text>
                <Text style={[styles.pillText, form.combustible === key && styles.pillTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="Tipo de carrocería">
          <View style={styles.pillRow}>
            {TIPOS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pill, form.tipo === t && styles.pillActive]}
                onPress={() => set('tipo', form.tipo === t ? '' : t)}
              >
                <Text style={[styles.pillText, form.tipo === t && styles.pillTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* COSTES — sección estrella */}
        <View style={[styles.costesCard, shadow.md]}>
          <View style={styles.costesTitleRow}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <Text style={styles.costesTitle}>Desglose de costes</Text>
          </View>

          <View style={styles.compraRow}>
            <Text style={styles.compraLabel}>Precio de compra</Text>
            <View style={styles.amountWrap}>
              <TextInput
                style={styles.amountInput}
                value={form.precio_compra}
                onChangeText={(v) => set('precio_compra', v)}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <Text style={styles.amountSymbol}>€</Text>
            </View>
          </View>

          {form.costes_extra.length > 0 && (
            <View style={styles.costesExtraWrap}>
              <Text style={styles.costesExtraTitle}>Gastos adicionales</Text>
              {form.costes_extra.map((ce, i) => (
                <CosteExtraRow key={i} item={ce} index={i} onChange={changeCoste} onRemove={removeCoste} />
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addCosteBtn} onPress={addCoste}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.addCosteBtnText}>Añadir gasto</Text>
          </TouchableOpacity>

          <View style={styles.totalsSep} />

          <View style={styles.totalesWrap}>
            {form.costes_extra.length > 0 && (
              <>
                <TotalRow label="Precio compra" value={fmtEur(precioCompra)} />
                {form.costes_extra.filter((ce) => ce.nombre).map((ce, i) => (
                  <TotalRow key={i} label={`+ ${ce.nombre}`} value={fmtEur(ce.importe)} muted />
                ))}
                <View style={styles.totalDivider} />
              </>
            )}
            <TotalRow label="COSTE TOTAL" value={fmtEur(costeTotal)} bold />
          </View>

          <View style={styles.ventaRow}>
            <Text style={styles.ventaLabel}>Precio de venta</Text>
            <View style={styles.amountWrap}>
              <TextInput
                style={[styles.amountInput, { color: colors.primary }]}
                value={form.precio_venta}
                onChangeText={(v) => set('precio_venta', v)}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.amountSymbol, { color: colors.primary }]}>€</Text>
            </View>
          </View>

          {precioVenta > 0 && (
            <View style={[styles.margenBanner, { backgroundColor: margen >= 0 ? colors.successLight : colors.dangerLight }]}>
              <Ionicons
                name={margen >= 0 ? 'trending-up' : 'trending-down'}
                size={20}
                color={margen >= 0 ? colors.success : colors.danger}
              />
              <Text style={[styles.margenBannerText, { color: margen >= 0 ? colors.success : colors.danger }]}>
                Margen: {fmtEur(margen)}  ({margenPct.toFixed(1)}%)
              </Text>
            </View>
          )}
        </View>

        <Section title="Estado">
          <View style={styles.estadoRow}>
            {ESTADOS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.estadoChip, form.estado === e && styles.estadoChipActive]}
                onPress={() => set('estado', e)}
              >
                <Text style={[styles.estadoText, form.estado === e && styles.estadoTextActive]}>
                  {ESTADO_LABELS[e]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="Fotos">
          {form.fotos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fotosScroll}>
              {form.fotos.map((url, i) => (
                <View key={i} style={styles.fotoWrap}>
                  <Image source={{ uri: url }} style={styles.fotoThumb} />
                  <TouchableOpacity style={styles.fotoDeleteBtn} onPress={() => removePhoto(url)}>
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <View style={styles.fotosBtns}>
            <TouchableOpacity
              style={[styles.fotoBtn, uploadingPhoto && { opacity: 0.6 }]}
              onPress={() => pickPhoto('camera')}
              disabled={uploadingPhoto}
            >
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={styles.fotoBtnText}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fotoBtn, uploadingPhoto && { opacity: 0.6 }]}
              onPress={() => pickPhoto('gallery')}
              disabled={uploadingPhoto}
            >
              <Ionicons name="images-outline" size={20} color={colors.primary} />
              <Text style={styles.fotoBtnText}>Galería</Text>
            </TouchableOpacity>
            {uploadingPhoto && <ActivityIndicator color={colors.primary} />}
          </View>
        </Section>

        <Section title="Notas">
          <TextInput
            style={[styles.inputBase, styles.textArea]}
            value={form.notas}
            onChangeText={(v) => set('notas', v)}
            placeholder="Historial, detalles, extras..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
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
              <Text style={styles.saveBtnText}>Guardar coche</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TotalRow({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
      <Text style={{ fontSize: muted ? 12 : 14, color: muted ? colors.textMuted : colors.text, fontWeight: bold ? '700' : '400', paddingLeft: muted ? 8 : 0 }}>{label}</Text>
      <Text style={{ fontSize: muted ? 12 : 14, color: muted ? colors.textMuted : colors.text, fontWeight: bold ? '700' : '500' }}>{value}</Text>
    </View>
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

function RowFields({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: spacing.sm }}>{React.Children.map(children, (c) => <View style={{ flex: 1 }}>{c}</View>)}</View>;
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
        autoCapitalize="sentences"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  pillActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  pillEmoji: { fontSize: 14 },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  pillTextActive: { color: colors.primary },
  costesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  costesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  costesTitle: { ...typography.h4, color: colors.primary },
  compraRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  compraLabel: { ...typography.body, flex: 1 },
  amountWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.sm },
  amountInput: { fontSize: 16, fontWeight: '600', paddingVertical: 8, minWidth: 80, textAlign: 'right', color: colors.text },
  amountSymbol: { fontSize: 14, color: colors.textSecondary, marginLeft: 2, fontWeight: '600' },
  costesExtraWrap: { marginTop: spacing.sm },
  costesExtraTitle: { ...typography.label, marginBottom: spacing.sm },
  addCosteBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, marginTop: spacing.sm },
  addCosteBtnText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  totalsSep: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalesWrap: { marginBottom: spacing.sm },
  totalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  ventaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  ventaLabel: { ...typography.body, flex: 1, fontWeight: '600', color: colors.primary },
  margenBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, marginTop: spacing.sm },
  margenBannerText: { fontWeight: '700', fontSize: 15 },
  estadoRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  estadoChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
  estadoChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  estadoText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  estadoTextActive: { color: colors.primary },
  fotosScroll: { marginBottom: spacing.md },
  fotoWrap: { position: 'relative', marginRight: spacing.sm },
  fotoThumb: { width: 100, height: 100, borderRadius: radius.md, backgroundColor: colors.border },
  fotoDeleteBtn: { position: 'absolute', top: -8, right: -8 },
  fotosBtns: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  fotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    backgroundColor: colors.primaryLight,
  },
  fotoBtnText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  inputBase: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: 15, color: colors.text },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
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
