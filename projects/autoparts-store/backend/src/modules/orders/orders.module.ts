import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { DemoPaymentService } from './demo-payment.service';
import { OrdersService } from './orders.service';

@Module({ controllers: [OrdersController], providers: [OrdersService, DemoPaymentService], exports: [OrdersService] })
export class OrdersModule {}
