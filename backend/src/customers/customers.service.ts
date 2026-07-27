import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    const phone = dto.phone.trim();
    const email = dto.email?.trim().toLowerCase();

    const duplicated = await this.prisma.customer.findFirst({
      where: {
        OR: [{ phone }, ...(email ? [{ email }] : [])],
      },
    });

    if (duplicated) {
      throw new ConflictException('Số điện thoại hoặc email đã tồn tại');
    }

    return this.prisma.customer.create({
      data: {
        fullName: dto.fullName.trim(),
        phone,
        email,
        address: dto.address?.trim(),
      },
    });
  }

  async findAll(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? {
            OR: [
              {
                fullName: {
                  contains: search,
                },
              },
              {
                phone: {
                  contains: search,
                },
              },
              {
                email: {
                  contains: search,
                },
              },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    return customer;
  }

  async update(id: number, dto: UpdateCustomerDto) {
    await this.findOne(id);

    const phone = dto.phone?.trim();
    const email = dto.email?.trim().toLowerCase();

    if (phone || email) {
      const duplicated = await this.prisma.customer.findFirst({
        where: {
          NOT: { id },
          OR: [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])],
        },
      });

      if (duplicated) {
        throw new ConflictException('Số điện thoại hoặc email đã tồn tại');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        fullName: dto.fullName?.trim(),
        phone,
        email,
        address: dto.address?.trim(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const bookingCount = await this.prisma.booking.count({
      where: {
        customerId: id,
      },
    });

    if (bookingCount > 0) {
      throw new ConflictException(
        'Khách hàng đã có đơn đặt sân nên không thể xóa',
      );
    }

    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
