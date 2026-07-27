import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: dto.bookingId,
      },
      include: {
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy đơn đặt sân');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Không thể thanh toán cho đơn đã hủy');
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictException('Đơn đặt sân đã được thanh toán đủ');
    }

    const paidAmount = booking.payments.reduce(
      (total, payment) => total.plus(payment.amount),
      new Prisma.Decimal(0),
    );

    const newAmount = new Prisma.Decimal(dto.amount);
    const newPaidTotal = paidAmount.plus(newAmount);

    if (newPaidTotal.greaterThan(booking.totalAmount)) {
      const remainingAmount = booking.totalAmount.minus(paidAmount);

      throw new BadRequestException(
        `Số tiền thanh toán vượt quá số tiền còn lại: ${remainingAmount.toString()} đồng`,
      );
    }

    let paymentStatus: PaymentStatus;

    if (newPaidTotal.equals(booking.totalAmount)) {
      paymentStatus = PaymentStatus.PAID;
    } else {
      paymentStatus = PaymentStatus.PARTIALLY_PAID;
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          bookingId: dto.bookingId,
          amount: newAmount,
          method: dto.method,
          transactionCode: dto.transactionCode?.trim(),
          note: dto.note?.trim(),
        },
        include: {
          booking: {
            include: {
              customer: true,
            },
          },
        },
      });

      await tx.booking.update({
        where: {
          id: dto.bookingId,
        },
        data: {
          paymentStatus,
        },
      });

      return payment;
    });
  }

  async findAll(bookingId?: number, method?: PaymentMethod) {
    return this.prisma.payment.findMany({
      where: {
        bookingId,
        method,
      },
      include: {
        booking: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        paidAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: {
        id,
      },
      include: {
        booking: {
          include: {
            customer: true,
            items: {
              include: {
                field: true,
                timeSlot: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    }

    return payment;
  }

  async remove(id: number) {
    const payment = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: {
          id,
        },
      });

      const remainingPayments = await tx.payment.findMany({
        where: {
          bookingId: payment.bookingId,
        },
      });

      const paidAmount = remainingPayments.reduce(
        (total, item) => total.plus(item.amount),
        new Prisma.Decimal(0),
      );

      const booking = await tx.booking.findUnique({
        where: {
          id: payment.bookingId,
        },
      });

      if (!booking) {
        throw new NotFoundException('Không tìm thấy đơn đặt sân');
      }

      let paymentStatus: PaymentStatus;

      if (paidAmount.equals(booking.totalAmount)) {
        paymentStatus = PaymentStatus.PAID;
      } else if (paidAmount.greaterThan(0)) {
        paymentStatus = PaymentStatus.PARTIALLY_PAID;
      } else {
        paymentStatus = PaymentStatus.UNPAID;
      }

      await tx.booking.update({
        where: {
          id: payment.bookingId,
        },
        data: {
          paymentStatus,
        },
      });

      return {
        message: 'Xóa giao dịch thanh toán thành công',
      };
    });
  }
}
