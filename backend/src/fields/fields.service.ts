import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FieldStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';

@Injectable()
export class FieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFieldDto) {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.prisma.field.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException('Mã sân đã tồn tại');
    }

    const fieldType = await this.prisma.fieldType.findUnique({
      where: { id: dto.fieldTypeId },
    });

    if (!fieldType) {
      throw new NotFoundException('Loại sân không tồn tại');
    }

    return this.prisma.field.create({
      data: {
        code,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        imageUrl: dto.imageUrl,
        status: dto.status ?? FieldStatus.ACTIVE,
        fieldTypeId: dto.fieldTypeId,
      },
      include: {
        fieldType: true,
      },
    });
  }

  async findAll(search?: string, fieldTypeId?: number, status?: FieldStatus) {
    return this.prisma.field.findMany({
      where: {
        fieldTypeId,
        status,
        OR: search
          ? [
              {
                code: {
                  contains: search,
                },
              },
              {
                name: {
                  contains: search,
                },
              },
            ]
          : undefined,
      },
      include: {
        fieldType: true,
        prices: {
          include: {
            timeSlot: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const field = await this.prisma.field.findUnique({
      where: { id },
      include: {
        fieldType: true,
        prices: {
          include: {
            timeSlot: true,
          },
        },
      },
    });

    if (!field) {
      throw new NotFoundException('Không tìm thấy sân bóng');
    }

    return field;
  }

  async update(id: number, dto: UpdateFieldDto) {
    await this.findOne(id);

    if (dto.fieldTypeId) {
      const fieldType = await this.prisma.fieldType.findUnique({
        where: { id: dto.fieldTypeId },
      });

      if (!fieldType) {
        throw new NotFoundException('Loại sân không tồn tại');
      }
    }

    if (dto.code) {
      const normalizedCode = dto.code.trim().toUpperCase();

      const duplicated = await this.prisma.field.findFirst({
        where: {
          code: normalizedCode,
          NOT: { id },
        },
      });

      if (duplicated) {
        throw new ConflictException('Mã sân đã tồn tại');
      }
    }

    return this.prisma.field.update({
      where: { id },
      data: {
        code: dto.code?.trim().toUpperCase(),
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        imageUrl: dto.imageUrl,
        status: dto.status,
        fieldTypeId: dto.fieldTypeId,
      },
      include: {
        fieldType: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const bookingCount = await this.prisma.bookingItem.count({
      where: { fieldId: id },
    });

    if (bookingCount > 0) {
      throw new ConflictException('Sân đã có lịch đặt nên không thể xóa');
    }

    const priceCount = await this.prisma.fieldPrice.count({
      where: { fieldId: id },
    });

    if (priceCount > 0) {
      throw new ConflictException('Sân đã có bảng giá nên không thể xóa');
    }

    return this.prisma.field.delete({
      where: { id },
    });
  }
}
