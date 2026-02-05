// src/services/pdfPackingListService.ts
import type { PackingListData } from "../features/processing/packingListProcessor";

type ExtractResponse = {
  columns?: unknown[];
  headers?: unknown[];
  rows?: unknown[][];
  data?: { columns?: unknown[]; rows?: unknown[][] };
};

function norm(v: unknown): string {
  return String(v ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toUpperNorm(v: unknown): string {
  return norm(v).toUpperCase();
}

function findColIndex(headers: string[], candidates: string[]): number {
  const H = headers.map((h) => norm(h).toLowerCase());
  const C = candidates.map((c) => norm(c).toLowerCase());

  // match exact
  for (let i = 0; i < H.length; i++) {
    if (C.includes(H[i])) return i;
  }
  // match contains
  for (let i = 0; i < H.length; i++) {
    const h = H[i];
    if (C.some((c) => h.includes(c))) return i;
  }
  return -1;
}

function parseQty(qtyRaw: string): number {
  // soporta "12", "12.0", "12,0"
  const n = Number(qtyRaw.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function parsePallet(palletRaw: string): number | null {
  // en PDF suele venir "1" o "01" o incluso "P1" (por si acaso)
  const cleaned = palletRaw.replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Aliases SOLO para el PDF (porque el PDF a veces no usa los mismos headers que tu Excel)
 */
const PACKING_LIST_PDF_ALIASES = {
  packlist: ["Packlist Number", "Packlist No", "Packlist", "Packlist N"],
  pallet: ["N", "CRT No", "CRT", "Pallet", "Pallet No"],
  lote: ["Batch Number", "Batch"],
  cantidad: ["Quantity", "Qty"],
} as const;

export async function processPdfPackingList(
  file: File,
  packlistSuffix: string
): Promise<PackingListData[]> {
  const backendUrl = import.meta.env.VITE_PDF_BACKEND_URL as string | undefined;
  if (!backendUrl) throw new Error("❌ Falta VITE_PDF_BACKEND_URL (Vercel/Local env).");

  const suffix = toUpperNorm(packlistSuffix);
  if (!suffix) throw new Error("❌ Debes indicar el sufijo (ej: TENA / TEO4).");

  // 1) Enviar PDF al backend
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${backendUrl}/extract`, { method: "POST", body: form });
  if (!res.ok) {
    // leemos texto SOLO en error
    const txt = await res.text().catch(() => "");
    throw new Error(`❌ Error backend PDF (${res.status}): ${txt || res.statusText}`);
  }

  // 2) Leer JSON (solo una vez)
  const json = (await res.json()) as ExtractResponse;

  console.log("[PDF Service] JSON recibido del backend:", json);

  const rawHeaders = (json.columns ?? json.headers ?? json.data?.columns ?? []) as unknown[];
  const rawRows = (json.rows ?? json.data?.rows ?? []) as unknown[][];

  const headers = rawHeaders.map(norm);
  const rows = rawRows;
  if (!headers.length || !rows.length) return [];

  // 3) Índices de columnas
  const idxPacklist = findColIndex(headers, [...PACKING_LIST_PDF_ALIASES.packlist]);
  if (idxPacklist === -1) {
    throw new Error(
      `❌ No encuentro columna de Packlist Number para filtrar. Headers: ${headers.join(" | ")}`
    );
  }

  const idxPallet = findColIndex(headers, [...PACKING_LIST_PDF_ALIASES.pallet]);
  const idxLote = findColIndex(headers, [...PACKING_LIST_PDF_ALIASES.lote]);
  const idxCantidad = findColIndex(headers, [...PACKING_LIST_PDF_ALIASES.cantidad]);

  if (idxPallet === -1 || idxLote === -1 || idxCantidad === -1) {
    throw new Error(
      `❌ Faltan columnas necesarias (pallet/lote/cantidad). Headers: ${headers.join(" | ")}`
    );
  }

  // 4) Encontrar el INICIO del bloque del packing list cuyo número termina en suffix
  const startIndex = rows.findIndex((r) => {
    const pack = toUpperNorm(r?.[idxPacklist]);
    return pack.endsWith(suffix);
  });

  if (startIndex === -1) {
    throw new Error(`❌ No encuentro ningún Packlist Number que termine en "${suffix}".`);
  }

  // 5) Capturar TODAS las filas del bloque:
  //    - empezando en startIndex
  //    - incluyendo filas con Packlist vacío (continuación)
  //    - PARANDO cuando aparece otro Packlist con contenido (nuevo bloque)
  const blockRows: unknown[][] = [];
  for (let i = startIndex; i < rows.length; i++) {
    const pack = toUpperNorm(rows[i]?.[idxPacklist]);

    if (i === startIndex) {
      blockRows.push(rows[i]);
      continue;
    }

    // si aparece un packlist nuevo con contenido -> se terminó el bloque
    if (pack !== "") break;

    // packlist vacío -> seguimos dentro del mismo bloque
    blockRows.push(rows[i]);
  }

  // 6) Normalizar: fill-down de pallet cuando venga vacío en filas siguientes
  const out: PackingListData[] = [];
  let lastPallet: number | null = null;

  for (const r of blockRows) {
    const palletRaw = norm(r?.[idxPallet]);
    const lote = norm(r?.[idxLote]);
    const qtyRaw = norm(r?.[idxCantidad]);

    // Heredar pallet si viene vacío
    let palletNum = parsePallet(palletRaw);
    if (palletNum === null && lastPallet !== null) palletNum = lastPallet;
    if (palletNum !== null) lastPallet = palletNum;

    // Si no hay lote y qty, saltamos (líneas vacías típicas)
    if (!lote && !qtyRaw) continue;

    const cantidad = parseQty(qtyRaw);

    // Si aún no tenemos pallet (caso raro), no tiene sentido para tu lógica
    if (palletNum === null) continue;

    out.push({
      pallet: palletNum,
      lote,
      cantidad,
      cantidadCajas: undefined, // lo calculará normalizePackingListData
    });
  }

  return out;
}
