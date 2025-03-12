
import { ProcessedData, processExcelFile } from '../features/processing/excelProcessor';
import { PackingListData, processPackingList } from '../features/processing/packingListProcessor';
import { detectExcelType } from './detectExcelType';

/**
 * 📌 INTERFAZ `FileProcessingResult`
 * Define el resultado del procesamiento de archivos.
 */
export interface FileProcessingResult {
  excelData?: ProcessedData[];
  packingListData?: PackingListData[];
  extractedData?: string; // Para datos extraídos de imágenes/PDF (futuro OCR)
  error?: string;
}

/**
 * 📌 FUNCIÓN `processUploadedFile`
 * Detecta el tipo de archivo y lo procesa correctamente.
 * @param file - Archivo a procesar (Excel o Packing List)
 * @returns Promesa con los datos procesados o un mensaje de error.
 */
export const processUploadedFile = async (file: File): Promise<FileProcessingResult> => {
  try {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    // 📌 🔍 Si el archivo es Excel (XLSX o XLS)
    if (fileType === 'xlsx' || fileType === 'xls') {
      const detectedType = await detectExcelType(file);

      if (detectedType === 'excel') {
        return { excelData: await processExcelFile(file) };
      } else if (detectedType === 'packingList') {
        return { packingListData: await processPackingList(file) };
      } else {
        return { error: 'El archivo Excel no tiene las columnas esperadas.' };
      }
    }

    // 📌 🔍 Si el archivo es una imagen (PNG, JPG, JPEG) o un PDF
    if (fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg' || fileType === 'pdf') {
      console.log(`🔍 Se detectó un archivo de tipo: ${fileType}`);
      
      // ⚠️ Aquí iría la lógica futura para OCR
      return { extractedData: "🔍 Datos extraídos del OCR (pendiente de implementación)" };
    }

    return { error: 'Formato de archivo no soportado.' };
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    return { error: `Error procesando el archivo: ${file.name}` };
  }
};
