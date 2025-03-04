import * as XLSX from 'xlsx';
import { PACKING_LIST_COLUMNS } from '../../config';

/**
 * 📌 INTERFAZ PackingListData
 * Representa la información extraída del Packing List.
 */
export interface PackingListData {
  pallet: number; // Número del pallet
  lote: string; // Lote asociado al pallet
  cantidad: number; // Unidades en ese pallet
}

/**
 * 📌 FUNCIÓN: processPackingList
 * Procesa el archivo Packing List en Excel y extrae la información necesaria.
 * @param file - Archivo Packing List
 * @returns Promesa con los datos procesados
 */
export const processPackingList = async (file: File): Promise<PackingListData[]> => {
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
          reject('El archivo Packing List no tiene datos suficientes.');
          return;
        }

        const headers = jsonData[0] as string[];

        // Buscamos dinámicamente los índices de las columnas necesarias
        const palletIndex = headers.findIndex((h) => PACKING_LIST_COLUMNS.pallet.includes(h));
        const loteIndex = headers.findIndex((h) => PACKING_LIST_COLUMNS.lote.includes(h));
        const cantidadIndex = headers.findIndex((h) => PACKING_LIST_COLUMNS.cantidad.includes(h));

        if (palletIndex === -1 || loteIndex === -1 || cantidadIndex === -1) {
          reject('El archivo Packing List no tiene las columnas requeridas.');
          return;
        }

        // Procesamos los datos
        const processedData: PackingListData[] = jsonData.slice(1).map((row) => {
          const typedRow = row as [number, string, number];

          return {
            pallet: Number(typedRow[palletIndex]),
            lote: typedRow[loteIndex] as string,
            cantidad: Number(typedRow[cantidadIndex]),
          };
        });

        resolve(processedData);
      } catch {
        reject('Error al procesar el archivo Packing List.');
      }
    };

    reader.onerror = () => reject('Error al leer el archivo.');
    reader.readAsArrayBuffer(file);
  });
};
