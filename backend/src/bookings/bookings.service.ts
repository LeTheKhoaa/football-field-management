import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, FieldStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: dto.customerId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Khách hàng không tồn tại');
    }

    const uniqueItems = new Set(
      dto.items.map(
        (item) => `${item.fieldId}-${item.timeSlotId}-${item.playDate}`,
      ),
    );

    if (uniqueItems.size !== dto.items.length) {
      throw new BadRequestException(
        'Danh sách có sân, khung giờ và ngày đá bị trùng',
      );
    }

    const preparedItems: Array<{
      fieldId: number;
      timeSlotId: number;
      playDate: Date;
      unitPrice: Prisma.Decimal;
    }> = [];

    for (const item of dto.items) {
      const playDate = this.normalizeDate(item.playDate);

      const field = await this.prisma.field.findUnique({
        where: {
          id: item.fieldId,
        },
      });

      if (!field) {
        throw new NotFoundException(`Không tìm thấy sân có mã ${item.fieldId}`);
      }

      if (field.status !== FieldStatus.ACTIVE) {
        throw new BadRequestException(`Sân ${field.name} hiện không hoạt động`);
      }

      const timeSlot = await this.prisma.timeSlot.findUnique({
        where: {
          id: item.timeSlotId,
        },
      });

      if (!timeSlot) {
        throw new NotFoundException(
          `Không tìm thấy khung giờ có mã ${item.timeSlotId}`,
        );
      }

      if (!timeSlot.isActive) {
        throw new BadRequestException(
          `Khung giờ ${timeSlot.name} hiện không hoạt động`,
        );
      }

      const fieldPrice = await this.prisma.fieldPrice.findUnique({
        where: {
          fieldId_timeSlotId: {
            fieldId: item.fieldId,
            timeSlotId: item.timeSlotId,
          },
        },
      });

      if (!fieldPrice) {
        throw new NotFoundException(
          `Sân ${field.name} chưa có giá cho khung giờ ${timeSlot.name}`,
        );
      }

      const duplicatedBooking = await this.prisma.bookingItem.findUnique({
        where: {
          fieldId_timeSlotId_playDate: {
            fieldId: item.fieldId,
            timeSlotId: item.timeSlotId,
            playDate,
          },
        },
        include: {
          booking: true,
        },
      });

      if (
        duplicatedBooking &&
        duplicatedBooking.booking.status !== BookingStatus.CANCELLED
      ) {
        throw new ConflictException(
          `Sân ${field.name} đã được đặt vào ngày ${item.playDate}, khung giờ ${timeSlot.name}`,
        );
      }

      /*
       * Schema hiện tại đặt unique trực tiếp trên BookingItem.
       * Booking bị CANCELLED vẫn giữ BookingItem nên database vẫn chặn
       * tạo lại cùng sân, khung giờ và ngày.
       *
       * Để bước đầu chạy ổn định, khi hủy booking ở hàm updateStatus
       * chúng ta sẽ xóa các BookingItem của booking bị hủy.
       */

      preparedItems.push({
        fieldId: item.fieldId,
        timeSlotId: item.timeSlotId,
        playDate,
        unitPrice: fieldPrice.price,
      });
    }

    const totalAmount = preparedItems.reduce(
      (total, item) => total.plus(item.unitPrice),
      new Prisma.Decimal(0),
    );

    const depositAmount = new Prisma.Decimal(dto.depositAmount ?? 0);

    if (depositAmount.greaterThan(totalAmount)) {
      throw new BadRequestException('Tiền cọc không được lớn hơn tổng tiền');
    }

    const bookingCode = await this.generateBookingCode();

    return this.prisma.$transaction(async (tx) => {
      return tx.booking.create({
        data: {
          bookingCode,
          customerId: dto.customerId,
          totalAmount,
          depositAmount,
          note: dto.note?.trim(),
          items: {
            create: preparedItems,
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              field: true,
              timeSlot: true,
            },
          },
          payments: true,
        },
      });
    });
  }

  async findAll(
    status?: BookingStatus,
    customerId?: number,
    playDate?: string,
  ) {
    const normalizedPlayDate = playDate
      ? this.normalizeDate(playDate)
      : undefined;

    return this.prisma.booking.findMany({
      where: {
        status,
        customerId,
        items: normalizedPlayDate
          ? {
              some: {
                playDate: normalizedPlayDate,
              },
            }
          : undefined,
      },
      include: {
        customer: true,
        items: {
          include: {
            field: true,
            timeSlot: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
        items: {
          include: {
            field: {
              include: {
                fieldType: true,
              },
            },
            timeSlot: true,
          },
        },
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy đơn đặt sân');
    }

    return booking;
  }

  async updateStatus(id: number, dto: UpdateBookingStatusDto) {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Đơn đặt sân đã bị hủy');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'Đơn đặt sân đã hoàn thành nên không thể đổi trạng thái',
      );
    }

    if (dto.status === BookingStatus.CANCELLED) {
      return this.prisma.$transaction(async (tx) => {
        await tx.bookingItem.deleteMany({
          where: {
            bookingId: id,
          },
        });

        return tx.booking.update({
          where: {
            id,
          },
          data: {
            status: BookingStatus.CANCELLED,
          },
          include: {
            customer: true,
            items: {
              include: {
                field: true,
                timeSlot: true,
              },
            },
            payments: true,
          },
        });
      });
    }

    return this.prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: dto.status,
      },
      include: {
        customer: true,
        items: {
          include: {
            field: true,
            timeSlot: true,
          },
        },
        payments: true,
      },
    });
  }

  async remove(id: number) {
    const booking = await this.findOne(id);

    if (booking.payments.length > 0) {
      throw new ConflictException(
        'Đơn đã có giao dịch thanh toán nên không thể xóa',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.bookingItem.deleteMany({
        where: {
          bookingId: id,
        },
      });

      return tx.booking.delete({
        where: {
          id,
        },
      });
    });
  }

  private normalizeDate(dateString: string) {
    const date = new Date(`${dateString}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Ngày đá không hợp lệ');
    }

    return date;
  }

  private async generateBookingCode() {
    const now = new Date();

    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const prefix = `BK${year}${month}${day}`;

    const count = await this.prisma.booking.count({
      where: {
        bookingCode: {
          startsWith: prefix,
        },
      },
    });

    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
}
