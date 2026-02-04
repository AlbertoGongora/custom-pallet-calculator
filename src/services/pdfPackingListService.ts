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

function findColIndex(headers: string[], candidates: string[]): number {
  const H = headers.map(h => norm(h).toLowerCase());
  const C = candidates.map(c => norm(c).toLowerCase());

  for (let i = 0; i < H.length; i++) {
    if (C.includes(H[i])) return i;
  }
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
 */
const PACKING_LIST_PDF_ALIASES = {
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

  const suffix = norm(packlistSuffix).toUpperCase();
  if (!suffix) throw new Error('❌ Debes indicar el sufijo (ej: TENA)');

  // 1) Enviar PDF al backend
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${backendUrl}/extract`, { method: 'POST', body: form });
  console.log(`Backend PDF response: ${res} ${res.status} ${res.statusText}`);
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

  // 3) Índices
  const idxPacklist = findColIndex(headers, [
    'Packlist Number',
    'Packlist No',
    'Packlist',
    'Packlist N',
  ]);

  if (idxPacklist === -1) {
    throw new Error(
      `❌ No encuentro "Packlist Number" para filtrar. Headers: ${headers.join(' | ')}`
    );
  }

  // Aquí usamos PACKING_LIST_COLUMNS como “nombres destino”
  // y añadimos aliases para encontrar columnas en el PDF:
  const idxPallet = findColIndex(headers, [
    ...PACKING_LIST_COLUMNS.pallet,         // "CRT No"
    ...PACKING_LIST_PDF_ALIASES.pallet,     // "N", etc
  ]);

  const idxLote = findColIndex(headers, [
    ...PACKING_LIST_COLUMNS.lote,           // "Batch Number"
    ...PACKING_LIST_PDF_ALIASES.lote,       // "Batch"
  ]);

  const idxCantidad = findColIndex(headers, [
    ...PACKING_LIST_COLUMNS.cantidad,       // "Qty"
    ...PACKING_LIST_PDF_ALIASES.cantidad,   // "Quantity"
  ]);

  if (idxPallet === -1 || idxLote === -1 || idxCantidad === -1) {
    throw new Error(
      `❌ Faltan columnas necesarias para Packing List (pallet/lote/cantidad). ` +
      `Headers: ${headers.join(' | ')}`
    );
  }

  // 4) Filtrar por sufijo en Packlist Number
  const filteredRows = rows.filter(r => {
    const pack = norm(r[idxPacklist]).toUpperCase();
    return pack.endsWith(suffix);
  });

  // 5) Devolver en el formato final que tu app espera (según PACKING_LIST_COLUMNS)
  const out: PackingListData[] = filteredRows
    .map(r => {
      const crtNo = norm(r[idxPallet]);      // N -> CRT No (valor)
      const batch = norm(r[idxLote]);
      const qtyRaw = norm(r[idxCantidad]);
      const qty = Number(qtyRaw.replace(',', '.')) || 0;

      if (!crtNo && !batch && !qtyRaw) return null;

      // Claves finales: las de tu config ("CRT No", "Batch Number", "Qty")
      return {
        [PACKING_LIST_COLUMNS.pallet[0]]: crtNo,
        [PACKING_LIST_COLUMNS.lote[0]]: batch,
        [PACKING_LIST_COLUMNS.cantidad[0]]: qty,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    })
    .filter(Boolean) as PackingListData[];

  return out;
}
