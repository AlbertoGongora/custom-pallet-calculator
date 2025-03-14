import { PackingListData } from "../features/processing/packingListProcessor";
import { ProcessedData } from "../features/processing/excelProcessor";
import { normalizePackingListData } from "./normalizePackingListData";

export interface OptimizedPallet {
  lote: string;
  pallets: string[];
  extraPallets: number;
  cajasMovidas: number;
}

/**
 * 🔥 Optimiza los pallets, agrupando correctamente y generando extras si es necesario.
 */
export const optimizePallets = (
  packingListData: PackingListData[],
  excelData: ProcessedData[],
  palletLimit: number // 🔥 Condición del selector inicial
): OptimizedPallet[] => {
  let totalExtraPallets = 0;
  let totalCajasMovidas = 0;
  const palletsTracking: { pallet: string; detalle: string[] }[] = [];

  // 🔥 Normalizar los datos antes de procesarlos
  packingListData = normalizePackingListData(packingListData, excelData);
  console.log("📌 Datos normalizados:", packingListData);

  // 📌 Detectar el número más alto de pallet
  const maxPalletNumber = Math.max(...packingListData.map(p => Number(p.pallet)).filter(n => !isNaN(n)), 0);
  let nextPalletNumber = maxPalletNumber + 1;

  // 📌 Mapa de lotes basado en el Excel Base
  const lotesFinalPrevio = excelData.map(({ lote, cajasTotales }) => ({
    lote,
    totalCajas: cajasTotales,
    pallets: [] as { pallet: string; cantidad: number }[],
  }));

  // 📌 Agrupar los pallets del Packing List por su número de pallet
  const palletsAgrupados = new Map<number, PackingListData[]>();

  packingListData.forEach((item) => {
    if (!palletsAgrupados.has(item.pallet)) {
      palletsAgrupados.set(item.pallet, []);
    }
    palletsAgrupados.get(item.pallet)!.push(item);
  });

  // 📌 Procesar cada pallet
  palletsAgrupados.forEach((items, palletNumber) => {
    if (items.length === 1) {
      // 🔹 Caso 1: Pallet con un solo lote → Se asigna directamente
      const { lote, cantidadCajas } = items[0];
      const loteEntry = lotesFinalPrevio.find((entry) => entry.lote === lote);
      if (loteEntry) {
        loteEntry.pallets.push({ pallet: `P${palletNumber}`, cantidad: cantidadCajas ?? 0 });
      }
    } else {
      // 🔥 Caso 2: Pallet con múltiples lotes → Se debe reorganizar
      items.sort((a, b) => (b.cantidadCajas ?? 0) - (a.cantidadCajas ?? 0));

      // 📌 El lote con más cajas **mantiene** el pallet original
      const lotePrincipal = items[0];
      const loteEntry = lotesFinalPrevio.find((entry) => entry.lote === lotePrincipal.lote);
      if (loteEntry) {
        loteEntry.pallets.push({ pallet: `P${palletNumber}`, cantidad: lotePrincipal.cantidadCajas ?? 0 });
      }

      // 🔄 Redistribuir los otros lotes en el pallet
      for (let i = 1; i < items.length; i++) {
        const { lote, cantidadCajas } = items[i];
        const loteEntry = lotesFinalPrevio.find((entry) => entry.lote === lote);

        if (!loteEntry || cantidadCajas === undefined) continue;

        let reubicado = false;

        for (const p of loteEntry.pallets) {
          if (p.cantidad + cantidadCajas <= palletLimit) {
            p.cantidad += cantidadCajas;

            // 🔥 Guardar bien el movimiento de varios pallets si aplica
            const existingTracking = palletsTracking.find(entry => entry.pallet === p.pallet);
            if (existingTracking) {
              existingTracking.detalle.push(`P${palletNumber} → ${cantidadCajas}`);
            } else {
              palletsTracking.push({ pallet: p.pallet, detalle: [`P${palletNumber} → ${cantidadCajas}`] });
            }

            totalCajasMovidas += cantidadCajas;
            reubicado = true;
            break;
          }
        }

        // 🔥 Si no hay espacio, creamos un nuevo pallet
        if (!reubicado) {
          const newPallet = `PE${nextPalletNumber}`;
          loteEntry.pallets.push({ pallet: newPallet, cantidad: cantidadCajas });

          // 📌 Almacenamos múltiples movimientos en un solo pallet
          palletsTracking.push({ pallet: newPallet, detalle: [`P${palletNumber} → ${cantidadCajas}`] });

          nextPalletNumber++;
          totalExtraPallets++;
          totalCajasMovidas += cantidadCajas;
        }
      }
    }
  });

  console.log("📦 Pallets extra creados:", totalExtraPallets);
  console.log("📦 Cajas movidas:", totalCajasMovidas);
  console.log("📦 Tracking de pallets:", palletsTracking);

  // 📌 Validación final
  lotesFinalPrevio.forEach(({ lote, pallets, totalCajas }) => {
    const totalCajasDistribuidas = pallets.reduce((sum, { cantidad }) => sum + cantidad, 0);
    if (totalCajasDistribuidas !== totalCajas) {
      console.error(`❌ Error: Diferencia de cajas en el lote ${lote}. 
      Esperado: ${totalCajas}, Distribuido: ${totalCajasDistribuidas}`);
    } else {
      console.log(`✅ Lote ${lote} verificado correctamente: ${totalCajasDistribuidas} cajas.`);
    }
  });

  // 📌 Convertir los datos en el formato final para la tabla
  const optimizedResults: OptimizedPallet[] = lotesFinalPrevio.map(({ lote, pallets }) => ({
    lote,
    pallets: pallets.map(({ pallet, cantidad }) => {
      const trackingInfo = palletsTracking.find((entry) => entry.pallet === pallet);
      return trackingInfo
        ? `${pallet} → ${cantidad} (${trackingInfo.detalle.join(" + ")})`
        : `${pallet} → ${cantidad}`;
    }),
    extraPallets: totalExtraPallets,
    cajasMovidas: totalCajasMovidas,
  }));

  return optimizedResults;
};
