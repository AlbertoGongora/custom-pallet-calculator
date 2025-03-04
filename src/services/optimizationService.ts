import { PackingListData } from '../features/processing/packingListProcessor';

/**
 * 📌 INTERFAZ `OptimizedPallet`
 * Define la estructura de los pallets optimizados tras la redistribución.
 */
export interface OptimizedPallet {
  lote: string;
  pallets: string[]; // Lista de pallets con cantidades
  extraPallets: number; // Pallets adicionales generados
  cajasMovidas: number; // Cajas que fueron reubicadas
}

/**
 * 📌 FUNCIÓN `optimizePallets`
 * Reorganiza los pallets según la configuración seleccionada por el usuario.
 * 
 * @param packingListData - Datos procesados del Packing List.
 * @param palletOption - Cantidad de cajas por pallet (12 o 16).
 * @returns Array de pallets optimizados con su distribución.
 */
export const optimizePallets = (packingListData: PackingListData[], palletOption: number): OptimizedPallet[] => {
  const lotesMap = new Map<string, PackingListData[]>();

  // 📌 Agrupar pallets por lote
  packingListData.forEach((item) => {
    if (!lotesMap.has(item.lote)) {
      lotesMap.set(item.lote, []);
    }
    lotesMap.get(item.lote)?.push(item);
  });

  const optimizedPallets: OptimizedPallet[] = [];

  // 📌 Procesar cada lote de manera independiente
  lotesMap.forEach((pallets, lote) => {
    // 🔥 Convertimos unidades en Cajas
    const totalUnidades = pallets.reduce((sum, p) => sum + p.cantidad, 0);
    const totalCajas = Math.floor(totalUnidades / palletOption);

    let extraPallets = 0;
    let cajasMovidas = 0;
    const palletsDistribuidos: string[] = [];

    // 📌 Redistribuir si se cambia de 16 a 12
    if (palletOption === 12) {
      const palletsReconfigurados = Math.floor(totalCajas / palletOption);
      const cajasSobrantes = totalCajas % palletOption;

      if (cajasSobrantes > 0) {
        extraPallets = 1;
        cajasMovidas = cajasSobrantes;
      }

      for (let i = 1; i <= palletsReconfigurados; i++) {
        palletsDistribuidos.push(`P${i} → ${palletOption}`);
      }

      if (extraPallets > 0) {
        palletsDistribuidos.push(`Extra → ${cajasSobrantes}`);
      }
    } else {
      // Si el usuario sigue con 16, no redistribuye
      pallets.forEach((p, index) => {
        palletsDistribuidos.push(`P${index + 1} → ${p.cantidad}`);
      });
    }

    optimizedPallets.push({
      lote,
      pallets: palletsDistribuidos,
      extraPallets,
      cajasMovidas,
    });
  });

  return optimizedPallets;
};
