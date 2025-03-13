import { PackingListData } from "../features/processing/packingListProcessor";
import { ProcessedData } from "../features/processing/excelProcessor";

export interface OptimizedPallet {
  lote: string; // 🔹 Nombre del lote
  pallets: string[]; // 🔹 Lista de pallets con sus cantidades distribuidas
  extraPallets: number; // 🔹 Número de pallets extra creados
  cajasMovidas: number; // 🔹 Total de cajas reubicadas
}

export const optimizePallets = (
  packingListData: PackingListData[],
  excelData: ProcessedData[],
  palletLimit: number
): OptimizedPallet[] => {
  let totalExtraPallets = 0; // 🔢 Contador de pallets extra creados
  let totalCajasMovidas = 0; // 📦 Contador de cajas reubicadas

  // 📌 **Detectamos el número más alto de pallet en el Packing List**
  const maxPalletNumber = Math.max(...packingListData.map((p) => Number(p.pallet)).filter((n) => !isNaN(n)), 0);
  let nextExtraPallet = maxPalletNumber + 1; // 🔥 Definimos el primer pallet extra disponible

  // 📌 **Extraemos la lista final previa de lotes y el total de cajas desde el Excel Base**
  const lotesFinalPrevio = excelData.map(({ lote, cajasTotales }) => ({
    lote,
    totalCajas: cajasTotales, // 🔥 Total de cajas en el Excel Base
    pallets: [] as { pallet: string; cantidad: number }[], // 🔹 Se llenará después con los datos de lotesArray
  }));

  // 📌 **Calculamos la cantidad de cajas por pallet basándonos en `unidadCaja`**
  const processedData = packingListData.map((packingItem) => ({
    ...packingItem,
    cantidadCajas: packingItem.cantidadCajas ?? // Si ya tiene un valor, se usa
      (excelData.find((excelItem) => excelItem.lote === packingItem.lote)?.unidadCaja
        ? Math.floor(packingItem.cantidad / (excelData.find((excelItem) => excelItem.lote === packingItem.lote)!.unidadCaja))
        : 0),
  }));

  console.log("✅ Procesamiento inicial completado:", processedData);

  // 📌 **Paso 1: Agrupar pallets por lote en `lotesFinalPrevio`**
  processedData.forEach(({ pallet, lote, cantidadCajas }) => {
    const loteEntry = lotesFinalPrevio.find((entry) => entry.lote === lote);
    if (loteEntry) {
      loteEntry.pallets.push({ pallet: `P${pallet}`, cantidad: cantidadCajas ?? 0 });
    }
  });

  console.log("✅ Lotes agrupados en pallets:", lotesFinalPrevio);

  // 📌 **Paso 2: Procesar los pallets con múltiples lotes**
  lotesFinalPrevio.forEach((loteEntry) => {
    const { pallets } = loteEntry;
    const palletsFinal: { pallet: string; cantidad: number }[] = [];

    // 🔹 Agrupamos los pallets por número (ej: P1, P2, etc.)
    const palletsPorNumero: Record<string, { lote: string; cantidad: number }[]> = {};
    pallets.forEach(({ pallet, cantidad }) => {
      if (!palletsPorNumero[pallet]) {
        palletsPorNumero[pallet] = [];
      }
      palletsPorNumero[pallet].push({ lote: loteEntry.lote, cantidad });
    });

    // 🔄 Procesamos cada pallet para dejar solo el lote con más cajas
    Object.entries(palletsPorNumero).forEach(([pallet, lotes]) => {
      lotes.sort((a, b) => b.cantidad - a.cantidad); // 🔥 Ordenamos de mayor a menor cantidad de cajas

      const lotePrincipal = lotes.shift()!; // 🏆 Se queda el lote con más cajas
      palletsFinal.push({ pallet, cantidad: lotePrincipal.cantidad });

      // 🔄 Los otros lotes se mueven a nuevos pallets extra
      lotes.forEach(({ cantidad }) => {
        palletsFinal.push({ pallet: `PE${nextExtraPallet}`, cantidad });
        nextExtraPallet++; // 🔢 Incrementamos el contador de pallets extra
        totalExtraPallets++; // ➕ Sumamos al total de pallets extra
        totalCajasMovidas += cantidad; // 📦 Sumamos las cajas movidas
      });
    });

    // 📝 Actualizamos `lotesFinalPrevio` con la distribución final
    loteEntry.pallets = palletsFinal;
  });

  console.log("✅ Pallets con múltiples lotes reorganizados:", lotesFinalPrevio);
  console.log("📦 Pallets extra creados:", totalExtraPallets);
  console.log("📦 Cajas movidas:", totalCajasMovidas);

  // 📌 **Paso 3: Verificar la suma total de cajas por lote**
  lotesFinalPrevio.forEach((loteEntry) => {
    const { lote, pallets, totalCajas } = loteEntry;

    // 🔍 Sumamos la cantidad total de cajas distribuidas en los pallets
    const totalCajasDistribuidas = pallets.reduce((sum, { cantidad }) => sum + cantidad, 0);

    // ⚠️ Validamos que la cantidad distribuida coincida con el total del Excel Base
    if (totalCajasDistribuidas !== totalCajas) {
      console.error(`❌ Error: Diferencia de cajas en el lote ${lote}. 
      Esperado: ${totalCajas}, Distribuido: ${totalCajasDistribuidas}`);
    } else {
      console.log(`✅ Lote ${lote} verificado correctamente: ${totalCajasDistribuidas} cajas.`);
    }
  });

  // 📌 **Paso 4: Convertir `lotesFinalPrevio` en `OptimizedPallet[]`**
  const optimizedResults: OptimizedPallet[] = lotesFinalPrevio.map(({ lote, pallets }) => ({
    lote,
    pallets: pallets.map(({ pallet, cantidad }) => `${pallet} → ${cantidad}`), // 🔥 Convertimos el formato
    extraPallets: totalExtraPallets, // ✅ Número total de pallets extra creados
    cajasMovidas: totalCajasMovidas, // ✅ Número total de cajas movidas
  }));

  console.log("📦 Resultado final:", optimizedResults);
  return optimizedResults;


  // // 🔥 **Paso 2: Optimización de pallets**
  // const optimizedResults: OptimizedPallet[] = [];

  // lotesArray.forEach(({ lote, pallets }) => {
  //   const palletsFinal: string[] = []; // 🔹 Lista final de pallets optimizados para este lote
  //   const cajasPendientes: { pallet: string; cantidad: number }[] = []; // 🔹 Lista de cajas que deben reubicarse

  //   // 🔹 Paso 2.1: Agrupamos los pallets por número
  //   const palletsPorNumero: Record<string, { lote: string; cantidad: number }[]> = {};
  //   pallets.forEach(({ pallet, cantidad }) => {
  //     if (!palletsPorNumero[pallet]) {
  //       palletsPorNumero[pallet] = [];
  //     }
  //     palletsPorNumero[pallet].push({ lote, cantidad }); // 🔹 Asociamos el pallet con el lote y la cantidad
  //   });

  //   // 🔹 Paso 2.2: Revisamos cada pallet y dividimos lotes si es necesario
  //   Object.entries(palletsPorNumero).forEach(([pallet, lotes]) => {
  //     lotes.sort((a, b) => b.cantidad - a.cantidad); // 🔥 Ordenamos por cantidad de cajas (mayor a menor)

  //     const lotePrincipal = lotes.shift()!; // 🏆 Mantenemos el lote con más cajas en el pallet original
  //     palletsFinal.push(`${pallet} → ${lotePrincipal.cantidad}`);

  //     // 🔹 Los lotes adicionales se deben reubicar
  //     lotes.forEach(({ cantidad }) => {
  //       cajasPendientes.push({ pallet, cantidad });
  //     });
  //   });

  //   // 📌 **Paso 3: Intentamos reubicar los lotes con menos cajas**
  //   while (cajasPendientes.length > 0) {
  //     let { cantidad } = cajasPendientes.shift()!; // 🔹 Obtenemos la cantidad de cajas a reubicar

  //     let assigned = false;

  //     // 📌 **Intentamos asignar las cajas a otro pallet del mismo lote**
  //     for (let i = 0; i < palletsFinal.length; i++) {
  //       const match = palletsFinal[i].match(/P\d+ → (\d+)/);
  //       if (match) {
  //         const currentCantidad = parseInt(match[1], 10);
  //         if (currentCantidad + cantidad <= palletLimit) {
  //           palletsFinal[i] = palletsFinal[i].replace(
  //             /P\d+ → \d+/,
  //             (p) => `${p.split(" → ")[0]} → ${currentCantidad + cantidad}`
  //           );
  //           totalCajasMovidas += cantidad;
  //           assigned = true;
  //           break;
  //         }
  //       }
  //     }

  //     // 📌 **Si no se puede reubicar, creamos un nuevo pallet extra**
  //     if (!assigned) {
  //       while (cantidad > palletLimit) {
  //         palletsFinal.push(`PE${nextExtraPallet} → ${palletLimit}`);
  //         totalExtraPallets++;
  //         totalCajasMovidas += palletLimit;
  //         cantidad -= palletLimit;
  //         nextExtraPallet++;
  //       }

  //       if (cantidad > 0) {
  //         palletsFinal.push(`PE${nextExtraPallet} → ${cantidad}`);
  //         totalExtraPallets++;
  //         totalCajasMovidas += cantidad;
  //         nextExtraPallet++;
  //       }
  //     }
  //   }

  //   // 📌 **Paso 4: Identificamos pallets vacíos tras la reorganización**
  //   const absorbedPallets: string[] = [];
  //   const singleBoxPallets = cajasPendientes.filter((p) => p.cantidad === 1);
  //   if (singleBoxPallets.length > 1) {
  //     const mainPallet = pallets[0].pallet;
  //     singleBoxPallets.forEach(({ pallet }) => {
  //       absorbedPallets.push(`${pallet}X→1`);
  //     });
  //     palletsFinal.push(`${mainPallet} → ${singleBoxPallets.length} (${absorbedPallets.join(", ")})`);
  //   }

  //   // 📌 **Paso 5: Guardamos los resultados optimizados**
  //   optimizedResults.push({
  //     lote,
  //     pallets: palletsFinal,
  //     extraPallets: totalExtraPallets, // 📦 Total de pallets extra creados
  //     cajasMovidas: totalCajasMovidas, // 📦 Total de cajas movidas
  //   });
  // });

  // return optimizedResults;
};
