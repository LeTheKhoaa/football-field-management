import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const transactionMock = {
    payment: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    booking: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const prismaMock = {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('ném NotFoundException khi không tìm thấy đơn đặt sân', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          bookingId: 999,
          amount: 100000,
          method: PaymentMethod.CASH,
        }),
      ).rejects.toThrow(new NotFoundException('Không tìm thấy đơn đặt sân'));

      expect(prismaMock.booking.findUnique).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
        include: {
          payments: true,
        },
      });

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('ném BadRequestException khi đơn đặt sân đã bị hủy', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 1,
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.UNPAID,
        totalAmount: new Prisma.Decimal(500000),
        payments: [],
      });

      await expect(
        service.create({
          bookingId: 1,
          amount: 100000,
          method: PaymentMethod.CASH,
        }),
      ).rejects.toThrow(
        new BadRequestException('Không thể thanh toán cho đơn đã hủy'),
      );

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('ném ConflictException khi đơn đã được thanh toán đủ', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 2,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: new Prisma.Decimal(500000),
        payments: [
          {
            amount: new Prisma.Decimal(500000),
          },
        ],
      });

      await expect(
        service.create({
          bookingId: 2,
          amount: 100000,
          method: PaymentMethod.CASH,
        }),
      ).rejects.toThrow(
        new ConflictException('Đơn đặt sân đã được thanh toán đủ'),
      );

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('ném BadRequestException khi số tiền vượt quá số tiền còn lại', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 3,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PARTIALLY_PAID,
        totalAmount: new Prisma.Decimal(500000),
        payments: [
          {
            amount: new Prisma.Decimal(200000),
          },
        ],
      });

      await expect(
        service.create({
          bookingId: 3,
          amount: 400000,
          method: PaymentMethod.BANK_TRANSFER,
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'Số tiền thanh toán vượt quá số tiền còn lại: 300000 đồng',
        ),
      );

      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('tạo thanh toán một phần và cập nhật trạng thái PARTIALLY_PAID', async () => {
      const createdPayment = {
        id: 1,
        bookingId: 4,
        amount: new Prisma.Decimal(200000),
        method: PaymentMethod.CASH,
        transactionCode: null,
        note: 'Thanh toán tiền cọc',
      };

      prismaMock.booking.findUnique.mockResolvedValue({
        id: 4,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.UNPAID,
        totalAmount: new Prisma.Decimal(500000),
        payments: [],
      });

      transactionMock.payment.create.mockResolvedValue(createdPayment);
      transactionMock.booking.update.mockResolvedValue({
        id: 4,
        paymentStatus: PaymentStatus.PARTIALLY_PAID,
      });

      prismaMock.$transaction.mockImplementation(
        async (
          callback: (transaction: typeof transactionMock) => Promise<unknown>,
        ) => callback(transactionMock),
      );

      const result = await service.create({
        bookingId: 4,
        amount: 200000,
        method: PaymentMethod.CASH,
        note: '  Thanh toán tiền cọc  ',
      });

      expect(result).toEqual(createdPayment);

      expect(transactionMock.payment.create).toHaveBeenCalledWith({
        data: {
          bookingId: 4,
          amount: new Prisma.Decimal(200000),
          method: PaymentMethod.CASH,
          transactionCode: undefined,
          note: 'Thanh toán tiền cọc',
        },
        include: {
          booking: {
            include: {
              customer: true,
            },
          },
        },
      });

      expect(transactionMock.booking.update).toHaveBeenCalledWith({
        where: {
          id: 4,
        },
        data: {
          paymentStatus: PaymentStatus.PARTIALLY_PAID,
        },
      });
    });

    it('tạo thanh toán đủ và cập nhật trạng thái PAID', async () => {
      const createdPayment = {
        id: 2,
        bookingId: 5,
        amount: new Prisma.Decimal(300000),
        method: PaymentMethod.BANK_TRANSFER,
        transactionCode: 'FT20260728001',
        note: 'Thanh toán phần còn lại',
      };

      prismaMock.booking.findUnique.mockResolvedValue({
        id: 5,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PARTIALLY_PAID,
        totalAmount: new Prisma.Decimal(500000),
        payments: [
          {
            amount: new Prisma.Decimal(200000),
          },
        ],
      });

      transactionMock.payment.create.mockResolvedValue(createdPayment);
      transactionMock.booking.update.mockResolvedValue({
        id: 5,
        paymentStatus: PaymentStatus.PAID,
      });

      prismaMock.$transaction.mockImplementation(
        async (
          callback: (transaction: typeof transactionMock) => Promise<unknown>,
        ) => callback(transactionMock),
      );

      const result = await service.create({
        bookingId: 5,
        amount: 300000,
        method: PaymentMethod.BANK_TRANSFER,
        transactionCode: '  FT20260728001  ',
        note: '  Thanh toán phần còn lại  ',
      });

      expect(result).toEqual(createdPayment);

      expect(transactionMock.payment.create).toHaveBeenCalledWith({
        data: {
          bookingId: 5,
          amount: new Prisma.Decimal(300000),
          method: PaymentMethod.BANK_TRANSFER,
          transactionCode: 'FT20260728001',
          note: 'Thanh toán phần còn lại',
        },
        include: {
          booking: {
            include: {
              customer: true,
            },
          },
        },
      });

      expect(transactionMock.booking.update).toHaveBeenCalledWith({
        where: {
          id: 5,
        },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });
    });
  });

  describe('findOne', () => {
    it('trả về giao dịch thanh toán khi tìm thấy dữ liệu', async () => {
      const payment = {
        id: 10,
        bookingId: 5,
        amount: new Prisma.Decimal(300000),
        method: PaymentMethod.CASH,
        booking: {
          id: 5,
          customer: {
            id: 1,
            fullName: 'Nguyễn Văn An',
          },
          items: [],
        },
      };

      prismaMock.payment.findUnique.mockResolvedValue(payment);

      const result = await service.findOne(10);

      expect(result).toEqual(payment);

      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: {
          id: 10,
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
    });

    it('ném NotFoundException khi không tìm thấy giao dịch thanh toán', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Không tìm thấy giao dịch thanh toán'),
      );

      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: {
          id: 999,
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
    });
  });

  describe('remove', () => {
    it('xóa giao dịch và cập nhật trạng thái đơn thành UNPAID', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 20,
        bookingId: 8,
        amount: new Prisma.Decimal(100000),
      } as never);

      transactionMock.payment.delete.mockResolvedValue({
        id: 20,
      });

      transactionMock.payment.findMany.mockResolvedValue([]);

      transactionMock.booking.findUnique.mockResolvedValue({
        id: 8,
        totalAmount: new Prisma.Decimal(500000),
      });

      transactionMock.booking.update.mockResolvedValue({
        id: 8,
        paymentStatus: PaymentStatus.UNPAID,
      });

      prismaMock.$transaction.mockImplementation(
        async (
          callback: (transaction: typeof transactionMock) => Promise<unknown>,
        ) => callback(transactionMock),
      );

      const result = await service.remove(20);

      expect(result).toEqual({
        message: 'Xóa giao dịch thanh toán thành công',
      });

      expect(transactionMock.payment.delete).toHaveBeenCalledWith({
        where: {
          id: 20,
        },
      });

      expect(transactionMock.payment.findMany).toHaveBeenCalledWith({
        where: {
          bookingId: 8,
        },
      });

      expect(transactionMock.booking.update).toHaveBeenCalledWith({
        where: {
          id: 8,
        },
        data: {
          paymentStatus: PaymentStatus.UNPAID,
        },
      });
    });

    it('ném NotFoundException khi không tìm thấy đơn sau khi xóa giao dịch', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 21,
        bookingId: 9,
        amount: new Prisma.Decimal(100000),
      } as never);

      transactionMock.payment.delete.mockResolvedValue({
        id: 21,
      });

      transactionMock.payment.findMany.mockResolvedValue([]);

      transactionMock.booking.findUnique.mockResolvedValue(null);

      prismaMock.$transaction.mockImplementation(
        async (
          callback: (transaction: typeof transactionMock) => Promise<unknown>,
        ) => callback(transactionMock),
      );

      await expect(service.remove(21)).rejects.toThrow(
        new NotFoundException('Không tìm thấy đơn đặt sân'),
      );

      expect(transactionMock.booking.update).not.toHaveBeenCalled();
    });
  });
});