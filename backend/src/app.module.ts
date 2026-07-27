import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { FieldTypesModule } from './field-types/field-types.module';
import { FieldsModule } from './fields/fields.module';
import { TimeSlotsModule } from './time-slots/time-slots.module';
import { FieldPricesModule } from './field-prices/field-prices.module';
import { CustomersModule } from './customers/customers.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    PrismaModule,
    FieldTypesModule,
    FieldsModule,
    TimeSlotsModule,
    FieldPricesModule,
    CustomersModule,
    BookingsModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
