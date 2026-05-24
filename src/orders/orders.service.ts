import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity';
import { Language, OrderStatus } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  private static readonly TRACKING_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

  private static generateTrackingToken(): string {
    const bytes = randomBytes(8);
    const raw = Array.from(bytes)
      .map((b) => OrdersService.TRACKING_ALPHABET[b % OrdersService.TRACKING_ALPHABET.length])
      .join('');
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  }

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly notificationsService: NotificationsService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateOrderDto, lang: string) {
    const orderLang = dto.language ?? Language.ES;

    const business = await this.businessRepository.findOne({
      where: { id: dto.businessId },
    });

    if (!business) {
      throw new NotFoundException(
        await this.i18n.translate('common.not_found', { lang }),
      );
    }

    // Validar y construir items
    const items: OrderItem[] = [];
    let total = 0;

    for (const itemDto of dto.items) {
      const product = await this.productsRepository.findOne({
        where: { id: itemDto.productId, businessId: dto.businessId },
        relations: { translations: true },
      });

      if (!product) {
        throw new BadRequestException(
          await this.i18n.translate('orders.invalid_product', {
            lang,
            args: { id: itemDto.productId },
          }),
        );
      }

      if (!product.available) {
        const translation =
          product.translations.find((t) => t.language === orderLang) ??
          product.translations[0];
        throw new BadRequestException(
          await this.i18n.translate('orders.product_unavailable', {
            lang,
            args: { name: translation?.name ?? product.id },
          }),
        );
      }

      if (product.stock !== null && product.stock < itemDto.quantity) {
        const translation =
          product.translations.find((t) => t.language === orderLang) ??
          product.translations[0];
        throw new BadRequestException(
          await this.i18n.translate('orders.insufficient_stock', {
            lang,
            args: { name: translation?.name ?? product.id },
          }),
        );
      }

      const translation =
        product.translations.find((t) => t.language === orderLang) ??
        product.translations[0];

      const item = this.orderItemsRepository.create({
        productId: product.id,
        quantity: itemDto.quantity,
        unitPrice: product.price,
        productNameSnapshot: translation?.name ?? product.id,
      });

      items.push(item);
      total += Number(product.price) * itemDto.quantity;

      // Descontar stock si aplica
      if (product.stock !== null) {
        product.stock -= itemDto.quantity;
        await this.productsRepository.save(product);
      }
    }

    const order = this.ordersRepository.create({
      customerName: dto.customerName,
      phone: dto.phone,
      email: dto.email,
      deliveryDate: dto.deliveryDate,
      notes: dto.notes,
      businessId: dto.businessId,
      language: orderLang,
      total: parseFloat(total.toFixed(2)),
      trackingToken: OrdersService.generateTrackingToken(),
      items,
    });

    const saved = await this.ordersRepository.save(order);

    // Notificación asíncrona — no bloquea la respuesta
    setImmediate(() => {
      this.notificationsService
        .notifyNewOrder(saved, business)
        .catch((err: unknown) => {
          console.error('Error sending new order notification:', err);
        });
    });

    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const trackingUrl = `${appUrl}/api/v1/orders/track/${saved.trackingToken}`;

    return {
      data: { ...saved, trackingUrl },
      message: await this.i18n.translate('orders.created', { lang }),
    };
  }

  async findAll(
    businessId: string,
    lang: string,
    status?: OrderStatus,
    date?: string,
    phone?: string,
    page = 1,
    limit = 10,
  ) {
    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .where('order.businessId = :businessId', { businessId });

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    if (date) {
      qb.andWhere('order.deliveryDate = :date', { date });
    }

    if (phone) {
      qb.andWhere('order.phone ILIKE :phone', { phone: `%${phone}%` });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('order.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      meta: { total, page, limit },
      message: await this.i18n.translate('orders.list', { lang }),
    };
  }

  async findOne(id: string, lang: string) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { items: true, business: true },
    });

    if (!order) {
      throw new NotFoundException(
        await this.i18n.translate('orders.not_found', { lang }),
      );
    }

    return { data: order };
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    lang: string,
  ) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { items: true, business: true },
    });

    if (!order) {
      throw new NotFoundException(
        await this.i18n.translate('orders.not_found', { lang }),
      );
    }

    const business = await this.businessRepository.findOne({
      where: { id: order.businessId },
    });

    order.status = dto.status;
    const saved = await this.ordersRepository.save(order);

    // Notificar al cliente de forma asíncrona cuando el estado cambia
    if (
      business &&
      (dto.status === OrderStatus.CONFIRMED || dto.status === OrderStatus.READY)
    ) {
      const event =
        dto.status === OrderStatus.CONFIRMED ? 'confirmed' : 'ready';
      setImmediate(() => {
        this.notificationsService
          .notifyCustomer(saved, business, event)
          .catch((err: unknown) => {
            console.error('Error sending customer notification:', err);
          });
      });
    }

    return {
      data: saved,
      message: await this.i18n.translate('orders.status_updated', {
        lang,
        args: { status: dto.status },
      }),
    };
  }

  async remove(id: string, lang: string) {
    const order = await this.ordersRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(
        await this.i18n.translate('orders.not_found', { lang }),
      );
    }

    await this.ordersRepository.remove(order);

    return {
      data: null,
      message: await this.i18n.translate('orders.deleted', { lang }),
    };
  }

  async findByTrackingToken(token: string) {
    const order = await this.ordersRepository.findOne({
      where: { trackingToken: token },
      relations: { items: true, business: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Solo exponer campos públicos — sin datos sensibles
    return {
      data: {
        id: order.id,
        status: order.status,
        customerName: order.customerName,
        deliveryDate: order.deliveryDate,
        total: order.total,
        createdAt: order.createdAt,
        businessName: order.business?.name,
        items: order.items.map((item) => ({
          productName: item.productNameSnapshot,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    };
  }
}
