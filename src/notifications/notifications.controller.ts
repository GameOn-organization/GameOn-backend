import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  createNotificationDto,
  ListNotificationsQuery,
  listNotificationsQuery,
} from './dto/create-notification.dto';
import { UpdateNotificationDto, updateNotificationDto } from './dto/update-notification.dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(createNotificationDto))
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    try {
      console.log('🔔 [NOTIFICATIONS CONTROLLER] Criando notificação...');
      console.log('🔔 [NOTIFICATIONS CONTROLLER] Dados recebidos:', JSON.stringify(createNotificationDto, null, 2));
      const result = await this.notificationsService.create(createNotificationDto);
      console.log('✅ [NOTIFICATIONS CONTROLLER] Notificação criada:', result.id);
      return result;
    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS CONTROLLER] Erro ao criar notificação:', error);
      console.error('❌ [NOTIFICATIONS CONTROLLER] Stack:', error.stack);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Query() rawQuery: any, @Request() req: any) {
    // Validar manualmente para ter mais controle
    console.log('🔍 [NOTIFICATIONS CONTROLLER] Query RAW recebida:', JSON.stringify(rawQuery, null, 2));
    console.log('🔍 [NOTIFICATIONS CONTROLLER] rawQuery.category:', rawQuery.category);
    console.log('🔍 [NOTIFICATIONS CONTROLLER] typeof rawQuery.category:', typeof rawQuery.category);
    
    const validationResult = listNotificationsQuery.safeParse(rawQuery);
    if (!validationResult.success) {
      console.error('❌ [NOTIFICATIONS CONTROLLER] Validação falhou:', validationResult.error);
      throw new HttpException('Invalid query parameters', HttpStatus.BAD_REQUEST);
    }
    
    const query = validationResult.data;
    console.log('✅ [NOTIFICATIONS CONTROLLER] Query validada:', JSON.stringify(query, null, 2));
    console.log('✅ [NOTIFICATIONS CONTROLLER] query.category após validação:', query.category);
    
    // Se não especificar userId, usar o usuário autenticado
    const userId = query.userId || req.user?.uid;
    
    if (!userId) {
      console.error('❌ [NOTIFICATIONS CONTROLLER] User ID não encontrado!');
      console.error('❌ [NOTIFICATIONS CONTROLLER] query.userId:', query.userId);
      console.error('❌ [NOTIFICATIONS CONTROLLER] req.user:', req.user);
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
    
    // Construir query limpa: apenas incluir category se estiver definida e não for undefined/null
    const cleanQuery: ListNotificationsQuery = {
      category: query.category || undefined, // Garantir que undefined não seja passado
      read: query.read,
      limit: query.limit,
      offset: query.offset,
    };
    
    // Remover campos undefined para não enviar ao service
    if (cleanQuery.category === undefined) {
      delete cleanQuery.category;
    }
    if (cleanQuery.read === undefined) {
      delete cleanQuery.read;
    }
    
    try {
      console.log('🔔 [NOTIFICATIONS CONTROLLER] Buscando notificações...');
      console.log('🔔 [NOTIFICATIONS CONTROLLER] userId:', userId);
      console.log('🔔 [NOTIFICATIONS CONTROLLER] Query limpa que será enviada ao service:', JSON.stringify(cleanQuery, null, 2));
      console.log('🔔 [NOTIFICATIONS CONTROLLER] Query category:', cleanQuery.category);
      console.log('🔔 [NOTIFICATIONS CONTROLLER] Query category type:', typeof cleanQuery.category);
      console.log('🔔 [NOTIFICATIONS CONTROLLER] Query tem category?', 'category' in cleanQuery);
      
      const result = await this.notificationsService.findByUser(userId, cleanQuery);
      console.log('✅ [NOTIFICATIONS CONTROLLER] Notificações encontradas:', result.length);
      if (result.length > 0) {
        console.log('✅ [NOTIFICATIONS CONTROLLER] Categorias das notificações retornadas:', result.map(n => n.category));
      }
      return result;
    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS CONTROLLER] Erro ao buscar notificações:', error);
      console.error('❌ [NOTIFICATIONS CONTROLLER] Stack:', error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('unread-count')
  @UseGuards(AuthGuard)
  getUnreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(req.user.uid);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard)
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('mark-all-read')
  @UseGuards(AuthGuard)
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.uid);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(updateNotificationDto))
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}

