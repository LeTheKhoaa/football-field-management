import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BookingStatus,
  FieldStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let service: BookingsService;

  const transactionMock = {
    booking: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bookingItem: {
      deleteMany: jest.fn(),
    },
  };

  const prismaMock = {
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    bookingItem: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
    field: {
      findUnique: jest.fn(),
    },
    timeSlot: {
      findUnique: jest.fn(),
    },
    fieldPrice: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const validDto = {
    customerId: 1,
    depositAmount: 100000,
    note: '  Đặt sân buổi tối  ',
    items: [
      {
        fieldId: 1,
        timeSlotId: 2,
        playDate: '2026-08-01',
      },
    ],
  };

  const customer = {
    id: 1,
    fullName: 'Nguyễn Văn An',
    phone: '0900000001',
  };

  const activeField = {
    id: 1,
    code: 'S001',
    name: 'Sân số 1',
    status: FieldStatus.ACTIVE,
  };

  const activeTimeSlot = {
    id: 2,
    name: '18:00 - 20:00',
    startTime: '18:00',
    endTime: '20:00',
    isActive: true,
  };

  const fieldPrice = {
    id: 1,
    fieldId: 1,
    timeSlotId: 2,
    price: new Prisma.Decimal(500000),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('create', () => {
    it('ném NotFoundException khi khách hàng không tồn tại', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);

      await expect(service.create(validDto as never)).rejects.toThrow(
        new NotFoundException('Khách hàng không tồn tại'),
      );

      expect(prismaMock.field.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('ném BadRequestException khi danh sách đặt sân bị trùng', async () => {
      const duplicatedDto = {
        ...validDto,
        items: [
          {
            fieldId: 1,
            timeSlotId: 2,
            playDate: '2026-08-01',
          },
          {
            fieldId: 1,
            timeSlotId: 2,
            playDate: '2026-08-01',
          },
        ],
      };

      prismaMock.customer.findUnique.mockResolvedValue(customer);

      await expect(service.create(duplicatedDto as never)).rejects.toThrow(
        new BadRequestException(
          'Danh sách có sân, khung giờ và ngày đá bị trùng',
        ),
      );

      expect(prismaMock.field.findUnique).not.toHaveBeenCalled();
    });

    it('ném BadRequestException khi ngày đá không hợp lệ', async () => {
      const invalidDateDto = {
        ...validDto,
        items: [
          {
            fieldId: 1,
            timeSlotId: 2,
            playDate: 'ngay-khong-hop-le',
          },
        ],
      };

      prismaMock.customer.findUnique.mockResolvedValue(customer);

      await expect(service.create(invalidDateDto as never)).rejects.toThrow(
        new BadRequestException('Ngày đá không hợp lệ'),
      );
    });

    it('ném NotFoundException khi sân không tồn tại', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(customer);
      prismaMock.field.findUnique.mockResolvedValue(null);

      await expect(service.create(validDto as never)).rejects.toThrow(
        new NotFoundException('Không tìm thấy sân có mã 1'),
      );

      expect(prismaMock.timeSlot.findUnique).not.toHaveBeenCalled();
    });

    it('ném BadRequestException khi sân không hoạt động', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(customer);

      prismaMock.field.findUnique.mockResolvedValue({
        ...activeField,
        status: FieldStatus.MAINTENANCE,
      });

      await expect(service.create(validDto as never)).rejects.toThrow(
        new BadRequestException('Sân Sân số 1 hiện không hoạt động'),
      );

      expect(prismaMock.timeSlot.findUnique).not.toHaveBeenCalled();
    });

    it('ném NotFoundException khi khung giờ không tồn tại', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(customer);
      prismaMock.field.findUnique.mockResolvedValue(activeField);
      prismaMock.timeSlot.findUnique.mockResolvedValue(null);

      await expect(service.create(validDto as never)).rejects.toThrow(
        new NotFoundException('Không tìm thấy khung giờ có mã 2'),
      );

      expect(prismaMock.fieldPrice.findUnique).not.toHaveBeenCalled();
    });

    it('ném BadRequestException khi khung giờ không hoạt động', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(customer);
      prismaMock.field.findUnique.mockResolvedValue(activeField);

      prismaMock.timeSlot.findUnique.mockResolvedValue({
        ...activeTimeSlot,
        isActive: false,
      });

      await expect(service.create(validDto as never)).rejects.toThrow(
        new BadRequestException(
          'Khung giờ 18:00 - 20:00 hiện không hoạt động',
        ),
      );

      expect(prismaMock.fieldPrice.findUnique).not.toHaveBeenCalled();
    });

    it('ném NotFoundException khi sân chưa có giá', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(customer);
      prismaMock.field.findUnique.mockResolvedValue(activeField);
      prismaMock.timeSlot.findUnique.mockResolvedValue(activeTimeSlot);
      prismaMock.fieldPrice.findUnique.mockResolvedValue(null);

      await expect(service.create(validDto as never)).rejects.toThrow(
        new NotFoundException(
          'Sân Sân số 1 chưa có giá cho khung giờ 18:00 - 20:00',
        ),
      );

      expect(prismaMock.bookingItem.findUnique).not.toHaveBeenCalled();
    });

    it('ném ConflictException khi sân đã được đặt', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(customer);
      prismaMock.field.findUnique.mockResolvedValue(activeField);
      prismaMock.timeSlot.findUnique.mockResolvedValue(activeTimeSlot);
      prismaMock.fieldPrice.findUnique.mockResolvedValue(fieldPrice);

      prismaMock.bookingItem.findUnique.mockResolvedValue({
        id: 10,
        booking: {
          id: 5,
          status: BookingStatus.CONFIRMED,
        },
      });

      await expect(service.create(validDto as never)).rejects.toThrow(
        new ConflictException(
          'Sân Sân số 1 đã được đặt vào ngày 2026-08-01, khung giờ 18:00 - 20:00',
        ),
      );
    });

    it('ném BadRequestException khi tiền cọc lớn hơn tổng tiền', async () => {
      const invalidDepositDto = {
        ...validDto,
        depositAmount: 600000,
      };

      prismaMock.customer.findUnique.mockResolvedValue(customer);
      prismaMock.field.findUnique.mockResolvedValue(activeField);
      prismaMock.timeSlot.findUnique.mockResolvedValue(activeTimeSlot);
      prismaMock.fieldPrice.findUnique.mockResolvedValue(fieldPrice);
      prismaMock.bookingItem.findUnique.mockResolvedValue(null);

      await expect(service.create(invalidDepositDto as never)).rejects.toThrow(
        new BadRequestException('Tiền cọc không được lớn hơn tổng tiền'),
      );

      expect(prismaMock.booking.count).not.toHaveBeenCalled();
    });

    it('tạo đơn đặt sân thành công', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-07-28T10:00:00.000Z'));

      const createdBooking = {
        id: 1,
        bookingCode: 'BK202607280003',
        customerId: 1,
        status: BookingStatus.PENDING,
        items: [],
        payments: [],
      };

      prismaMock.customer.findUnique.mockResolvedValue(customer);
      prismaMock.field.findUnique.mockResolvedValue(activeField);
      prismaMock.timeSlot.findUnique.mockResolvedValue(activeTimeSlot);
      prismaMock.fieldPrice.findUnique.mockResolvedValue(fieldPrice);
      prismaMock.bookingItem.findUnique.mockResolvedValue(null);
      prismaMock.booking.count.mockResolvedValue(2);
      transactionMock.booking.create.mockResolvedValue(createdBooking);

      prismaMock.$transaction.mockImplementation(
        async (
          callback: (transaction: typeof transactionMock) => Promise<unknown>,
        ) => callback(transactionMock),
      );

      try {
        const result = await service.create(validDto as never);

        expect(result).toEqual(createdBooking);

        expect(prismaMock.booking.count).toHaveBeenCalledWith({
          where: {
            bookingCode: {
              startsWith: 'BK20260728',
            },
          },
        });

        expect(transactionMock.booking.create).toHaveBeenCalledTimes(1);

        const argument = transactionMock.booking.create.mock.calls[0][0];

        expect(argument.data.bookingCode).toBe('BK202607280003');
        expect(argument.data.customerId).toBe(1);
        expect(argument.data.note).toBe('Đặt sân buổi tối');
        expect(argument.data.totalAmount.toString()).toBe('500000');
        expect(argument.data.depositAmount.toString()).toBe('100000');
        expect(argument.data.items.create).toHaveLength(1);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('findAll', () => {
    it('trả về toàn bộ đơn khi không có bộ lọc', async () => {
      const bookings = [
        {
          id: 1,
          bookingCode: 'BK202607280001',
          status: BookingStatus.PENDING,
        },
      ];

      prismaMock.booking.findMany.mockResolvedValue(bookings);

      const result = await service.findAll();

      expect(result).toEqual(bookings);

      expect(prismaMock.booking.findMany).toHaveBeenCalledWith({
        where: {
          status: undefined,
          customerId: undefined,
          items: undefined,
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
    });

    it('lọc đơn theo trạng thái, khách hàng và ngày đá', async () => {
      const bookings = [
        {
          id: 2,
          status: BookingStatus.CONFIRMED,
          customerId: 5,
        },
      ];

      prismaMock.booking.findMany.mockResolvedValue(bookings);

      const result = await service.findAll(
        BookingStatus.CONFIRMED,
        5,
        '2026-08-01',
      );

      expect(result).toEqual(bookings);

      expect(prismaMock.booking.findMany).toHaveBeenCalledWith({
        where: {
          status: BookingStatus.CONFIRMED,
          customerId: 5,
          items: {
            some: {
              playDate: new Date('2026-08-01T00:00:00.000Z'),
            },
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
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('trả về đơn đặt sân khi tìm thấy dữ liệu', async () => {
      const booking = {
        id: 1,
        bookingCode: 'BK202607280001',
        customerId: 1,
        status: BookingStatus.PENDING,
        items: [],
        payments: [],
      };

      prismaMock.booking.findUnique.mockResolvedValue(booking);

      const result = await service.findOne(1);

      expect(result).toEqual(booking);
    });

    it('ném NotFoundException khi không tìm thấy đơn đặt sân', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Không tìm thấy đơn đặt sân'),
      );
    });
  });

  describe('updateStatus', () => {
    it('ném BadRequestException khi đơn đã bị hủy', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 1,
        status: BookingStatus.CANCELLED,
        payments: [],
      } as never);

      await expect(
        service.updateStatus(1, {
          status: BookingStatus.COMPLETED,
        }),
      ).rejects.toThrow(
        new BadRequestException('Đơn đặt sân đã bị hủy'),
      );
    });

    it('ném BadRequestException khi đơn đã hoàn thành', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 2,
        status: BookingStatus.COMPLETED,
        payments: [],
      } as never);

      await expect(
        service.updateStatus(2, {
          status: BookingStatus.CANCELLED,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'Đơn đặt sân đã hoàn thành nên không thể đổi trạng thái',
        ),
      );
    });

    it('cập nhật trạng thái thông thường thành công', async () => {
      const updatedBooking = {
        id: 3,
        status: BookingStatus.COMPLETED,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 3,
        status: BookingStatus.PENDING,
        payments: [],
      } as never);

      prismaMock.booking.update.mockResolvedValue(updatedBooking);

      const result = await service.updateStatus(3, {
        status: BookingStatus.COMPLETED,
      });

      expect(result).toEqual(updatedBooking);
    });

    it('xóa chi tiết đặt sân khi hủy đơn', async () => {
      const cancelledBooking = {
        id: 4,
        status: BookingStatus.CANCELLED,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 4,
        status: BookingStatus.PENDING,
        payments: [],
      } as never);

      transactionMock.bookingItem.deleteMany.mockResolvedValue({
        count: 1,
      });

      transactionMock.booking.update.mockResolvedValue(cancelledBooking);

      prismaMock.$transaction.mockImplementation(
        async (
          callback: (transaction: typeof transactionMock) => Promise<unknown>,
        ) => callback(transactionMock),
      );

      const result = await service.updateStatus(4, {
        status: BookingStatus.CANCELLED,
      });

      expect(result).toEqual(cancelledBooking);

      expect(transactionMock.bookingItem.deleteMany).toHaveBeenCalledWith({
        where: {
          bookingId: 4,
        },
      });
    });
  });

  describe('remove', () => {
    it('ném ConflictException khi đơn đã có thanh toán', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 5,
        status: BookingStatus.PENDING,
        payments: [
          {
            id: 1,
          },
        ],
      } as never);

      await expect(service.remove(5)).rejects.toThrow(
        new ConflictException(
          'Đơn đã có giao dịch thanh toán nên không thể xóa',
        ),
      );
    });

    it('xóa chi tiết và đơn đặt sân khi chưa có thanh toán', async () => {
      const deletedBooking = {
        id: 6,
        bookingCode: 'BK202607280006',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 6,
        status: BookingStatus.PENDING,
        payments: [],
      } as never);

      transactionMock.bookingItem.deleteMany.mockResolvedValue({
        count: 2,
      });

      transactionMock.booking.delete.mockResolvedValue(deletedBooking);

      prismaMock.$transaction.mockImplementation(
        async (
          callback: (transaction: typeof transactionMock) => Promise<unknown>,
        ) => callback(transactionMock),
      );

      const result = await service.remove(6);

      expect(result).toEqual(deletedBooking);

      expect(transactionMock.booking.delete).toHaveBeenCalledWith({
        where: {
          id: 6,
        },
      });
    });
  });
});