export interface PricedItem {
  price: number;
  discountPercent: number;
  quantity: number;
}

export function calculateLine(item: PricedItem) {
  const gross = round(item.price * item.quantity);
  const discount = round(gross * (item.discountPercent / 100));
  return { gross, discount, total: round(gross - discount) };
}

export function calculateCartTotals(items: PricedItem[]) {
  return items.reduce(
    (totals, item) => {
      const line = calculateLine(item);
      return {
        subtotal: round(totals.subtotal + line.gross),
        discount: round(totals.discount + line.discount),
        total: round(totals.total + line.total),
      };
    },
    { subtotal: 0, discount: 0, total: 0 },
  );
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
