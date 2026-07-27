import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';

@Injectable()
export class TimeSlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTimeSlotDto) {
    this.validateTimeRange(dto.startTime, dto.endTime);

    const duplicated = await this.prisma.timeSlot.findFirst({
      where: {
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });

    if (duplicated) {
      throw new ConflictException('Khung giờ này đã tồn tại');
    }

    return this.prisma.timeSlot.create({
      data: {
        name: dto.name.trim(),
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });
  }

  async findAll() {
    return this.prisma.timeSlot.findMany({
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!timeSlot) {
      throw new NotFoundException('Không tìm thấy khung giờ');
    }

    return timeSlot;
  }

  async update(id: number, dto: UpdateTimeSlotDto) {
    const current = await this.findOne(id);

    const startTime = dto.startTime ?? current.startTime;
    const endTime = dto.endTime ?? current.endTime;

    this.validateTimeRange(startTime, endTime);

    const duplicated = await this.prisma.timeSlot.findFirst({
      where: {
        startTime,
        endTime,
        NOT: {
          id,
        },
      },
    });

    if (duplicated) {
      throw new ConflictException('Khung giờ này đã tồn tại');
    }

    return this.prisma.timeSlot.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const fieldPriceCount = await this.prisma.fieldPrice.count({
      where: {
        timeSlotId: id,
      },
    });

    if (fieldPriceCount > 0) {
      throw new ConflictException(
        'Khung giờ đang được sử dụng trong bảng giá nên không thể xóa',
      );
    }

    const bookingItemCount = await this.prisma.bookingItem.count({
      where: {
        timeSlotId: id,
      },
    });

    if (bookingItemCount > 0) {
      throw new ConflictException('Khung giờ đã có lịch đặt nên không thể xóa');
    }

    return this.prisma.timeSlot.delete({
      where: { id },
    });
  }

  private validateTimeRange(startTime: string, endTime: string) {
    const startMinutes = this.convertToMinutes(startTime);
    const endMinutes = this.convertToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('Giờ kết thúc phải lớn hơn giờ bắt đầu');
    }
  }

  private convertToMinutes(time: string) {
    const [hour, minute] = time.split(':').map(Number);

    return hour * 60 + minute;
  }
}
