export const colors = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryDark: '#1D4ED8',

  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',

  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Estado chips
  pendiente: '#F59E0B',
  pendienteLight: '#FFFBEB',
  en_proceso: '#3B82F6',
  en_procesoLight: '#EFF6FF',
  completado: '#10B981',
  completadoLight: '#ECFDF5',
  cancelado: '#9CA3AF',
  canceladoLight: '#F9FAFB',

  disponible: '#10B981',
  disponibleLight: '#ECFDF5',
  reservado: '#F59E0B',
  reservadoLight: '#FFFBEB',
  vendido: '#9CA3AF',
  vendidoLight: '#F9FAFB',

  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: '#111827' },
  h2: { fontSize: 22, fontWeight: '700' as const, color: '#111827' },
  h3: { fontSize: 18, fontWeight: '600' as const, color: '#111827' },
  h4: { fontSize: 16, fontWeight: '600' as const, color: '#111827' },
  body: { fontSize: 15, fontWeight: '400' as const, color: '#111827' },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: '#6B7280' },
  caption: { fontSize: 12, fontWeight: '400' as const, color: '#9CA3AF' },
  label: { fontSize: 13, fontWeight: '500' as const, color: '#6B7280' },
};
