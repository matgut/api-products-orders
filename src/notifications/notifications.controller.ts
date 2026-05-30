import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NotificationStatus, Role } from '../common/enums';
import { NotificationLog } from './entities/notification-log.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('notifications')
export class NotificationsController {
  constructor(
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar logs de notificaciones (solo super_admin)' })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('orderId') orderId?: string,
    @Query('status') status?: NotificationStatus,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    const qb = this.notificationLogRepository
      .createQueryBuilder('log')
      .orderBy('log.sentAt', 'DESC');

    if (orderId) {
      qb.andWhere('log.orderId = :orderId', { orderId });
    }
    if (status) {
      qb.andWhere('log.status = :status', { status });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { total, page, limit } };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener log de notificación por id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationLogRepository.findOne({ where: { id } });
  }
}
