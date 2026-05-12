import React, { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow, spacing, typography } from '../theme';

const CURRENT_VERSION = '1.1.0';

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
  }
  return 0;
}

export default function UpdateModal() {
  const [visible, setVisible] = useState(false);
  const [apkUrl, setApkUrl] = useState('');
  const [latestVersion, setLatestVersion] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('app_config')
          .select('key, value')
          .in('key', ['latest_version', 'apk_url']);

        if (!data) return;
        const versionRow = data.find((r) => r.key === 'latest_version');
        const urlRow = data.find((r) => r.key === 'apk_url');
        if (!versionRow || !urlRow) return;

        if (compareVersions(versionRow.value, CURRENT_VERSION) > 0) {
          setLatestVersion(versionRow.value);
          setApkUrl(urlRow.value);
          setVisible(true);
        }
      } catch {
        // silently ignore — no update check on network error
      }
    })();
  }, []);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={[styles.card, shadow.lg]}>
          <View style={styles.iconRow}>
            <Ionicons name="arrow-up-circle" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Nueva versión disponible</Text>
          <Text style={styles.subtitle}>
            Versión {latestVersion} ya está disponible.{'\n'}Descárgala e instálala para continuar.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => Linking.openURL(apkUrl)}
            activeOpacity={0.85}
          >
            <Ionicons name="download-outline" size={20} color={colors.white} />
            <Text style={styles.btnText}>Descargar actualización</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVisible(false)} style={styles.skip}>
            <Text style={styles.skipText}>Ahora no</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  iconRow: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    width: '100%',
    marginBottom: spacing.md,
  },
  btnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  skip: {
    padding: spacing.sm,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
