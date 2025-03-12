import { getExcelHeaders } from '../../services/getExcelHeaders';

/**
 * 📌 INTERFAZ ProcessedData
 * Representa la información procesada del archivo Excel base.
 */
export interface ProcessedData {
  lote: string;
  cantidad: number;
  unidadCaja: number;
  cajasTotales: number;
}

/**
 * 📌 FUNCIÓN: processExcelFile
 * Procesa un archivo Excel y calcula las cajas totales.
 * @param file - Archivo Excel
 * @returns Promesa con los datos procesados
 */
export const processExcelFile = async (file: File): Promise<ProcessedData[]> => {
  try {
    const { rows } = await getExcelHeaders(file); // 🔥 Extraemos solo los datos relevantes

    // Procesamos los datos
    return rows.map((row) => {
      const cantidad = row['cantidad'] as number;
      const unidadCaja = row['unidadCaja'] as number;
      const totalCajas = unidadCaja > 0 ? Math.floor(cantidad / unidadCaja) : 0; // Evitamos división por 0

      return {
        lote: row['lote'] as string,
        cantidad,
        unidadCaja,
        cajasTotales: totalCajas,
      };
    });
  } catch (error) {
    console.error('Error al procesar el archivo Excel:', error);
    throw error;
  }
};
