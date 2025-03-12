export const EXCEL_COLUMNS = {
  lote: ['CODLOT'], // Identifica el producto
  cantidad: ['CANTHOST'], // Total de unidades recibidas
  unidadCaja: ['UNIEMB'], // Unidades por caja para calcular las cajas totales
};

export const PACKING_LIST_COLUMNS = {
  pallet: ['CRT No'], // Número de pallet
  lote: ['Batch Number'], // Lote asignado a ese pallet
  cantidad: ['Qty'], // Unidades en ese pallet
};
