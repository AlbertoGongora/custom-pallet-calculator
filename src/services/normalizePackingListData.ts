import { PackingListData } from "../features/processing/packingListProcessor";
import { ProcessedData } from "../features/processing/excelProcessor";

/**
 * 🔥 Corrige `packingListData` asignando `cantidadCajas` si es `undefined`
 */
export const normalizePackingListData = (
  packingListData: PackingListData[],
  excelData: ProcessedData[]
): PackingListData[] => {
  return packingListData.map((item) => {
    if (item.cantidadCajas === undefined) {
      const excelEntry = excelData.find((e) => e.lote === item.lote);
      if (excelEntry && excelEntry.unidadCaja > 0) {
        const calculatedCajas = Math.floor(item.cantidad / excelEntry.unidadCaja);
        console.warn(`⚠️ Corrigiendo cantidadCajas para lote ${item.lote}: ${calculatedCajas} cajas.`);
        return { ...item, cantidadCajas: calculatedCajas };
      }
    }
    return item;
  });
};
