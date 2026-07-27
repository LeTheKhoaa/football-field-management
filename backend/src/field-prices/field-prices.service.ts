import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFieldPriceDto } from './dto/create-field-price.dto';
import { UpdateFieldPriceDto } from './dto/update-field-price.dto';

@Injectable()
export class FieldPricesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFieldPriceDto) {
    await this.validateRelations(dto.fieldId, dto.timeSlotId);

    const duplicated = await this.prisma.fieldPrice.findFirst({
      where: {
        fieldId: dto.fieldId,
        timeSlotId: dto.timeSlotId,
      },
    });

    if (duplicated) {
      throw new ConflictException('Sân đã có giá cho khung giờ này');
    }

    return this.prisma.fieldPrice.create({
      data: {
        fieldId: dto.fieldId,
        timeSlotId: dto.timeSlotId,
        price: dto.price,
      },
      include: {
        field: true,
        timeSlot: true,
      },
    });
  }

  async findAll(fieldId?: number, timeSlotId?: number) {
    return this.prisma.fieldPrice.findMany({
      where: {
        fieldId,
        timeSlotId,
      },
      include: {
        field: true,
        timeSlot: true,
      },
      orderBy: [
        {
          fieldId: 'asc',
        },
        {
          timeSlot: {
            startTime: 'asc',
          },
        },
      ],
    });
  }

  async findOne(id: number) {
    const fieldPrice = await this.prisma.fieldPrice.findUnique({
      where: { id },
      include: {
        field: true,
        timeSlot: true,
      },
    });

    if (!fieldPrice) {
      throw new NotFoundException('Không tìm thấy bảng giá');
    }

    return fieldPrice;
  }

  async update(id: number, dto: UpdateFieldPriceDto) {
    const current = await this.findOne(id);

    const fieldId = dto.fieldId ?? current.fieldId;
    const timeSlotId = dto.timeSlotId ?? current.timeSlotId;

    await this.validateRelations(fieldId, timeSlotId);

    const duplicated = await this.prisma.fieldPrice.findFirst({
      where: {
        fieldId,
        timeSlotId,
        NOT: {
          id,
        },
      },
    });

    if (duplicated) {
      throw new ConflictException('Sân đã có giá cho khung giờ này');
    }

    return this.prisma.fieldPrice.update({
      where: { id },
      data: {
        fieldId: dto.fieldId,
        timeSlotId: dto.timeSlotId,
        price: dto.price,
      },
      include: {
        field: true,
        timeSlot: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.fieldPrice.delete({
      where: { id },
    });
  }

  private async validateRelations(fieldId: number, timeSlotId: number) {
    const [field, timeSlot] = await Promise.all([
      this.prisma.field.findUnique({
        where: { id: fieldId },
      }),
      this.prisma.timeSlot.findUnique({
        where: { id: timeSlotId },
      }),
    ]);

    if (!field) {
      throw new NotFoundException('Sân bóng không tồn tại');
    }

    if (!timeSlot) {
      throw new NotFoundException('Khung giờ không tồn tại');
    }
  }
}
