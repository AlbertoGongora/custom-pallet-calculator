import { ProcessedData, processExcelFile } from '../features/processing/excelProcessor';
import { PackingListData, processPackingList } from '../features/processing/packingListProcessor';
import { detectExcelType } from './detectExcelType';
import { processPdfPackingList } from './pdfPackingListService';

export interface FileProcessingResult {
  excelData?: ProcessedData[];
  packingListData?: PackingListData[];
  extractedData?: string;
  error?: string;
}

/**
 * 📌 Procesa archivos subidos (Excel / Packing List / PDF)
 */
export const processUploadedFile = async (
  file: File,
  packlistSuffix?: string
): Promise<FileProcessingResult> => {
  try {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    // 🔹 Excel
    if (fileType === 'xlsx' || fileType === 'xls') {
      const detectedType = await detectExcelType(file);

      if (detectedType === 'excel') {
        return { excelData: await processExcelFile(file) };
      }

      if (detectedType === 'packingList') {
        return { packingListData: await processPackingList(file, null) };
      }

      return { error: 'El archivo Excel no tiene las columnas esperadas.' };
    }

    // 🔹 PDF → Packing List vía backend
    if (fileType === 'pdf') {
      console.log('📄 PDF detectado → enviando a backend');

      return {
        packingListData: await processPdfPackingList(file, packlistSuffix || ''),
      };
    }

    // 🔹 Imagen (futuro OCR)
    if (fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg') {
      return {
        extractedData: 'OCR pendiente de implementación',
      };
    }

    return { error: 'Formato de archivo no soportado.' };
  } catch (error) {
    console.error(error);
    return { error: `Error procesando el archivo: ${file.name}` };
  }
};
