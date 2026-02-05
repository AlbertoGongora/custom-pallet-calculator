// src/services/pdfPackingListService.ts
import type { PackingListData } from '../features/processing/packingListProcessor';
import { PACKING_LIST_COLUMNS } from '../config';

type ExtractResponse = {
  columns?: string[];
  headers?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows?: any[][];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: { columns?: string[]; rows?: any[][] };
};

function norm(v: unknown): string {
  return String(v ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function upper(v: unknown): string {
  return norm(v).toUpperCase();
}

function findColIndex(headers: string[], candidates: string[]): number {
  const H = headers.map(h => norm(h).toLowerCase());
  const C = candidates.map(c => norm(c).toLowerCase());

  // match exact
  for (let i = 0; i < H.length; i++) {
    if (C.includes(H[i])) return i;
  }
  // match contains
  for (let i = 0; i < H.length; i++) {
    const h = H[i];
    if (C.some(c => h.includes(c))) return i;
  }
  return -1;
}

/**
 * Aliases SOLO para el PDF (porque el PDF a veces no usa los mismos headers que tu Excel)
 * - pallet: en PDF suele ser "N"
 * - cantidad: en PDF suele ser "Quantity"
 * - lote: normalmente ya viene como "Batch Number" pero toleramos "Batch"
 * - packlist: en PDF suele ser "Packlist Number"
 */
const PACKING_LIST_PDF_ALIASES = {
  packlist: ['Packlist Number', 'Packlist No', 'Packlist', 'Packlist N'],
  pallet: ['N', 'CRT No', 'CRT'],
  lote: ['Batch Number', 'Batch'],
  cantidad: ['Quantity', 'Qty'],
} as const;

export async function processPdfPackingList(
  file: File,
  packlistSuffix: string
): Promise<PackingListData[]> {
  const backendUrl = import.meta.env.VITE_PDF_BACKEND_URL;
  if (!backendUrl) throw new Error('❌ Falta VITE_PDF_BACKEND_URL en el .env');

  const suffix = upper(packlistSuffix);
  if (!suffix) throw new Error('❌ Debes indicar el sufijo del Packlist');

  // 1) Enviar PDF al backend
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${backendUrl}/extract`, { method: 'POST', body: form });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`❌ Error backend PDF (${res.status}): ${txt || res.statusText}`);
  }

  const json = (await res.json()) as ExtractResponse;

  // 2) Recuperar tabla
  const headers = (json.columns ?? json.headers ?? json.data?.columns ?? []).map(norm);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (json.rows ?? json.data?.rows ?? []) as any[][];
  if (!headers.length || !rows.length) return [];

  // 3) Índices columnas
  const idxPacklist = findColIndex(headers, [
    ...PACKING_LIST_PDF_ALIASES.packlist,
  ]);

  if (idxPacklist === -1) {
    throw new Error(`❌ No encuentro "Packlist Number" para filtrar. Headers: ${headers.join(' | ')}`);
  }

  // usamos tu config como “nombres esperados” (por si el backend devuelve esos headers)
  const idxPallet = findColIndex(headers, [
    ...PACKING_LIST_COLUMNS.pallet,
    ...PACKING_LIST_PDF_ALIASES.pallet,
  ]);

  const idxLote = findColIndex(headers, [
    ...PACKING_LIST_COLUMNS.lote,
    ...PACKING_LIST_PDF_ALIASES.lote,
  ]);

  const idxCantidad = findColIndex(headers, [
    ...PACKING_LIST_COLUMNS.cantidad,
    ...PACKING_LIST_PDF_ALIASES.cantidad,
  ]);

  if (idxPallet === -1 || idxLote === -1 || idxCantidad === -1) {
    throw new Error(
      `❌ Faltan columnas necesarias (pallet/lote/cantidad). Headers: ${headers.join(' | ')}`
    );
  }

  // 4) Forward-fill (Packlist + Pallet) y filtrar por sufijo
  //    - En tu PDF: packlist aparece en la primera fila y luego viene vacío.
  //    - Pallet (N) también puede venir vacío en filas siguientes: se considera el mismo pallet anterior.
  let lastPacklist = '';
  let lastPallet = '';

  const normalized: Array<{ packlist: string; pallet: string; lote: string; cantidad: number }> = [];

  for (const r of rows) {
    const packRaw = norm(r[idxPacklist]);
    const palRaw = norm(r[idxPallet]);

    if (packRaw) lastPacklist = packRaw;
    if (palRaw) lastPallet = palRaw;

    const currentPack = upper(lastPacklist);
    const currentPallet = norm(lastPallet);

    // si aún no tenemos packlist, no podemos clasificar esa fila
    if (!currentPack) continue;

    // filtramos: SOLO filas cuyo packlist “actual” termina con el sufijo
    if (!currentPack.endsWith(suffix)) continue;

    const lote = norm(r[idxLote]);
    const qtyRaw = norm(r[idxCantidad]);
    const qty = Number(qtyRaw.replace(',', '.')) || 0;

    // descartar líneas totalmente vacías
    if (!currentPallet && !lote && !qtyRaw) continue;

    normalized.push({
      packlist: currentPack,
      pallet: currentPallet,
      lote,
      cantidad: qty,
    });
  }

  // 5) Mapear al formato de tu app (PackingListData)
  //    OJO: aquí devolvemos la estructura estándar (pallet/lote/cantidad),
  //    que es la que usa optimizePallets/normalizePackingListData.
  const mapped: PackingListData[] = normalized.map(item => ({
    pallet: Number(item.pallet) || 0,
    lote: item.lote,
    cantidad: Number(item.cantidad) || 0,
    cantidadCajas: undefined,
  }));

  /**
   * ✅ 6) NUEVO (lo que me pides):
   * Agrupar líneas repetidas del mismo pallet + mismo lote y SUMAR cantidad.
   * (Esto pasa en PDF: mismo pallet/lote aparece en dos filas 44 y 4.)
   *
   * Se hace DESPUÉS del forward fill, para que pallet/packlist ya estén completos.
   */
  const grouped = new Map<string, PackingListData>();

  for (const row of mapped) {
    // clave por pallet + lote
    const key = `${row.pallet}__${row.lote}`;

    const prev = grouped.get(key);
    if (!prev) {
      grouped.set(key, { ...row });
    } else {
      prev.cantidad += row.cantidad;
    }
  }

  // devolver en orden (opcional pero ayuda a depurar)
  const out = Array.from(grouped.values()).sort((a, b) => {
    if (a.pallet !== b.pallet) return a.pallet - b.pallet;
    return String(a.lote).localeCompare(String(b.lote));
  });

  return out;
}
