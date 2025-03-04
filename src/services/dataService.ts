/**
 * 📌 FUNCIÓN `calcularCajasPorLote`
 * Calcula cuántas cajas hay en cada lote, dividiendo las unidades por la cantidad por caja.
 * 
 * @param totalUnidades - Número total de unidades.
 * @param unidadesPorCaja - Cantidad de unidades por caja.
 * @returns Número total de cajas.
 */
export const calcularCajasPorLote = (totalUnidades: number, unidadesPorCaja: number): number => {
    return Math.floor(totalUnidades / unidadesPorCaja); // 🔥 Asegura que siempre sea un número entero.
  };
  