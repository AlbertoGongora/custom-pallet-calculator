import * as XLSX from 'xlsx';
import { EXCEL_COLUMNS, PACKING_LIST_COLUMNS } from '../config';

/**
 * 📌 Función que obtiene las cabeceras y extrae solo las columnas necesarias del archivo Excel.
 * @param file - Archivo Excel
 * @returns Objeto con las cabeceras y los datos extraídos según `config.ts`
 */
export const getExcelHeaders = async (
  file: File
): Promise<{ headers: string[]; rows: Record<string, string | number>[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // 📌 Tomamos la primera hoja
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

        if (jsonData.length < 2) {
          reject('El archivo Excel no tiene datos suficientes.');
          return;
        }

        // 🔹 Normalizamos las cabeceras (eliminamos saltos de línea y espacios extra)
        const rawHeaders = jsonData[0] as string[];
        const normalizedHeaders = rawHeaders.map(h =>
          h.replace(/[\r\n]+/g, ' ')  // 🔥 Elimina saltos de línea (\r\n)
           .replace(/\s+/g, ' ')      // 🔥 Reemplaza múltiples espacios por uno solo
           .trim()
           .toLowerCase()
        );

        const rows = jsonData.slice(1).filter(row => row.length > 0) as (string | number)[][];

        // 🔍 Detectamos si el archivo es Packing List o Excel Base
        const isExcelBase = EXCEL_COLUMNS.lote.some(col =>
          normalizedHeaders.includes(col.replace(/[\r\n]+/g, ' ').trim().toLowerCase())
        );
        const isPackingList = PACKING_LIST_COLUMNS.lote.some(col =>
          normalizedHeaders.includes(col.replace(/[\r\n]+/g, ' ').trim().toLowerCase())
        );

        if (!isExcelBase && !isPackingList) {
          console.error("🚨 ERROR: No se detectaron las columnas esperadas.");
          console.error("🔎 Cabeceras encontradas:", normalizedHeaders);
          reject('El archivo no tiene las columnas esperadas.');
          return;
        }

        // 📌 Mapeamos los índices de las columnas requeridas
        const validColumns = isExcelBase ? EXCEL_COLUMNS : PACKING_LIST_COLUMNS;
        const columnIndices: Record<string, number> = {};

        Object.entries(validColumns).forEach(([key, possibleNames]) => {
          const index = normalizedHeaders.findIndex(header =>
            possibleNames.map(name => name.replace(/[\r\n]+/g, ' ').trim().toLowerCase()).includes(header)
          );
          if (index !== -1) {
            columnIndices[key] = index;
          }
        });

        // 📌 Extraemos los datos de las columnas requeridas
        const extractedData: Record<string, string | number>[] = [];

        rows.forEach((row) => {
          if (isPackingList) {
            // 🔥 Lógica especial para Packing List (Múltiples lotes por pallet)
            const palletValue = row[columnIndices.pallet];
            const palletNumber = typeof palletValue === 'number' ? palletValue : parseInt(palletValue as string, 10) || '';

            // 🔍 Separar lotes y cantidades por saltos de línea
            const lotesRaw = row[columnIndices.lote];
            const cantidadesRaw = row[columnIndices.cantidad];

            const lotes = typeof lotesRaw === 'string' ? lotesRaw.split(/\r?\n/) : [lotesRaw?.toString() || ""];
            const cantidades = typeof cantidadesRaw === 'string' ? cantidadesRaw.split(/\r?\n/) : [cantidadesRaw?.toString() || "0"];

            // 🔹 Iteramos sobre cada lote y asignamos su cantidad correspondiente
            lotes.forEach((lote, index) => {
              extractedData.push({
                pallet: palletNumber,
                lote: lote.trim(),
                cantidad: cantidades[index] ? parseInt(cantidades[index], 10) || 0 : 0, // 🔥 Convierte cantidad a número
              });
            });
          } else {
            // 🔥 Lógica para Excel Base (Extraer datos sin procesar)
            extractedData.push({
              lote: row[columnIndices.lote] as string,
              cantidad: row[columnIndices.cantidad] as number,
              unidadCaja: row[columnIndices.unidadCaja] as number,
            });
          }
        });

        resolve({ headers: normalizedHeaders, rows: extractedData });
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
        reject('Error al leer los datos del archivo.');
      }
    };

    reader.onerror = () => reject('Error al leer el archivo.');
    reader.readAsArrayBuffer(file);
  });
};
