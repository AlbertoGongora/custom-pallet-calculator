import { useState } from "react";
import { optimizePallets, OptimizedPallet } from "../services/optimizePallets";
import { PackingListData } from "../features/processing/packingListProcessor";
import { ProcessedData } from "../features/processing/excelProcessor";

const usePalletData = () => {
  const [excelData, setExcelData] = useState<ProcessedData[] | null>(null);
  const [packingListData, setPackingListData] = useState<PackingListData[] | null>(null);
  const [palletOption, setPalletOption] = useState<number>(16); // 🔹 Valor por defecto: 16 cajas
  const [optimizedResults, setOptimizedResults] = useState<OptimizedPallet[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const handleFilesUploaded = (newExcelData: ProcessedData[], newPackingListData: PackingListData[]) => {
    console.log("📂 Archivos subidos:", { newExcelData, newPackingListData });

    // ✅ Guardamos siempre el nuevo dataset y no solo si el anterior era null
    setExcelData(newExcelData);
    setPackingListData(newPackingListData);

    // 🚀 **Solo ejecutamos la optimización si ambos datasets están cargados**
    if (newExcelData.length > 0 && newPackingListData.length > 0) {
      console.log("🚀 Procesando optimización con:", { newPackingListData, newExcelData, palletOption });

      const optimized = optimizePallets(newPackingListData, newExcelData, palletOption);
      console.log("✅ Resultados optimizados:", optimized);

      setOptimizedResults(optimized);
      setIsDataLoaded(true);
    } else {
      console.warn("⚠️ Falta un archivo para procesar.");
    }
  };

  const resetProcess = () => {
    console.log("🔄 Reiniciando proceso...");
    setExcelData(null);
    setPackingListData(null);
    setOptimizedResults([]);
    setIsDataLoaded(false);
  };

  return {
    excelData, 
    packingListData, 
    optimizedResults,
    palletOption,
    isDataLoaded,
    setPalletOption,
    handleFilesUploaded,
    resetProcess,
  };
};

export default usePalletData;
