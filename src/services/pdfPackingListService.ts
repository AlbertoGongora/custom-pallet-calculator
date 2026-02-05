import type { PackingListData } from '../features/processing/packingListProcessor';
import { PACKING_LIST_COLUMNS } from '../config';

type ExtractResponse = {
  columns?: string[];
  headers?: string[];
  rows?: unknown[][];
  data?: {
    columns?: string[];
    rows?: unknown[][];
  };
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
    if (C.some(c => H[i].includes(c))) return i;
  }
  return -1;
}

const PACKING_LIST_PDF_ALIASES = {
  pallet: ['N', 'CRT', 'CRT NO'],
  lote: ['Batch', 'Batch Number'],
  cantidad: ['Quantity', 'Qty'],
} as const;

export async function processPdfPackingList(
  file: File,
  packlistSuffix: string
): Promise<PackingListData[]> {
  const backendUrl = import.meta.env.VITE_PDF_BACKEND_URL;
  if (!backendUrl) throw new Error('❌ Falta VITE_PDF_BACKEND_URL');

  const suffix = norm(packlistSuffix).toUpperCase();
  if (!suffix) throw new Error('❌ Debes indicar el sufijo (ej: TENA)');

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${backendUrl}/extract`, {
    method: 'POST',
    body: form,
  });

  console.log('[PDF] res.ok:', res.ok);
  console.log('[PDF] res.status:', res.status);

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`❌ Backend error ${res.status}: ${txt}`);
  }

  // 🔥 LEEMOS EL BODY UNA SOLA VEZ
  const json = (await res.json()) as ExtractResponse;

  console.log('[PDF] backend JSON:', json);

  const headers = (json.columns ?? json.headers ?? json.data?.columns ?? []).map(norm);
  const rows = (json.rows ?? json.data?.rows ?? []) as unknown[][];

  if (!headers.length || !rows.length) {
    console.warn('[PDF] Sin datos útiles');
    return [];
  }

  const idxPacklist = findColIndex(headers, [
    'Packlist Number',
    'Packlist No',
    'Packlist',
    'Packlist N',
  ]);

  if (idxPacklist === -1) {
    throw new Error(`❌ No se encuentra Packlist Number`);
  }

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
    throw new Error('❌ Faltan columnas clave en el PDF');
  }

  const filteredRows = rows.filter(r => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pack = norm((r as any[])[idxPacklist]).toUpperCase();
    return pack.endsWith(suffix);
  });

  console.log('[PDF] filas filtradas:', filteredRows.length);

  const result: PackingListData[] = filteredRows
    .map(r => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = r as any[];

      const pallet = norm(row[idxPallet]);
      const lote = norm(row[idxLote]);
      const qtyRaw = norm(row[idxCantidad]);
      const cantidad = Number(qtyRaw.replace(',', '.')) || 0;

      if (!pallet || !lote || !cantidad) return null;

      return {
        pallet: Number(pallet.replace(/\D/g, '')) || 0,
        lote,
        cantidad,
      };
    })
    .filter(Boolean) as PackingListData[];

  console.log('[PDF] resultado final:', result);

  return result;
}
