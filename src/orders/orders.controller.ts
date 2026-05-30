import {
    Body,
    Controller,
    Delete,
    Get,
    Header,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { I18nLang } from 'nestjs-i18n';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrderStatus, Role } from '../common/enums';
import { User } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear pedido (público)' })
  create(@Body() dto: CreateOrderDto, @I18nLang() lang: string) {
    return this.ordersService.create(dto, lang);
  }

  // Va ANTES de :id para que 'track' no sea interpretado como un UUID
  @Get('track/:token')
  @ApiOperation({ summary: 'Seguimiento de pedido por token (público)' })
  trackOrder(@Param('token') token: string) {
    return this.ordersService.findByTrackingToken(token);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar pedidos de un negocio' })
  @ApiQuery({ name: 'businessId', required: true })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiQuery({ name: 'phone', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('businessId') businessId: string,
    @Query('status') status: OrderStatus,
    @Query('date') date: string,
    @Query('phone') phone: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @I18nLang() lang: string,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.findAll(
      businessId,
      lang,
      user,
      status,
      date,
      phone,
      page,
      limit,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener pedido por id' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @I18nLang() lang: string,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.findOne(id, lang, user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado del pedido' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @I18nLang() lang: string,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.updateStatus(id, dto, lang, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar pedido (solo super_admin)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @I18nLang() lang: string,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.remove(id, lang, user);
  }

  @Get('export/csv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exportar pedidos a CSV (solo super_admin)' })
  @ApiQuery({ name: 'businessId', required: true })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'date', required: false, type: String })
  @Header('Content-Type', 'application/octet-stream')
  @Header('Content-Disposition', 'attachment; filename="orders.csv"')
  async exportCsv(
    @Query('businessId') businessId: string,
    @Query('status') status: OrderStatus,
    @Query('date') date: string,
    @Res() res: Response,
  ) {
    const csv = await this.ordersService.exportCsv({ businessId, status, date });
    res.send(csv);
  }
}
