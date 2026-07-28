import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus } from '@prisma/client';
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

  beforeEach(async () => {
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

    jest.clearAllMocks();
  });

  describe('create', () => {
  it('ném NotFoundException khi khách hàng không tồn tại', async () => {
    const dto = {
      customerId: 999,
      depositAmount: 100000,
      note: 'Đặt sân thử nghiệm',
      items: [
        {
          fieldId: 1,
          timeSlotId: 1,
          playDate: '2026-08-01',
        },
      ],
    };

    prismaMock.customer.findUnique.mockResolvedValue(null);

    await expect(service.create(dto as never)).rejects.toThrow(
      new NotFoundException('Khách hàng không tồn tại'),
    );

    expect(prismaMock.customer.findUnique).toHaveBeenCalledWith({
      where: {
        id: 999,
      },
    });

    expect(prismaMock.field.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('ném BadRequestException khi danh sách có mục đặt sân bị trùng', async () => {
    const dto = {
      customerId: 1,
      depositAmount: 100000,
      note: 'Đặt sân bị trùng',
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

    prismaMock.customer.findUnique.mockResolvedValue({
      id: 1,
      fullName: 'Nguyễn Văn An',
    });

    await expect(service.create(dto as never)).rejects.toThrow(
      new BadRequestException(
        'Danh sách có sân, khung giờ và ngày đá bị trùng',
      ),
    );

    expect(prismaMock.customer.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(prismaMock.field.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

  describe('findOne', () => {
    it('trả về đơn đặt sân khi tìm thấy dữ liệu', async () => {
      const booking = {
        id: 1,
        bookingCode: 'BK202607280001',
        customerId: 1,
        status: BookingStatus.PENDING,
        totalAmount: 500000,
        depositAmount: 100000,
        customer: {
          id: 1,
          fullName: 'Nguyễn Văn An',
        },
        items: [],
        payments: [],
      };

      prismaMock.booking.findUnique.mockResolvedValue(booking);

      const result = await service.findOne(1);

      expect(result).toEqual(booking);

      expect(prismaMock.booking.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
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
    });

    it('ném NotFoundException khi không tìm thấy đơn đặt sân', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Không tìm thấy đơn đặt sân'),
      );

      expect(prismaMock.booking.findUnique).toHaveBeenCalledWith({
        where: {
          id: 999,
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
      ).rejects.toThrow(new BadRequestException('Đơn đặt sân đã bị hủy'));

      expect(prismaMock.booking.update).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
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

      expect(prismaMock.booking.update).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('cập nhật trạng thái thông thường thành công', async () => {
      const updatedBooking = {
        id: 3,
        bookingCode: 'BK202607280003',
        status: BookingStatus.COMPLETED,
        items: [],
        payments: [],
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

      expect(prismaMock.booking.update).toHaveBeenCalledWith({
        where: {
          id: 3,
        },
        data: {
          status: BookingStatus.COMPLETED,
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

    it('xóa chi tiết đặt sân khi hủy đơn', async () => {
      const cancelledBooking = {
        id: 4,
        bookingCode: 'BK202607280004',
        status: BookingStatus.CANCELLED,
        items: [],
        payments: [],
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

      expect(transactionMock.booking.update).toHaveBeenCalledWith({
        where: {
          id: 4,
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
  });

  describe('remove', () => {
    it('ném ConflictException khi đơn đã có thanh toán', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 5,
        status: BookingStatus.PENDING,
        payments: [
          {
            id: 1,
            amount: 100000,
          },
        ],
      } as never);

      await expect(service.remove(5)).rejects.toThrow(
        new ConflictException(
          'Đơn đã có giao dịch thanh toán nên không thể xóa',
        ),
      );

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('xóa chi tiết và đơn đặt sân khi chưa có thanh toán', async () => {
      const deletedBooking = {
        id: 6,
        bookingCode: 'BK202607280006',
        status: BookingStatus.PENDING,
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

      expect(transactionMock.bookingItem.deleteMany).toHaveBeenCalledWith({
        where: {
          bookingId: 6,
        },
      });

      expect(transactionMock.booking.delete).toHaveBeenCalledWith({
        where: {
          id: 6,
        },
      });
    });
  });
});