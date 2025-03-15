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
    // 🔥 Caso 2: Pallet con múltiples lotes → Se debe reorganizar primero
    if (items.length > 1) {
      items.sort((a, b) => (b.cantidadCajas ?? 0) - (a.cantidadCajas ?? 0));

      // 📌 El lote con más cajas **mantiene** el pallet original (si no excede `palletLimit`)
      const lotePrincipal = items[0];
      const loteEntry = lotesFinalPrevio.find((entry) => entry.lote === lotePrincipal.lote);

      if (loteEntry && lotePrincipal.cantidadCajas) {
        let cajasRestantes = lotePrincipal.cantidadCajas;

        while (cajasRestantes > 0) {
          const cajasEnPallet = Math.min(cajasRestantes, palletLimit);
          const newPallet = cajasRestantes === lotePrincipal.cantidadCajas ? `P${palletNumber}` : `PE${nextPalletNumber}`;

          loteEntry.pallets.push({ pallet: newPallet, cantidad: cajasEnPallet });

          if (cajasRestantes !== lotePrincipal.cantidadCajas) {
            palletsTracking.push({ pallet: newPallet, detalle: [`P${palletNumber} → ${cajasEnPallet}`] });
            totalExtraPallets++;
            totalCajasMovidas += cajasEnPallet;
            nextPalletNumber++;
          }

          cajasRestantes -= cajasEnPallet;
        }
      }

      // 🔄 Redistribuir los otros lotes en el pallet
      for (let i = 1; i < items.length; i++) {
        const { lote, cantidadCajas } = items[i];
        const loteEntry = lotesFinalPrevio.find((entry) => entry.lote === lote);
        if (!loteEntry || cantidadCajas === undefined) continue;

        let reubicado = false;

        // 📌 PASO 1: Intentar reutilizar un pallet ya existente (`P` o `PE`)
        let palletReutilizado: { pallet: string; cantidad: number } | null = null;

        // 🔹 **Buscar espacio en los `P` originales primero**
        for (const p of loteEntry.pallets) {
          if (!p.pallet.startsWith("PE") && p.cantidad + cantidadCajas <= palletLimit) {
            palletReutilizado = p;
            break;
          }
        }

        // 🔹 **Si no hay espacio en `P`, buscar en `PE` existentes**
        if (!palletReutilizado) {
          for (const p of loteEntry.pallets) {
            if (p.pallet.startsWith("PE") && p.cantidad + cantidadCajas <= palletLimit) {
              palletReutilizado = p;
              break;
            }
          }
        }

        // 📌 PASO 1.3: Si encontramos un pallet con espacio, movemos las cajas allí
        if (palletReutilizado) {
          palletReutilizado.cantidad += cantidadCajas;

          // 🔥 Guardar tracking del movimiento
          const existingTracking = palletsTracking.find(entry => entry.pallet === palletReutilizado!.pallet);
          if (existingTracking) {
            existingTracking.detalle.push(`P${palletNumber} → ${cantidadCajas}`);
          } else {
            palletsTracking.push({ pallet: palletReutilizado!.pallet, detalle: [`P${palletNumber} → ${cantidadCajas}`] });
          }

          totalCajasMovidas += cantidadCajas;
          reubicado = true;
        }

        // 📌 PASO 2: Si no encontramos un pallet con espacio suficiente, **creamos un nuevo `PE`**
        if (!reubicado) {
          const newPallet = `PE${nextPalletNumber}`;
          loteEntry.pallets.push({ pallet: newPallet, cantidad: cantidadCajas });

          palletsTracking.push({ pallet: newPallet, detalle: [`P${palletNumber} → ${cantidadCajas}`] });

          nextPalletNumber++;
          totalExtraPallets++;
          totalCajasMovidas += cantidadCajas;
        }
      }
    }

    // 🔹 Caso 1: Pallet con un solo lote → Se asigna directamente pero se verifica si excede `palletLimit`
    else {
      const { lote, cantidadCajas } = items[0];
      const loteEntry = lotesFinalPrevio.find((entry) => entry.lote === lote);

      if (loteEntry && cantidadCajas) {
        if (cantidadCajas > palletLimit) {
          // 🔥 Si el pallet excede el límite, se divide en varios pallets
          let cajasRestantes = cantidadCajas;

          while (cajasRestantes > 0) {
            const cajasEnPallet = Math.min(cajasRestantes, palletLimit);

            // 🔹 **Intentar colocar en `P` o `PE` existentes en vez de crear `PE` nuevo**
            let palletReutilizado: { pallet: string; cantidad: number } | null = null;

            // 🔸 **Buscar en `P` normales primero**
            for (const p of loteEntry.pallets) {
              if (!p.pallet.startsWith("PE") && p.cantidad + cajasEnPallet <= palletLimit) {
                palletReutilizado = p;
                break;
              }
            }

            // 🔸 **Si no hay espacio en `P`, buscar en `PE` existentes**
            if (!palletReutilizado) {
              for (const p of loteEntry.pallets) {
                if (p.pallet.startsWith("PE") && p.cantidad + cajasEnPallet <= palletLimit) {
                  palletReutilizado = p;
                  break;
                }
              }
            }

            // 🔹 **Si encontramos un pallet con espacio, lo usamos**
            if (palletReutilizado) {
              palletReutilizado.cantidad += cajasEnPallet;

              // 🔥 Guardamos el tracking del movimiento
              const existingTracking = palletsTracking.find(entry => entry.pallet === palletReutilizado!.pallet);
              if (existingTracking) {
                existingTracking.detalle.push(`P${palletNumber} → ${cajasEnPallet}`);
              } else {
                palletsTracking.push({ pallet: palletReutilizado!.pallet, detalle: [`P${palletNumber} → ${cajasEnPallet}`] });
              }

              totalCajasMovidas += cajasEnPallet;
            } else {
              // ✅ **Si no hay espacio, creamos un nuevo `PE`**
              const newPallet = cajasRestantes === cantidadCajas ? `P${palletNumber}` : `PE${nextPalletNumber}`;
              loteEntry.pallets.push({ pallet: newPallet, cantidad: cajasEnPallet });

              if (cajasRestantes !== cantidadCajas) {
                palletsTracking.push({ pallet: newPallet, detalle: [`P${palletNumber} → ${cajasEnPallet}`] });
                totalExtraPallets++;
                totalCajasMovidas += cajasEnPallet;
                nextPalletNumber++;
              }
            }

            cajasRestantes -= cajasEnPallet;
          }
        } else {
          // ✅ No excede el límite, se asigna normalmente
          loteEntry.pallets.push({ pallet: `P${palletNumber}`, cantidad: cantidadCajas });
        }
      }
    }
  });

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
