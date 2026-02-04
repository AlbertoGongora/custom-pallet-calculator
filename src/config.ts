// src/config.ts

export const EXCEL_COLUMNS = {
  lote: ['CODLOT'],           // Identifica el producto
  cantidad: ['CANTHOST'],     // Total de unidades recibidas
  unidadCaja: ['UNIEMB'],     // Unidades por caja
};

export const PACKING_LIST_COLUMNS = {
  pallet: ['CRT No'],         // Número de pallet
  lote: ['Batch Number'],     // Lote
  cantidad: ['Qty'],          // Unidades en ese pallet
};
