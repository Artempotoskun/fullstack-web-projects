import { calculateCartTotals, calculateLine } from '../src/modules/cart/pricing';

describe('cart pricing', () => {
  it('calculates line discounts without floating point leakage', () => {
    expect(calculateLine({ price: 19.99, discountPercent: 15, quantity: 3 })).toEqual({
      gross: 59.97,
      discount: 9,
      total: 50.97,
    });
  });

  it('aggregates subtotal, discount and total on the server', () => {
    expect(calculateCartTotals([
      { price: 100, discountPercent: 10, quantity: 2 },
      { price: 25, discountPercent: 0, quantity: 1 },
    ])).toEqual({ subtotal: 225, discount: 20, total: 205 });
  });
});
