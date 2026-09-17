import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PaymentMethod } from './dto/order.dto';

@Injectable()
export class DemoPaymentService {
  authorize(method: PaymentMethod, amount: number) {
    if (amount <= 0) return { approved: false, reference: null };
    if (method === PaymentMethod.CASH_ON_DELIVERY) return { approved: true, reference: `cod_${randomUUID()}`, pending: true };
    return { approved: true, reference: `demo_${randomUUID()}`, pending: false };
  }
}
