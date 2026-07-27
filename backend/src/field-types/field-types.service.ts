import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFieldTypeDto } from './dto/create-field-type.dto';
import { UpdateFieldTypeDto } from './dto/update-field-type.dto';

@Injectable()
export class FieldTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFieldTypeDto) {
    const name = dto.name.trim();

    const existing = await this.prisma.fieldType.findUnique({
      where: {
        name,
      },
    });

    if (existing) {
      throw new ConflictException('Tên loại sân đã tồn tại');
    }

    return this.prisma.fieldType.create({
      data: {
        name,
        description: dto.description?.trim(),
      },
    });
  }

  async findAll() {
    return this.prisma.fieldType.findMany({
      include: {
        _count: {
          select: {
            fields: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const fieldType = await this.prisma.fieldType.findUnique({
      where: {
        id,
      },
      include: {
        fields: true,
      },
    });

    if (!fieldType) {
      throw new NotFoundException('Không tìm thấy loại sân');
    }

    return fieldType;
  }

  async update(id: number, dto: UpdateFieldTypeDto) {
    await this.findOne(id);

    if (dto.name) {
      const duplicated = await this.prisma.fieldType.findFirst({
        where: {
          name: dto.name.trim(),
          NOT: {
            id,
          },
        },
      });

      if (duplicated) {
        throw new ConflictException('Tên loại sân đã tồn tại');
      }
    }

    return this.prisma.fieldType.update({
      where: {
        id,
      },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
      },
    });
  }

  async remove(id: number) {
    const fieldType = await this.findOne(id);

    if (fieldType.fields.length > 0) {
      throw new ConflictException('Không thể xóa loại sân đang có sân sử dụng');
    }

    return this.prisma.fieldType.delete({
      where: {
        id,
      },
    });
  }
}
