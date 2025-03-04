import { PackingListData } from "../features/processing/packingListProcessor";

export interface OptimizedPallet {
  lote: string;
  pallets: string[]; // Lista de pallets con cantidades distribuidas
  extraPallets: number; // Pallets añadidos por reubicación
  cajasMovidas: number; // Total de cajas reubicadas
  palletsVaciados: string[]; // Lista de pallets que quedaron vacíos
}

/**
 * 🏗️ Función para optimizar los pallets y redistribuirlos si es necesario
 * @param packingListData Datos procesados del Packing List
 * @param palletOption Tamaño de pallet seleccionado (12 o 16)
 * @returns Array de pallets optimizados con su distribución
 */
export const optimizePallets = (
  packingListData: PackingListData[],
  palletOption: number
): OptimizedPallet[] => {
  const lotesMap = new Map<string, PackingListData[]>();

  // 🔹 Agrupar pallets por lote
  packingListData.forEach((item) => {
    if (!lotesMap.has(item.lote)) {
      lotesMap.set(item.lote, []);
    }
    lotesMap.get(item.lote)?.push(item);
  });

  const optimizedPallets: OptimizedPallet[] = [];

  lotesMap.forEach((pallets, lote) => {
    let totalCajas = pallets.reduce((sum, p) => sum + p.cantidad, 0);
    let extraPallets = 0;
    let cajasMovidas = 0;
    const palletsVaciados: string[] = []; // 🔹 No se reasigna, así que debe ser `const`
    const palletsDistribuidos: string[] = []; // 🔹 No se reasigna, así que debe ser `const`

    // 🔹 Ordenamos los pallets del lote por cantidad de cajas (de mayor a menor)
    pallets.sort((a, b) => b.cantidad - a.cantidad);
    
    // 🔹 Unificamos pallets pequeños antes de añadir nuevos pallets
    const palletsAReagrupar = pallets.filter((p) => p.cantidad < palletOption); // 🔹 No se reasigna, así que debe ser `const`

    if (palletsAReagrupar.length > 1) {
      const basePallet = palletsAReagrupar[0]; // 🔹 No se reasigna, así que debe ser `const`
      let cajasRestantes = basePallet.cantidad; // 🔹 Esta sí cambia, por lo que usamos `let`

      palletsAReagrupar.slice(1).forEach((p) => {
        if (cajasRestantes + p.cantidad <= palletOption) {
          cajasRestantes += p.cantidad;
          cajasMovidas += p.cantidad;
          palletsVaciados.push(`P${p.pallet}`); // 🔹 Este pallet se vació
        }
      });

      // Se reagrupa en el primer pallet
      palletsDistribuidos.push(`P${basePallet.pallet} → ${cajasRestantes} (Reagrupado)`);
      totalCajas -= cajasMovidas;
    }

    // 🔹 Distribución en pallets completos
    while (totalCajas >= palletOption) {
      extraPallets++;
      totalCajas -= palletOption;
      palletsDistribuidos.push(`Extra → ${palletOption}`);
    }

    // 🔹 Si quedan cajas sueltas, se registran como pallet incompleto
    if (totalCajas > 0) {
      palletsDistribuidos.push(`Pallet incompleto → ${totalCajas}`);
    }

    optimizedPallets.push({
      lote,
      pallets: palletsDistribuidos,
      extraPallets,
      cajasMovidas,
      palletsVaciados,
    });
  });

  return optimizedPallets;
};
