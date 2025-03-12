import { PACKING_LIST_COLUMNS } from '../../config';
import { getExcelHeaders } from '../../services/getExcelHeaders';

/**
 * 📌 INTERFAZ PackingListData
 * Representa la información extraída del Packing List.
 */
export interface PackingListData {
  pallet: number;
  lote: string;
  cantidad: number;
}

/**
 * 📌 FUNCIÓN: processPackingList
 * Procesa el archivo Packing List en Excel y extrae la información necesaria.
 * @param file - Archivo Packing List
 * @returns Promesa con los datos procesados
 */
export const processPackingList = async (file: File): Promise<PackingListData[]> => {
  try {
    const { headers, rows } = await getExcelHeaders(file);

    // Verificamos que las columnas requeridas existen en el archivo
    const palletIndex = headers.findIndex((h) => PACKING_LIST_COLUMNS.pallet.includes(h));
    const loteIndex = headers.findIndex((h) => PACKING_LIST_COLUMNS.lote.includes(h));
    const cantidadIndex = headers.findIndex((h) => PACKING_LIST_COLUMNS.cantidad.includes(h));

    if (palletIndex === -1 || loteIndex === -1 || cantidadIndex === -1) {
      throw new Error('El archivo Packing List no tiene las columnas requeridas.');
    }

    // Procesamos los datos
    return rows.map((row) => ({
      pallet: Number(row[palletIndex]),
      lote: row[loteIndex] as string,
      cantidad: Number(row[cantidadIndex]),
    }));
  } catch (error) {
    console.error('Error al procesar el archivo Packing List:', error);
    throw error;
  }
};
