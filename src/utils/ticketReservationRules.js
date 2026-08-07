export const MAX_TICKET_QUANTITY = 10;

export function getTicketReservationMaxQuantity(windowItem) {
  if (!windowItem || Number(windowItem.capacity) <= 0) return MAX_TICKET_QUANTITY;

  const remainingQuantity = Number(windowItem.remaining_quantity);
  if (!Number.isFinite(remainingQuantity)) return 0;

  return Math.min(MAX_TICKET_QUANTITY, Math.max(0, Math.floor(remainingQuantity)));
}
