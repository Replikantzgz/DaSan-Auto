export type EstadoEncargo = 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
export type EstadoCoche = 'disponible' | 'reservado' | 'vendido';
export type Combustible = 'gasolina' | 'diesel' | 'hibrido' | 'electrico' | 'hibrido_enchufable';

export interface CosteExtra {
  nombre: string;
  importe: number;
}

export interface Encargo {
  id: string;
  created_at: string;
  updated_at: string;
  cliente_nombre: string;
  cliente_telefono?: string;
  cliente_email?: string;
  marca: string;
  modelo: string;
  anio_min?: number;
  anio_max?: number;
  presupuesto?: number;
  caracteristicas?: string;
  notas?: string;
  estado: EstadoEncargo;
  created_by?: string;
}

export interface CocheDisponible {
  id: string;
  created_at: string;
  updated_at: string;
  marca: string;
  modelo: string;
  anio?: number;
  version?: string;
  color?: string;
  km?: number;
  matricula?: string;
  combustible?: Combustible;
  tipo?: string;
  precio_compra: number;
  costes_extra: CosteExtra[];
  precio_venta: number;
  estado: EstadoCoche;
  notas?: string;
  fotos?: string[];
  created_by?: string;
}

export interface AcuerdoCerrado {
  id: string;
  created_at: string;
  updated_at: string;
  coche_id?: string;
  encargo_id?: string;
  coche_marca: string;
  coche_modelo: string;
  coche_anio?: number;
  cliente_nombre: string;
  cliente_telefono?: string;
  precio_compra: number;
  costes_extra: CosteExtra[];
  coste_total: number;
  precio_final: number;
  gastos_adicionales: number;
  beneficio: number;
  fecha_acuerdo: string;
  notas?: string;
  created_by?: string;
}
