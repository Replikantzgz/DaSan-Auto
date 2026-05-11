import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme';

const SOCIOS = [
  { nombre: 'Dani', email: 'dani@dasan.auto' },
  { nombre: 'Santi', email: 'santi@dasan.auto' },
];

const REMEMBER_KEY = 'dasan_remember_email';

export default function LoginScreen() {
  const [selectedSocio, setSelectedSocio] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(REMEMBER_KEY).then((email) => {
      if (email) {
        const idx = SOCIOS.findIndex((s) => s.email === email);
        if (idx >= 0) {
          setSelectedSocio(idx);
          setRememberMe(true);
        }
      }
    });
  }, []);

  const handleLogin = async () => {
    if (selectedSocio === null) {
      setError('Selecciona quién eres');
      return;
    }
    if (!password) {
      setError('Introduce la contraseña');
      return;
    }
    setError('');
    setLoading(true);

    const { email } = SOCIOS[selectedSocio];
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Contraseña incorrecta');
    } else {
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_KEY, email);
      } else {
        await AsyncStorage.removeItem(REMEMBER_KEY);
      }
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="car-sport" size={40} color={colors.white} />
          </View>
          <Text style={styles.title}>DaSan Auto</Text>
          <Text style={styles.subtitle}>Gestión de compraventa</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, shadow.lg]}>
          <Text style={styles.sectionLabel}>¿Quién eres?</Text>
          <View style={styles.socioRow}>
            {SOCIOS.map((s, i) => (
              <TouchableOpacity
                key={s.email}
                style={[
                  styles.socioBtn,
                  selectedSocio === i && styles.socioBtnActive,
                ]}
                onPress={() => setSelectedSocio(i)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={28}
                  color={selectedSocio === i ? colors.white : colors.primary}
                />
                <Text style={[styles.socioBtnText, selectedSocio === i && styles.socioBtnTextActive]}>
                  {s.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Contraseña</Text>
          <View style={styles.passWrap}>
            <TextInput
              style={styles.passInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.rememberRow}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={rememberMe ? colors.primary : colors.textMuted}
            />
            <Text style={styles.rememberText}>Recordar usuario</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color={colors.white} />
                <Text style={styles.loginBtnText}>Entrar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.md,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 4,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  socioRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socioBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    backgroundColor: colors.primaryLight,
  },
  socioBtnActive: {
    backgroundColor: colors.primary,
  },
  socioBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  socioBtnTextActive: {
    color: colors.white,
  },
  passWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
  },
  passInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  eyeBtn: {
    padding: spacing.sm,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  rememberText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    marginTop: spacing.sm,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
