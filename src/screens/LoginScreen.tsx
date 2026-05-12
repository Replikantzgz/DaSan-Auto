import React, { useEffect, useState } from 'react';
import {
  Image,
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { colors, radius, shadow, spacing, typography } from '../theme';

const SOCIOS = ['Dani', 'Santi'];

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [selectedSocio, setSelectedSocio] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (selectedSocio === null) {
      setError('Selecciona quién eres');
      return;
    }
    if (!password) {
      setError('Introduce la contraseña');
      return;
    }
    setError('');
    const ok = signIn(SOCIOS[selectedSocio], password, rememberMe);
    if (!ok) setError('Contraseña incorrecta');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={[styles.card, shadow.lg]}>
          <Text style={styles.sectionLabel}>¿Quién eres?</Text>
          <View style={styles.socioRow}>
            {SOCIOS.map((nombre, i) => (
              <TouchableOpacity
                key={nombre}
                style={[styles.socioBtn, selectedSocio === i && styles.socioBtnActive]}
                onPress={() => setSelectedSocio(i)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={28}
                  color={selectedSocio === i ? colors.white : colors.primary}
                />
                <Text style={[styles.socioBtnText, selectedSocio === i && styles.socioBtnTextActive]}>
                  {nombre}
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
            style={styles.loginBtn}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={20} color={colors.white} />
            <Text style={styles.loginBtnText}>Entrar</Text>
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
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 260,
    height: 130,
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
  loginBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
