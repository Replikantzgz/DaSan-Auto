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
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { colors, radius, shadow, spacing, typography } from '../theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_settings')
      .select('*')
      .eq('user_nombre', user.nombre)
      .single()
      .then(({ data }) => {
        if (data) {
          setEmail(data.email ?? '');
          setTelefono(data.telefono ?? '');
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_nombre: user.nombre, email: email.trim() || null, telefono: telefono.trim() || null, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) Alert.alert('Error', 'No se pudo guardar');
    else Alert.alert('Guardado', 'Datos actualizados correctamente');
  };

  if (loading) return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>

        {/* Perfil */}
        <View style={[styles.card, shadow.sm]}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.white} />
            </View>
            <View>
              <Text style={styles.userName}>{user?.nombre}</Text>
              <Text style={styles.userSub}>DaSan Auto</Text>
            </View>
          </View>
        </View>

        {/* Contacto */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.sectionTitle}>Mis datos de contacto</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="600 000 000"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color={colors.white} />
              : <><Ionicons name="checkmark-circle-outline" size={18} color={colors.white} /><Text style={styles.saveBtnText}>Guardar datos</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.sectionTitle}>Aplicación</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión</Text>
            <Text style={styles.infoValue}>1.4.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Proyecto</Text>
            <Text style={styles.infoValue}>DaSan Auto</Text>
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={[styles.logoutBtn, shadow.sm]} onPress={() => Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: signOut },
        ])}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  userName: { ...typography.h2, fontSize: 22 },
  userSub: { ...typography.bodySmall, color: colors.textSecondary },
  sectionTitle: { ...typography.h4, color: colors.primary, marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: spacing.md },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, marginTop: spacing.sm },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { ...typography.body, color: colors.textSecondary },
  infoValue: { ...typography.body, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.xl, paddingVertical: 16, borderWidth: 1.5, borderColor: colors.danger },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
});
