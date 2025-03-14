import { useState } from "react";
import { optimizePallets, OptimizedPallet } from "../services/optimizePallets";
import { PackingListData } from "../features/processing/packingListProcessor";
import { ProcessedData } from "../features/processing/excelProcessor";

const usePalletData = () => {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [packingListFile, setPackingListFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<ProcessedData[] | null>(null);
  const [packingListData, setPackingListData] = useState<PackingListData[] | null>(null);
  const [palletOption, setPalletOption] = useState<number>(16); // 🔹 Valor por defecto: 16 cajas
  const [optimizedResults, setOptimizedResults] = useState<OptimizedPallet[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  const handleFilesUploaded = (newExcelData: ProcessedData[], newPackingListData: PackingListData[]) => {
    console.log("📂 Archivos subidos:", { newExcelData, newPackingListData });
  
    setExcelData(newExcelData); // ✅ Guardamos los datos del Excel
    setPackingListData(newPackingListData); // ✅ Guardamos los datos del Packing List
  
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
    setExcelFile(null);
    setPackingListFile(null);
    setExcelData(null);
    setPackingListData(null);
    setOptimizedResults([]);
    setIsDataLoaded(false);
  };

  return {
    excelFile,
    setExcelFile,
    packingListFile,
    setPackingListFile,
    excelData, 
    setExcelData,
    packingListData,
    setPackingListData, 
    optimizedResults,
    palletOption,
    isDataLoaded,
    setPalletOption,
    handleFilesUploaded,
    resetProcess,
  };
};

export default usePalletData;
