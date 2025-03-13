import { EXCEL_COLUMNS, PACKING_LIST_COLUMNS } from '../config';
import { getExcelHeaders } from './getExcelHeaders';

/**
 * 📌 Detecta si un archivo Excel es un "Excel Base" o un "Packing List".
 * @param file - Archivo Excel
 * @returns 'excel' si es Excel Base, 'packingList' si es Packing List, o null si no coincide con ninguno.
 */
export const detectExcelType = async (file: File): Promise<'excel' | 'packingList' | null> => {
  try {
    const { headers } = await getExcelHeaders(file);

    // 🔥 Asegurar que la comparación ignora espacios y diferencias en mayúsculas/minúsculas
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());

    const isExcelBase = EXCEL_COLUMNS.lote.some(col => normalizedHeaders.includes(col.trim().toLowerCase()));
    const isPackingList = PACKING_LIST_COLUMNS.lote.some(col => normalizedHeaders.includes(col.trim().toLowerCase()));

    if (isExcelBase) return 'excel';
    if (isPackingList) return 'packingList';

    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};
