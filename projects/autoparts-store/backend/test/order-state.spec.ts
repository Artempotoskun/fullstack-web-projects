import { OrderStatus } from '@prisma/client';
import { canTransitionOrder } from '../src/modules/orders/order-state';

describe('order state machine', () => {
  it('allows the fulfilment happy path', () => {
    expect(canTransitionOrder(OrderStatus.CONFIRMED, OrderStatus.PROCESSING)).toBe(true);
    expect(canTransitionOrder(OrderStatus.PROCESSING, OrderStatus.SHIPPED)).toBe(true);
    expect(canTransitionOrder(OrderStatus.SHIPPED, OrderStatus.DELIVERED)).toBe(true);
  });

  it('prevents reopening terminal orders', () => {
    expect(canTransitionOrder(OrderStatus.DELIVERED, OrderStatus.PROCESSING)).toBe(false);
    expect(canTransitionOrder(OrderStatus.CANCELLED, OrderStatus.CONFIRMED)).toBe(false);
  });
});
