import { getExcelHeaders } from '../../services/getExcelHeaders';
import { ProcessedData } from './excelProcessor';

/**
 * 📌 INTERFAZ PackingListData
 * Representa la información extraída del Packing List.
 */
export interface PackingListData {
  pallet: number;
  lote: string;
  cantidad: number;
  cantidadCajas?: number; // 🔥 Nueva propiedad que se calculará después
}

/**
 * 📌 FUNCIÓN: processPackingList
 * Procesa el archivo Packing List en Excel y extrae la información necesaria.
 * Si ya tenemos datos del Excel Base, calcula `cantidadCajas`.
 * 
 * @param file - Archivo Packing List
 * @param excelData - Datos del Excel Base (opcional, si ya se ha subido)
 * @returns Promesa con los datos procesados
 */
export const processPackingList = async (
  file: File,
  excelData: ProcessedData[] | null
): Promise<PackingListData[]> => {
  try {
    const { rows } = await getExcelHeaders(file);

    // Procesamos los datos del Packing List
    const processedData: PackingListData[] = rows.map(row => ({
      pallet: Number(row.pallet),
      lote: row.lote as string,
      cantidad: Number(row.cantidad),
      cantidadCajas: undefined, // 🔥 Se calculará después si tenemos `excelData`
    }));

    // 📌 Si ya tenemos el Excel Base, calculamos `cantidadCajas`
    if (excelData) {
      processedData.forEach(packingItem => {
        const matchingLote = excelData.find(excelItem => excelItem.lote === packingItem.lote);
        if (matchingLote) {
          packingItem.cantidadCajas = Math.floor(packingItem.cantidad / matchingLote.unidadCaja);
        }
      });
    }

    console.log('📌 Datos del Packing List procesados:', processedData);

    return processedData;
  } catch (error) {
    console.error('Error al procesar el archivo Packing List:', error);
    throw error;
  }
};
