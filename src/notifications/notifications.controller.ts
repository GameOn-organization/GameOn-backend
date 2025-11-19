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
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @UsePipes(new ZodValidationPipe(listNotificationsQuery))
  findAll(@Query() query: ListNotificationsQuery, @Request() req: any) {
    // Se não especificar userId, usar o usuário autenticado
    const userId = query.userId || req.user.uid;
    return this.notificationsService.findByUser(userId, query);
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

