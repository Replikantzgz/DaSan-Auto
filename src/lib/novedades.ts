import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type Novedad = {
  id: string;
  tipo: 'coche' | 'encargo';
  titulo: string;
  subtitulo: string;
  creado_por: string | null;
  created_at: string;
  nueva: boolean;
};

const seenKey = (nombre: string) => `dasan_novedades_seen_${nombre}`;

export async function getLastSeen(nombre: string): Promise<string> {
  const v = await AsyncStorage.getItem(seenKey(nombre));
  // por defecto: hace 30 días (para no marcar todo el histórico como nuevo la 1ª vez)
  return v ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

export async function markSeen(nombre: string): Promise<void> {
  await AsyncStorage.setItem(seenKey(nombre), new Date().toISOString());
}

const fmtEur = (n?: number) =>
  n ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n) : '';

/** Devuelve lo que ha añadido el OTRO usuario, ordenado de más reciente a más antiguo. */
export async function fetchNovedades(miNombre: string): Promise<Novedad[]> {
  const lastSeen = await getLastSeen(miNombre);

  const [cochesRes, encargosRes] = await Promise.all([
    supabase
      .from('coches_disponibles')
      .select('id, marca, modelo, precio_venta, creado_por, created_at')
      .neq('creado_por', miNombre)
      .not('creado_por', 'is', null)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('encargos')
      .select('id, cliente_nombre, marca, presupuesto, creado_por, created_at')
      .neq('creado_por', miNombre)
      .not('creado_por', 'is', null)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const coches: Novedad[] = (cochesRes.data ?? []).map((c: any) => ({
    id: c.id,
    tipo: 'coche',
    titulo: [c.marca, c.modelo].filter(Boolean).join(' ') || 'Coche sin nombre',
    subtitulo: fmtEur(c.precio_venta),
    creado_por: c.creado_por,
    created_at: c.created_at,
    nueva: c.created_at > lastSeen,
  }));

  const encargos: Novedad[] = (encargosRes.data ?? []).map((e: any) => ({
    id: e.id,
    tipo: 'encargo',
    titulo: e.cliente_nombre || 'Cliente sin nombre',
    subtitulo: [e.marca, fmtEur(e.presupuesto)].filter(Boolean).join(' · '),
    creado_por: e.creado_por,
    created_at: e.created_at,
    nueva: e.created_at > lastSeen,
  }));

  return [...coches, ...encargos].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function contarNuevas(miNombre: string): Promise<number> {
  const novedades = await fetchNovedades(miNombre);
  return novedades.filter((n) => n.nueva).length;
}
