import * as XLSX from 'xlsx';
import { EXCEL_COLUMNS } from '../../config';

/**
 * 📌 INTERFAZ ProcessedData
 * Representa la información procesada del archivo Excel base.
 */
export interface ProcessedData {
  lote: string; // Identificación del producto
  cantidad: number; // Total de unidades en el envío
  cajasTotales: number; // Total de cajas calculadas
}

/**
 * 📌 FUNCIÓN: processExcelFile
 * Procesa un archivo Excel, extrae los datos y calcula la cantidad total de cajas.
 * @param file - Archivo Excel
 * @returns Promesa con los datos procesados
 */
export const processExcelFile = async (file: File): Promise<ProcessedData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length < 2) {
          reject('El archivo Excel no tiene datos suficientes.');
          return;
        }

        const headers = jsonData[0] as string[];

        // Buscamos dinámicamente los índices de las columnas necesarias
        const loteIndex = headers.findIndex((h) => EXCEL_COLUMNS.lote.includes(h));
        const cantidadIndex = headers.findIndex((h) => EXCEL_COLUMNS.cantidad.includes(h));
        const unidadCajaIndex = headers.findIndex((h) => EXCEL_COLUMNS.unidadCaja.includes(h));

        if (loteIndex === -1 || cantidadIndex === -1 || unidadCajaIndex === -1) {
          reject('El archivo Excel no tiene las columnas requeridas.');
          return;
        }

        // Procesamos los datos
        const processedData: ProcessedData[] = jsonData.slice(1).map((row) => {
          const typedRow = row as unknown[];
          const totalCajas = (typedRow[cantidadIndex] as number) / (typedRow[unidadCajaIndex] as number);

          return {
            lote: typedRow[loteIndex] as string,
            cantidad: typedRow[cantidadIndex] as number,
            cajasTotales: Math.floor(totalCajas), // 🔥 Siempre será un número entero
          };
        });

        resolve(processedData);
      } catch {
        reject('Error al procesar el archivo Excel.');
      }
    };

    reader.onerror = () => reject('Error al leer el archivo.');
    reader.readAsArrayBuffer(file);
  });
};
