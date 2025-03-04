import { useState } from "react";
import { ProcessedData } from "../features/processing/excelProcessor";
import { PackingListData } from "../features/processing/packingListProcessor";
import { optimizePallets, OptimizedPallet } from "../services/optimizationService";

/**
 * 📌 **Hook personalizado `usePalletData`**
 * Gestiona los estados y la lógica del procesamiento de pallets.
 */
const usePalletData = () => {
  // 🔹 Estados para almacenar los datos cargados
  const [processedData, setProcessedData] = useState<ProcessedData[]>([]);
  const [packingListData, setPackingListData] = useState<PackingListData[]>([]);
  const [optimizedResults, setOptimizedResults] = useState<OptimizedPallet[]>([]);
  const [palletOption, setPalletOption] = useState<number>(16);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Estado para manejar la visibilidad

  /**
   * 📌 **Función `handleFilesUploaded`**
   * Se ejecuta cuando los archivos son procesados correctamente.
   * Recibe datos del Excel y del Packing List, los optimiza y actualiza los estados.
   */
  const handleFilesUploaded = (excelData: ProcessedData[], packingList: PackingListData[]) => {
    setProcessedData(excelData);
    setPackingListData(packingList);

    // 🔹 Optimiza los pallets una vez que tenemos los datos cargados
    const optimized = optimizePallets(packingList, palletOption);
    setOptimizedResults(optimized);

    // 🔹 Marca que los datos están listos y oculta la sección de subida
    setIsDataLoaded(true);
  };

  /**
   * 📌 **Función `resetProcess`**
   * Restaura los estados para iniciar un nuevo pedido.
   */
  const resetProcess = () => {
    setProcessedData([]);
    setPackingListData([]);
    setOptimizedResults([]);
    setIsDataLoaded(false);
  };

  return {
    processedData,
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
