import { PackingListData } from "../features/processing/packingListProcessor";
import { ProcessedData } from "../features/processing/excelProcessor";

export interface OptimizedPallet {
  lote: string; // 🔹 Nombre del lote
  pallets: string[]; // 🔹 Lista de pallets con sus cantidades distribuidas
  extraPallets: number; // 🔹 Número de pallets extra creados
  cajasMovidas: number; // 🔹 Total de cajas reubicadas
}

/**
 * 📦 **Optimiza la distribución de pallets respetando la regla de 1 lote por pallet**
 * @param packingListData Datos del Packing List
 * @param excelData Datos del Excel Base
 * @param palletLimit Máximo de cajas por pallet (12 o 16, según selección del usuario)
 * @returns Lista de pallets optimizados con la distribución correcta
 */
export const optimizePallets = (
  packingListData: PackingListData[], 
  excelData: ProcessedData[], 
  palletLimit: number
): OptimizedPallet[] => {

  const lotesArray: { lote: string; pallets: { pallet: string; cantidad: number }[] }[] = []; 
  // 🔹 Lista que agrupará lotes con sus pallets correspondientes

  let totalExtraPallets = 0; // 🔢 Contador de pallets extra creados
  let totalCajasMovidas = 0; // 📦 Contador de cajas reubicadas

  // 📌 **Detectamos el número más alto de pallet en el Packing List**
  const maxPalletNumber = Math.max(...packingListData.map((p) => Number(p.pallet)).filter((n) => !isNaN(n)), 0);
  let nextExtraPallet = maxPalletNumber + 1; // 🔥 Definimos el primer pallet extra disponible

  // 📌 **Calculamos la cantidad de cajas por pallet basándonos en `unidadCaja`**
  const processedData = packingListData.map((packingItem) => {
    const matchingLote = excelData.find((excelItem) => excelItem.lote === packingItem.lote);
    return {
      ...packingItem,
      cantidadCajas: matchingLote ? Math.floor(packingItem.cantidad / matchingLote.unidadCaja) : 0,
    };
  });

  // 📌 **Paso 1: Agrupar pallets por lote en un array**
  processedData.forEach(({ pallet, lote, cantidadCajas }) => {
    let loteEntry = lotesArray.find((entry) => entry.lote === lote);

    if (!loteEntry) {
      loteEntry = { lote, pallets: [] }; // 🔹 Creamos la entrada del lote si no existe
      lotesArray.push(loteEntry);
    }

    loteEntry.pallets.push({ pallet: `P${pallet}`, cantidad: cantidadCajas }); // 🔹 Agregamos la información del pallet
  });

  // 🔥 **Paso 2: Optimización de pallets**
  const optimizedResults: OptimizedPallet[] = [];

  lotesArray.forEach(({ lote, pallets }) => {
    const palletsFinal: string[] = []; // 🔹 Lista final de pallets optimizados para este lote
    const cajasPendientes: { pallet: string; cantidad: number }[] = []; // 🔹 Lista de cajas que deben reubicarse

    // 🔹 Paso 2.1: Agrupamos los pallets por número
    const palletsPorNumero: Record<string, { lote: string; cantidad: number }[]> = {};
    pallets.forEach(({ pallet, cantidad }) => {
      if (!palletsPorNumero[pallet]) {
        palletsPorNumero[pallet] = [];
      }
      palletsPorNumero[pallet].push({ lote, cantidad }); // 🔹 Asociamos el pallet con el lote y la cantidad
    });

    // 🔹 Paso 2.2: Revisamos cada pallet y dividimos lotes si es necesario
    Object.entries(palletsPorNumero).forEach(([pallet, lotes]) => {
      lotes.sort((a, b) => b.cantidad - a.cantidad); // 🔥 Ordenamos por cantidad de cajas (mayor a menor)

      const lotePrincipal = lotes.shift()!; // 🏆 Mantenemos el lote con más cajas en el pallet original
      palletsFinal.push(`${pallet} → ${lotePrincipal.cantidad}`);

      // 🔹 Los lotes adicionales se deben reubicar
      lotes.forEach(({ cantidad }) => {
        cajasPendientes.push({ pallet, cantidad });
      });
    });

    // 📌 **Paso 3: Intentamos reubicar los lotes con menos cajas**
    while (cajasPendientes.length > 0) {
      let { cantidad } = cajasPendientes.shift()!; // 🔹 Obtenemos la cantidad de cajas a reubicar

      let assigned = false;

      // 📌 **Intentamos asignar las cajas a otro pallet del mismo lote**
      for (let i = 0; i < palletsFinal.length; i++) {
        const match = palletsFinal[i].match(/P\d+ → (\d+)/);
        if (match) {
          const currentCantidad = parseInt(match[1], 10);
          if (currentCantidad + cantidad <= palletLimit) {
            palletsFinal[i] = palletsFinal[i].replace(
              /P\d+ → \d+/,
              (p) => `${p.split(" → ")[0]} → ${currentCantidad + cantidad}`
            );
            totalCajasMovidas += cantidad;
            assigned = true;
            break;
          }
        }
      }

      // 📌 **Si no se puede reubicar, creamos un nuevo pallet extra**
      if (!assigned) {
        while (cantidad > palletLimit) {
          palletsFinal.push(`PE${nextExtraPallet} → ${palletLimit}`);
          totalExtraPallets++;
          totalCajasMovidas += palletLimit;
          cantidad -= palletLimit;
          nextExtraPallet++;
        }

        if (cantidad > 0) {
          palletsFinal.push(`PE${nextExtraPallet} → ${cantidad}`);
          totalExtraPallets++;
          totalCajasMovidas += cantidad;
          nextExtraPallet++;
        }
      }
    }

    // 📌 **Paso 4: Identificamos pallets vacíos tras la reorganización**
    const absorbedPallets: string[] = [];
    const singleBoxPallets = cajasPendientes.filter((p) => p.cantidad === 1);
    if (singleBoxPallets.length > 1) {
      const mainPallet = pallets[0].pallet;
      singleBoxPallets.forEach(({ pallet }) => {
        absorbedPallets.push(`${pallet}X→1`);
      });
      palletsFinal.push(`${mainPallet} → ${singleBoxPallets.length} (${absorbedPallets.join(", ")})`);
    }

    // 📌 **Paso 5: Guardamos los resultados optimizados**
    optimizedResults.push({
      lote,
      pallets: palletsFinal,
      extraPallets: totalExtraPallets, // 📦 Total de pallets extra creados
      cajasMovidas: totalCajasMovidas, // 📦 Total de cajas movidas
    });
  });

  // 📌 **Paso 6: Registro en consola para depuración**
  console.log("📦 Resultado final:", optimizedResults);
  console.log("➡️ Total Pallets Extra:", totalExtraPallets);
  console.log("➡️ Total Cajas Movidas:", totalCajasMovidas);

  return optimizedResults;
};
