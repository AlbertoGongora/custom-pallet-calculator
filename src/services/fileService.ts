import { ProcessedData, processExcelFile } from "../features/processing/excelProcessor";
import { PackingListData, processPackingList } from "../features/processing/packingListProcessor";
import { detectExcelType } from "./detectExcelType";
import { processPdfPackingList } from "./pdfPackingListService";

export interface FileProcessingResult {
  excelData?: ProcessedData[];
  packingListData?: PackingListData[];
  extractedData?: string;
  error?: string;
}

// ✅ ahora recibe packlistSuffix (solo se usa si es PDF)
export const processUploadedFile = async (
  file: File,
  packlistSuffix: string = ""
): Promise<FileProcessingResult> => {
  try {
    const fileType = file.name.split(".").pop()?.toLowerCase();

    if (fileType === "xlsx" || fileType === "xls") {
      const detectedType = await detectExcelType(file);

      if (detectedType === "excel") {
        return { excelData: await processExcelFile(file) };
      } else if (detectedType === "packingList") {
        return { packingListData: await processPackingList(file, null) };
      } else {
        return { error: "El archivo Excel no tiene las columnas esperadas." };
      }
    }

    // ✅ PDF => backend
    if (fileType === "pdf") {
      return { packingListData: await processPdfPackingList(file, packlistSuffix || "") };
    }

    if (fileType === "png" || fileType === "jpg" || fileType === "jpeg") {
      return { extractedData: "🔍 Datos extraídos del OCR (pendiente de implementación)" };
    }

    return { error: "Formato de archivo no soportado." };
  } catch (error) {
    console.error("Error al procesar el archivo:", error);
    return { error: `Error procesando el archivo: ${file.name}` };
  }
};
