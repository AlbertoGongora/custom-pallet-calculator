import { processExcelFile, ProcessedData } from '../features/processing/excelProcessor';
import { processPackingList, PackingListData } from '../features/processing/packingListProcessor';

/**
 * 📌 INTERFAZ `FileProcessingResult`
 * Define el resultado del procesamiento de archivos.
 */
export interface FileProcessingResult {
  excelData?: ProcessedData[];
  packingListData?: PackingListData[];
  error?: string;
}

/**
 * 📌 FUNCIÓN `processUploadedFile`
 * Detecta el tipo de archivo y lo procesa correctamente.
 * 
 * @param file - Archivo a procesar (Excel o Packing List)
 * @returns Promesa con los datos procesados o un mensaje de error.
 */
export const processUploadedFile = async (file: File): Promise<FileProcessingResult> => {
  try {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    if (fileType === 'pdf' || fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg') {
      const packingListData = await processPackingList(file);
      return { packingListData };
    }

    if (fileType === 'xlsx' || fileType === 'xls') {
      const excelData = await processExcelFile(file);
      return { excelData };
    }

    return { error: 'Formato de archivo no soportado.' };
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    return { error: `Error procesando el archivo: ${file.name}` };
  }
};
